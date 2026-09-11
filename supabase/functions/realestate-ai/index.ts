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

const serializeJob = (row: any) => ({ ...row, projectId: row.projectid, sourceAssetId: row.source_asset_id, requestedBy: row.requested_by, inputManifest: row.input_manifest || {}, extractedData: row.extracted_data || null, validationErrors: row.validation_errors || [], aiMetadata: row.ai_metadata || null, createdAt: row.createdat, startedAt: row.startedat, completedAt: row.completedat });

async function listJobs(projectId: string) {
  const { data, error } = await db.from("content_ingestion_jobs").select("*").eq("projectid", projectId).order("createdat", { ascending: false });
  if (error) throw error;
  return (data || []).map(serializeJob);
}

async function processOpenAI(job: any, assets: any[]) {
  const apiKey = Deno.env.get("OPENAI_API_KEY") || "";
  if (!apiKey) throw Object.assign(new Error("AI provider is not configured: OPENAI_API_KEY is missing"), { status: 503 });
  const model = Deno.env.get("OPENAI_MODEL") || "gpt-5.6-luna";
  const content: any[] = [{ type: "input_text", text: `You are the structured ingestion engine for a real-estate virtual showroom. Analyze the supplied project material. Return ONLY valid JSON matching this shape: {"structure":{"buildings":[],"floors":[],"units":[],"amenities":[]},"scene":{"environment":{},"anchors":[]},"media":{"assets":[],"hotspots":[]},"confidence":0,"notes":[],"sources":[]}. Never invent measurements, prices, unit numbers or geometry. Use null when unknown. For every inferred value include a source filename and confidence. Job kind: ${job.kind}. Context: ${String(job.input_manifest?.notes || "")}` }];
  for (const asset of assets) {
    const { data: signed, error } = await db.storage.from("project-assets").createSignedUrl(asset.path, 900);
    if (error) throw error;
    if (asset.mimetype?.startsWith("image/")) content.push({ type: "input_image", image_url: signed.signedUrl });
    else if (asset.mimetype === "application/pdf" || asset.mimetype?.includes("spreadsheet") || asset.mimetype === "text/csv") content.push({ type: "input_file", file_url: signed.signedUrl });
    else content.push({ type: "input_text", text: `Source asset: ${asset.name} (${asset.mimetype}). Storage path: ${asset.path}. This asset must be reviewed by a human if its contents cannot be directly interpreted.` });
  }

  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model, input: [{ role: "user", content }], max_output_tokens: 12000 }) });
  const raw = await response.text();
  if (!response.ok) throw new Error(`AI provider error ${response.status}: ${raw.slice(0, 1000)}`);
  const payload = JSON.parse(raw);
  const outputText = payload.output_text || (payload.output || []).flatMap((item: any) => item.content || []).map((part: any) => part.text || "").join("");
  const cleaned = String(outputText).replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  let extractedData: any;
  try { extractedData = JSON.parse(cleaned); } catch { throw new Error("AI provider returned invalid JSON; job requires manual retry"); }
  return { extractedData, metadata: { provider: "openai", model, responseId: payload.id || null } };
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
        const { data: job, error } = await db.from("content_ingestion_jobs").insert({ id: id(), companyid: company.id, projectid: projectId, source_asset_id: sourceAssetIds[0], kind, status: "QUEUED", requested_by: String(body.requestedBy || company.id), input_manifest: inputManifest, extracted_data: null, validation_errors: [], ai_metadata: { pipeline: "schema-first", provider: "openai" }, createdat: now() }).select().single();
        if (error) throw error;
        return json(serializeJob(job), 201);
      }

      if (jobId && path[4] === "process" && req.method === "POST") {
        const { data: job, error: jobError } = await db.from("content_ingestion_jobs").select("*").eq("id", jobId).eq("projectid", projectId).maybeSingle();
        if (jobError) throw jobError;
        if (!job) return fail("Job not found", 404);
        if (!["QUEUED", "FAILED"].includes(String(job.status))) return fail(`job cannot be processed from ${job.status}`, 409);
        const sourceIds = Array.isArray(job.input_manifest?.assets) ? job.input_manifest.assets.map((asset: any) => asset.id).filter(Boolean) : [];
        const { data: assets, error: assetError } = await db.from("assets").select("id,name,path,mimetype,metadata,projectid").in("id", sourceIds).eq("projectid", projectId);
        if (assetError) throw assetError;
        await db.from("content_ingestion_jobs").update({ status: "PROCESSING", startedat: now(), validation_errors: [] }).eq("id", jobId).eq("projectid", projectId);
        try {
          const result = await processOpenAI(job, assets || []);
          const validationErrors = [];
          if (!result.extractedData || typeof result.extractedData !== "object") validationErrors.push({ path: "extractedData", message: "AI response is not an object" });
          const nextStatus = validationErrors.length ? "REVIEW_REQUIRED" : "READY";
          const { data: updated, error: updateError } = await db.from("content_ingestion_jobs").update({ status: nextStatus, extracted_data: result.extractedData, validation_errors: validationErrors, ai_metadata: { ...(job.ai_metadata || {}), ...result.metadata }, completedat: now() }).eq("id", jobId).eq("projectid", projectId).select().single();
          if (updateError) throw updateError;
          return json(serializeJob(updated));
        } catch (processingError) {
          await db.from("content_ingestion_jobs").update({ status: "FAILED", validation_errors: [{ path: "provider", message: processingError instanceof Error ? processingError.message : "AI processing failed" }], completedat: now() }).eq("id", jobId).eq("projectid", projectId);
          throw processingError;
        }
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
        const manifest = { schemaVersion: 1, projectId, projectName: project.name, generatedBy: "content-ingestion-approval", sourceJobId: jobId, sourceAssetIds: Array.isArray(job.input_manifest?.assets) ? job.input_manifest.assets.map((a: any) => a.id) : [], structure: approvedData.structure || {}, scene: approvedData.scene || {}, media: approvedData.media || {} };
        const { data: existing } = await db.from("project_experience_configs").select("id").eq("projectid", projectId).maybeSingle();
        const configPayload = { schema_version: 1, config: manifest, generated_by: "content-ingestion-approval", approved: true, updatedat: now() };
        if (existing) { const { error: configError } = await db.from("project_experience_configs").update(configPayload).eq("id", existing.id); if (configError) throw configError; }
        else { const { error: configError } = await db.from("project_experience_configs").insert({ id: id(), projectid: projectId, createdat: now(), ...configPayload }); if (configError) throw configError; }
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
