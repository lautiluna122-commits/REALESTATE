import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !secretKey) throw new Error("Supabase secret key is not configured");
const db = createClient(supabaseUrl, secretKey);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, x-platform-key, x-share-token, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { ...cors, "Content-Type": "application/json" },
});

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

async function platformAuth(req: Request) {
  const supplied = req.headers.get("x-platform-key") || "";
  if (!supplied) return false;
  const configured = Deno.env.get("PLATFORM_API_KEY") || secretKeys.platform || "";
  if (configured && supplied === configured) return true;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(supplied));
  const hash = Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");
  const { data, error } = await db.from("platform_access").select("id").eq("password_hash", hash).eq("status","ACTIVE").maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function accessByToken(token: string) {
  if (!token) return null;
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const tokenhash = Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");
  const { data, error } = await db.from("project_access_links").select("*").eq("tokenhash", tokenhash).eq("status","ACTIVE").maybeSingle();
  if (error) throw error;
  if (!data || (data.expiresat && new Date(data.expiresat) <= new Date())) return null;
  return data;
}

async function ownProject(req: Request, projectId: string) {
  const { data: project, error } = await db.from("projects").select("id,companyid,name").eq("id", projectId).maybeSingle();
  if (error) throw error;
  if (!project) throw Object.assign(new Error("Project not found"), { status: 404 });

  const share = await accessByToken(req.headers.get("x-share-token") || "");
  if (share) {
    if (String(share.projectid) !== String(projectId)) throw Object.assign(new Error("share link is scoped to another project"), { status: 403 });
    const { data: company } = await db.from("companies").select("id,name,status").eq("id", project.companyid).maybeSingle();
    if (!company || company.status !== "ACTIVE") throw Object.assign(new Error("project access denied"), { status: 403 });
    return { company, project, share };
  }

  const company = await companyByKey(req.headers.get("x-api-key") || "");
  if (company && company.status === "ACTIVE" && String(project.companyid) === String(company.id)) return { company, project };

  if (await platformAuth(req)) {
    const { data: platformCompany } = await db.from("companies").select("id,name,status").eq("id", project.companyid).maybeSingle();
    return { company: platformCompany || { id: project.companyid, name: "Platform", status: "ACTIVE" }, project, platform: true };
  }

  throw Object.assign(new Error("project access denied"), { status: 401 });
}

function serializeJob(row: any) {
  return {
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
  };
}

async function getAssets(projectId: string, ids: string[]) {
  const { data, error } = await db
    .from("assets")
    .select("id,name,path,mimetype,metadata,projectid")
    .in("id", ids)
    .eq("projectid", projectId);
  if (error) throw error;
  if ((data || []).length !== ids.length) throw new Error("one or more source assets do not belong to this project");
  return data || [];
}

async function processWithOpenAI(job: any, assets: any[]) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw Object.assign(new Error("AI provider is not configured: OPENAI_API_KEY is missing"), { status: 503 });
  }

  const model = Deno.env.get("OPENAI_MODEL") || "gpt-5.6-luna";
  const content: any[] = [{
    type: "input_text",
    text: [
      "You are the structured ingestion engine for a real-estate virtual showroom.",
      "Analyze the supplied project material and return ONLY valid JSON.",
      "Schema: {structure:{buildings:[{name,reference}],floors:[{buildingName,buildingReference,number,name}],units:[{buildingName,buildingReference,floorNumber,number,surface,bedrooms,bathrooms,terrace,price,currency,status,description}],amenities:[{name,description,category}]},scene:{environment:{},anchors:[]},media:{assets:[],hotspots:[]},confidence:0,notes:[],sources:[]}",
      "For structure, use exact source values only. Do not invent building/floor/unit identifiers. Units must reference an existing or proposed building and floor by name/reference/number.",
      "Never invent measurements, prices, unit numbers or geometry. Use null when unknown.",
      "For inferred values include source filename and confidence.",
      `Job kind: ${job.kind}`,
      `Context: ${String(job.input_manifest?.notes || "")}`,
    ].join("\n"),
  }];

  for (const asset of assets) {
    const { data: signed, error } = await db.storage.from("project-assets").createSignedUrl(asset.path, 900);
    if (error) throw error;

    if (asset.mimetype?.startsWith("image/")) {
      content.push({ type: "input_image", image_url: signed.signedUrl });
    } else if (
      asset.mimetype === "application/pdf" ||
      asset.mimetype?.includes("spreadsheet") ||
      asset.mimetype === "text/csv"
    ) {
      content.push({ type: "input_file", file_url: signed.signedUrl });
    } else {
      content.push({
        type: "input_text",
        text: `Source asset: ${asset.name} (${asset.mimetype}). Review this file manually if its contents are not directly interpretable.`,
      });
    }
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [{ role: "user", content }],
      max_output_tokens: 12000,
    }),
  });

  const raw = await response.text();
  if (!response.ok) throw new Error(`AI provider error ${response.status}: ${raw.slice(0, 1000)}`);

  const payload = JSON.parse(raw);
  const outputText = payload.output_text || (payload.output || [])
    .flatMap((item: any) => item.content || [])
    .map((part: any) => part.text || "")
    .join("");
  const cleaned = String(outputText)
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let extractedData: any;
  try {
    extractedData = JSON.parse(cleaned);
  } catch {
    throw new Error("AI provider returned invalid JSON; job requires manual retry");
  }

  return {
    extractedData,
    metadata: { provider: "openai", model, responseId: payload.id || null },
  };
}

async function applyApprovedData(projectId: string, extractedData: any) {
  const structure = extractedData?.structure || {};
  const buildings = Array.isArray(structure.buildings) ? structure.buildings : [];
  const floors = Array.isArray(structure.floors) ? structure.floors : [];
  const units = Array.isArray(structure.units) ? structure.units : [];
  const amenities = Array.isArray(structure.amenities) ? structure.amenities : [];
  const key = (value: any) => String(value ?? "").trim().toLowerCase();
  const buildingMap = new Map<string, string>();
  const floorMap = new Map<string, string>();

  const existingBuildings = await db.from("buildings").select("*").eq("projectid", projectId);
  if (existingBuildings.error) throw existingBuildings.error;
  for (const b of existingBuildings.data || []) {
    buildingMap.set(key(b.id), b.id);
    buildingMap.set(key(b.name), b.id);
    if (b.reference) buildingMap.set(key(b.reference), b.id);
  }

  for (const item of buildings) {
    const name = String(item.name || item.reference || "").trim();
    if (!name) continue;
    const reference = String(item.reference || "").trim();
    let buildingId = buildingMap.get(key(reference)) || buildingMap.get(key(name));
    if (!buildingId) {
      const inserted = await db.from("buildings").insert({
        id: id(), projectid: projectId, name, reference,
        metadata: { source: "ai-approved" }, createdat: now()
      }).select().single();
      if (inserted.error) throw inserted.error;
      buildingId = inserted.data.id;
      buildingMap.set(key(name), buildingId);
      if (reference) buildingMap.set(key(reference), buildingId);
    }
  }

  const existingFloors = await db.from("floors").select("*").eq("projectid", projectId);
  if (existingFloors.error) throw existingFloors.error;
  for (const f of existingFloors.data || []) floorMap.set(`${f.buildingid}:${f.number}`, f.id);

  for (const item of floors) {
    const number = Number(item.number ?? item.floorNumber);
    if (!Number.isFinite(number)) continue;
    const buildingId = buildingMap.get(key(item.buildingReference)) || buildingMap.get(key(item.buildingName));
    if (!buildingId) continue;
    const mapKey = `${buildingId}:${number}`;
    if (floorMap.has(mapKey)) continue;
    const inserted = await db.from("floors").insert({
      id: id(), projectid: projectId, buildingid: buildingId, number,
      name: String(item.name || ""), metadata: { source: "ai-approved" }, createdat: now()
    }).select().single();
    if (inserted.error) throw inserted.error;
    floorMap.set(mapKey, inserted.data.id);
  }

  for (const item of units) {
    const buildingId = buildingMap.get(key(item.buildingReference)) || buildingMap.get(key(item.buildingName));
    const floorNumber = Number(item.floorNumber ?? item.floor);
    const floorId = Number.isFinite(floorNumber) && buildingId ? floorMap.get(`${buildingId}:${floorNumber}`) : null;
    const number = String(item.number || "").trim();
    if (!buildingId || !floorId || !number) continue;

    const values: any = {
      surface: Number(item.surface || 0),
      bedrooms: Number(item.bedrooms || 0),
      bathrooms: Number(item.bathrooms || 0),
      terrace: Number(item.terrace || 0),
      price: Number(item.price || 0),
      currency: ["USD","UYU","ARS","EUR"].includes(String(item.currency || "USD")) ? String(item.currency || "USD") : "USD",
      status: ["AVAILABLE","RESERVED","SOLD","HIDDEN"].includes(String(item.status || "AVAILABLE")) ? String(item.status || "AVAILABLE") : "AVAILABLE",
      description: String(item.description || ""),
    };
    for (const n of ["surface","bedrooms","bathrooms","terrace","price"]) {
      if (!Number.isFinite(values[n]) || values[n] < 0) throw new Error(`Invalid AI unit value: ${n}`);
    }

    const existing = await db.from("units").select("id").eq("projectid", projectId)
      .eq("floorid", floorId).eq("number", number).maybeSingle();
    if (existing.error) throw existing.error;

    if (existing.data) {
      const updated = await db.from("units").update(values).eq("id", existing.data.id).eq("projectid", projectId).select().single();
      if (updated.error) throw updated.error;
    } else {
      const inserted = await db.from("units").insert({
        id: id(), projectid: projectId, buildingid: buildingId, floorid: floorId, number, ...values, createdat: now()
      }).select().single();
      if (inserted.error) throw inserted.error;
    }
  }

  for (const item of amenities) {
    const name = String(item.name || "").trim();
    if (!name) continue;
    const existing = await db.from("amenities").select("id").eq("projectid", projectId).ilike("name", name).maybeSingle();
    if (existing.error) throw existing.error;
    const values = { name, description: String(item.description || ""), category: String(item.category || "common") };
    if (existing.data) {
      const updated = await db.from("amenities").update(values).eq("id", existing.data.id).eq("projectid", projectId).select().single();
      if (updated.error) throw updated.error;
    } else {
      const inserted = await db.from("amenities").insert({ id: id(), projectid: projectId, ...values, createdat: now() }).select().single();
      if (inserted.error) throw inserted.error;
    }
  }

  return { buildingsApplied: buildings.length, floorsApplied: floors.length, unitsApplied: units.length, amenitiesApplied: amenities.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: cors });

  try {
    const url = new URL(req.url);
    const path = url.pathname
      .replace(/^\/realestate-ai/, "")
      .replace(/^\/+/, "")
      .split("/")
      .filter(Boolean);

    if (path[0] === "health") return json({ status: "ok", service: "realestate-ai" });

    if (path[0] !== "projects" || !path[1] || path[2] !== "jobs") return fail("Not found", 404);

    const projectId = path[1];
    const { company, project } = await ownProject(req, projectId);
    const jobId = path[3];

    if (!jobId && req.method === "GET") {
      const { data, error } = await db.from("content_ingestion_jobs")
        .select("*").eq("projectid", projectId).order("createdat", { ascending: false });
      if (error) throw error;
      return json((data || []).map(serializeJob));
    }

    if (!jobId && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const kind = String(body.kind || "PROJECT_PACKAGE");
      if (!kinds.has(kind)) return fail("invalid ingestion kind", 400);

      const sourceAssetIds = Array.isArray(body.sourceAssetIds)
        ? body.sourceAssetIds.map(String).filter(Boolean)
        : [];
      if (!sourceAssetIds.length) return fail("sourceAssetIds is required", 400);

      const assets = await getAssets(projectId, sourceAssetIds);
      const inputManifest = {
        kind,
        notes: String(body.notes || "").slice(0, 5000),
        assets,
        requestedAt: now(),
      };

      const { data: job, error } = await db.from("content_ingestion_jobs").insert({
        id: id(),
        companyid: company.id,
        projectid: projectId,
        source_asset_id: sourceAssetIds[0],
        kind,
        status: "QUEUED",
        requested_by: String(body.requestedBy || company.id),
        input_manifest: inputManifest,
        extracted_data: null,
        validation_errors: [],
        ai_metadata: { pipeline: "schema-first", provider: "openai" },
        createdat: now(),
      }).select().single();
      if (error) throw error;
      return json(serializeJob(job), 201);
    }

    if (jobId && path[4] === "process" && req.method === "POST") {
      const { data: job, error } = await db.from("content_ingestion_jobs")
        .select("*").eq("id", jobId).eq("projectid", projectId).maybeSingle();
      if (error) throw error;
      if (!job) return fail("Job not found", 404);
      if (!["QUEUED", "FAILED"].includes(String(job.status))) {
        return fail(`job cannot be processed from ${job.status}`, 409);
      }

      const sourceIds = Array.isArray(job.input_manifest?.assets)
        ? job.input_manifest.assets.map((asset: any) => asset.id).filter(Boolean)
        : [];
      const assets = await getAssets(projectId, sourceIds);
      await db.from("content_ingestion_jobs")
        .update({ status: "PROCESSING", startedat: now(), validation_errors: [] })
        .eq("id", jobId).eq("projectid", projectId);

      try {
        const result = await processWithOpenAI(job, assets);
        const { data: updated, error: updateError } = await db.from("content_ingestion_jobs")
          .update({
            status: "REVIEW_REQUIRED",
            extracted_data: result.extractedData,
            validation_errors: [],
            ai_metadata: { ...(job.ai_metadata || {}), ...result.metadata },
            completedat: now(),
          })
          .eq("id", jobId).eq("projectid", projectId).select().single();
        if (updateError) throw updateError;
        return json(serializeJob(updated));
      } catch (processingError) {
        await db.from("content_ingestion_jobs").update({
          status: "FAILED",
          validation_errors: [{ path: "provider", message: processingError instanceof Error ? processingError.message : "AI processing failed" }],
          completedat: now(),
        }).eq("id", jobId).eq("projectid", projectId);
        throw processingError;
      }
    }

    if (jobId && req.method === "GET") {
      const { data: job, error } = await db.from("content_ingestion_jobs")
        .select("*").eq("id", jobId).eq("projectid", projectId).maybeSingle();
      if (error) throw error;
      return job ? json(serializeJob(job)) : fail("Job not found", 404);
    }

    if (jobId && path[4] === "approve" && req.method === "POST") {
      const { data: job, error: jobError } = await db.from("content_ingestion_jobs")
        .select("*").eq("id", jobId).eq("projectid", projectId).maybeSingle();
      if (jobError) throw jobError;
      if (!job) return fail("Job not found", 404);
      if (!["REVIEW_REQUIRED", "READY"].includes(String(job.status))) {
        return fail(`job cannot be approved from ${job.status}`, 409);
      }

      const body = await req.json().catch(() => ({}));
      const approvedData = body.extractedData && typeof body.extractedData === "object"
        ? body.extractedData
        : job.extracted_data;
      if (!approvedData || typeof approvedData !== "object") return fail("extractedData is required for approval", 400);

      const applied = await applyApprovedData(projectId, approvedData);

      const { data: updated, error } = await db.from("content_ingestion_jobs").update({
        status: "APPROVED",
        extracted_data: approvedData,
        validation_errors: [],
        completedat: now(),
        ai_metadata: {
          ...(job.ai_metadata || {}),
          approvedBy: String(body.approvedBy || company.id),
          approvedAt: now(),
          applied,
        },
      }).eq("id", jobId).eq("projectid", projectId).select().single();
      if (error) throw error;

      const manifest = {
        schemaVersion: 1,
        projectId,
        projectName: project.name,
        generatedBy: "content-ingestion-approval",
        sourceJobId: jobId,
        sourceAssetIds: Array.isArray(job.input_manifest?.assets)
          ? job.input_manifest.assets.map((a: any) => a.id)
          : [],
        structure: approvedData.structure || {},
        scene: approvedData.scene || {},
        media: approvedData.media || {},
      };

      const { data: existing } = await db.from("project_experience_configs")
        .select("id").eq("projectid", projectId).maybeSingle();
      const configPayload = {
        schema_version: 1,
        config: manifest,
        generated_by: "content-ingestion-approval",
        approved: true,
        updatedat: now(),
      };

      if (existing) {
        const { error: configError } = await db.from("project_experience_configs")
          .update(configPayload).eq("id", existing.id);
        if (configError) throw configError;
      } else {
        const { error: configError } = await db.from("project_experience_configs")
          .insert({ id: id(), projectid: projectId, createdat: now(), ...configPayload });
        if (configError) throw configError;
      }

      return json({ job: serializeJob(updated), experienceConfig: manifest, applied });
    }

    return fail("Not found", 404);
  } catch (error) {
    console.error(error);
    const status = typeof error === "object" && error && "status" in error
      ? Number((error as any).status)
      : 500;
    return fail(error instanceof Error ? error.message : "Request failed", status || 500);
  }
});
