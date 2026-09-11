import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !secretKey) throw new Error("Supabase secret key is not configured");
const db = createClient(supabaseUrl, secretKey);

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-api-key, content-type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });
const fail = (message: string, status = 400) => json({ message }, status);
const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const kinds = new Set(["PROJECT_PACKAGE", "PLAN_EXTRACTION", "ASSET_CLASSIFICATION"]);

async function companyByKey(key: string) {
  if (!key) return null;
  const { data, error } = await db.from("companies").select("id,name,status").eq("apikey", key).maybeSingle();
  if (error) throw error;
  return data;
}

async function ownProject(req: Request, projectId: string) {
  const company = await companyByKey(req.headers.get("x-api-key") || "");
  if (!company || company.status !== "ACTIVE") throw Object.assign(new Error("invalid api key"), { status: 401 });
  const { data: project, error } = await db.from("projects").select("id,companyid,name,environmentconfig,publicationconfig").eq("id", projectId).maybeSingle();
  if (error) throw error;
  if (!project) throw Object.assign(new Error("Project not found"), { status: 404 });
  if (String(project.companyid) !== String(company.id)) throw Object.assign(new Error("project access denied"), { status: 403 });
  return { company, project };
}

const serializeJob = (row: any) => ({
  ...row,
  projectId: row.projectid,
  sourceAssetId: row.source_asset_id,
  requestedBy: row.requested_by,
  inputManifest: row.input_manifest || {},
  extractedData: row.extracted_data || null,
  validationErrors: row.validation_errors || [],
  aiMetadata: row.ai_metadata || null,
  createdAt: row.createdat,
  startedAt: row.startedat,
  completedAt: row.completedat,
});

async function listJobs(projectId: string) {
  const { data, error } = await db.from("content_ingestion_jobs").select("*").eq("projectid", projectId).order("createdat", { ascending: false });
  if (error) throw error;
  return (data || []).map(serializeJob);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: cors });
  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/realestate-ai/, "").replace(/^\/+/, "").split("/").filter(Boolean);
    if (path[0] === "health") return json({ status: "ok", service: "realestate-ai" });

    if (path[0] === "projects" && path[1] && path[2] === "jobs") {
      const projectId = path[1];
      const { company, project } = await ownProject(req, projectId);
      const jobId = path[3];

      if (!jobId && req.method === "GET") return json(await listJobs(projectId));

      if (!jobId && req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        const kind = String(body.kind || "PROJECT_PACKAGE");
        if (!kinds.has(kind)) return fail("invalid ingestion kind", 400);
        const sourceAssetIds = Array.isArray(body.sourceAssetIds) ? body.sourceAssetIds.map(String).filter(Boolean) : [];
        if (!sourceAssetIds.length) return fail("sourceAssetIds is required", 400);
        const { data: assets, error: assetError } = await db.from("assets").select("id,name,path,mimetype,metadata,projectid").in("id", sourceAssetIds).eq("projectid", projectId);
        if (assetError) throw assetError;
        if ((assets || []).length !== sourceAssetIds.length) return fail("one or more source assets do not belong to this project", 400);
        const inputManifest = { kind, notes: String(body.notes || "").slice(0, 5000), assets: assets || [], requestedAt: now() };
        const { data: job, error } = await db.from("content_ingestion_jobs").insert({
          id: id(), companyid: company.id, projectid: projectId, source_asset_id: sourceAssetIds[0], kind,
          status: "QUEUED", requested_by: String(body.requestedBy || company.id), input_manifest: inputManifest,
          extracted_data: null, validation_errors: [], ai_metadata: { pipeline: "schema-first", provider: Deno.env.get("AI_PROVIDER") || "not-configured" }, createdat: now(),
        }).select().single();
        if (error) throw error;
        return json(serializeJob(job), 201);
      }

      if (jobId && req.method === "GET") {
        const { data: job, error } = await db.from("content_ingestion_jobs").select("*").eq("id", jobId).eq("projectid", projectId).maybeSingle();
        if (error) throw error;
        return job ? json(serializeJob(job)) : fail("Job not found", 404);
      }

      if (jobId && path[4] === "approve" && req.method === "POST") {
        const { data: job, error: jobError } = await db.from("content_ingestion_jobs").select("*").eq("id", jobId).eq("projectid", projectId).maybeSingle();
        if (jobError) throw jobError;
        if (!job) return fail("Job not found", 404);
        if (!["REVIEW_REQUIRED", "READY"].includes(String(job.status))) return fail(`job cannot be approved from ${job.status}`, 409);
        const body = await req.json().catch(() => ({}));
        const approvedData = body.extractedData && typeof body.extractedData === "object" ? body.extractedData : job.extracted_data;
        if (!approvedData || typeof approvedData !== "object") return fail("extractedData is required for approval", 400);
        const { data: updated, error } = await db.from("content_ingestion_jobs").update({ status: "APPROVED", extracted_data: approvedData, validation_errors: [], completedat: now(), ai_metadata: { ...(job.ai_metadata || {}), approvedBy: String(body.approvedBy || company.id), approvedAt: now() } }).eq("id", jobId).eq("projectid", projectId).select().single();
        if (error) throw error;

        const manifest = {
          schemaVersion: 1,
          projectId,
          projectName: project.name,
          generatedBy: "content-ingestion-approval",
          sourceJobId: jobId,
          sourceAssetIds: Array.isArray(job.input_manifest?.assets) ? job.input_manifest.assets.map((a: any) => a.id) : [],
          structure: approvedData.structure || {},
          scene: approvedData.scene || {},
          media: approvedData.media || {},
        };
        const { data: existing } = await db.from("project_experience_configs").select("id").eq("projectid", projectId).maybeSingle();
        const configPayload = { schema_version: 1, config: manifest, generated_by: "content-ingestion-approval", approved: true, updatedat: now() };
        if (existing) {
          const { error: configError } = await db.from("project_experience_configs").update(configPayload).eq("id", existing.id);
          if (configError) throw configError;
        } else {
          const { error: configError } = await db.from("project_experience_configs").insert({ id: id(), projectid: projectId, createdat: now(), ...configPayload });
          if (configError) throw configError;
        }
        return json({ job: serializeJob(updated), experienceConfig: manifest });
      }
    }

    return fail("Not found", 404);
  } catch (error) {
    console.error(error);
    const status = typeof error === "object" && error && "status" in error ? Number((error as any).status) : 500;
    return fail(error instanceof Error ? error.message : "Request failed", status || 500);
  }
});
