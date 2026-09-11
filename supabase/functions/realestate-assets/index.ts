import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !secretKey) throw new Error("Supabase secret key is not configured");
const db = createClient(supabaseUrl, secretKey);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });
const fail = (message: string, status = 400) => json({ message }, status);
const id = () => crypto.randomUUID();
const safeName = (name: string) => name.normalize("NFKD").replace(/[^\w. -]+/g, "").replace(/\s+/g, "-").slice(0, 120) || "asset";
const allowed = new Set([
  "application/pdf", "image/png", "image/jpeg", "image/svg+xml", "image/webp",
  "text/csv", "application/csv", "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "model/gltf-binary", "model/gltf+json", "application/octet-stream",
]);

async function companyByKey(key: string) {
  if (!key) return null;
  const { data, error } = await db.from("companies").select("id,name,status").eq("apikey", key).maybeSingle();
  if (error) throw error;
  return data;
}

async function ownProject(req: Request, projectId: string) {
  const company = await companyByKey(req.headers.get("x-api-key") || "");
  if (!company || company.status !== "ACTIVE") throw new Error("invalid api key");
  const { data: project, error } = await db.from("projects").select("id,companyid").eq("id", projectId).maybeSingle();
  if (error) throw error;
  if (!project) throw new Error("Project not found");
  if (String(project.companyid) !== String(company.id)) throw new Error("project access denied");
  return { company, project };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: cors });
  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/realestate-assets/, "").replace(/^\/+/, "").split("/").filter(Boolean);

    if (path[0] === "health") return json({ status: "ok", service: "realestate-assets" });

    if (path[0] === "projects" && path[1] && path[2] === "upload" && req.method === "POST") {
      const projectId = path[1];
      const { company } = await ownProject(req, projectId);
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return fail("file is required", 400);
      if (file.size <= 0) return fail("file is empty", 400);
      if (file.size > 50 * 1024 * 1024) return fail("file exceeds 50 MB limit", 413);
      const mimeType = file.type || "application/octet-stream";
      if (!allowed.has(mimeType)) return fail(`unsupported file type: ${mimeType}`, 415);

      const assetId = id();
      const pathName = `projects/${projectId}/${assetId}-${safeName(file.name)}`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { error: uploadError } = await db.storage.from("project-assets").upload(pathName, bytes, { contentType: mimeType, upsert: false });
      if (uploadError) throw uploadError;

      const kind = String(form.get("kind") || (mimeType === "application/pdf" ? "document" : mimeType.startsWith("image/") ? "image" : "file"));
      const metadata = {
        originalName: file.name,
        size: file.size,
        uploadedByCompanyId: company.id,
        source: "workspace-upload",
      };
      const { data: asset, error: assetError } = await db.from("assets").insert({
        id: assetId,
        projectid: projectId,
        entitytype: String(form.get("entityType") || "project"),
        entityid: String(form.get("entityId") || projectId),
        name: file.name,
        kind,
        path: pathName,
        url: "",
        mimetype: mimeType,
        metadata,
        isprimary: false,
        createdat: new Date().toISOString(),
      }).select().single();
      if (assetError) {
        await db.storage.from("project-assets").remove([pathName]);
        throw assetError;
      }
      return json({ asset: { ...asset, projectId, path: pathName }, storagePath: pathName }, 201);
    }

    if (path[0] === "assets" && path[1] && path[2] === "signed-url" && req.method === "GET") {
      const { company } = await companyByKey(req.headers.get("x-api-key") || "") || {};
      if (!company) return fail("invalid api key", 401);
      const { data: asset, error } = await db.from("assets").select("*").eq("id", path[1]).maybeSingle();
      if (error) throw error;
      if (!asset) return fail("Asset not found", 404);
      const { data: project } = await db.from("projects").select("id,companyid").eq("id", asset.projectid).maybeSingle();
      if (!project || String(project.companyid) !== String(company.id)) return fail("asset access denied", 403);
      const expires = Math.min(Math.max(Number(url.searchParams.get("expires") || 3600), 60), 86400);
      const { data, error: signedError } = await db.storage.from("project-assets").createSignedUrl(asset.path, expires);
      if (signedError) throw signedError;
      return json({ url: data.signedUrl, expiresIn: expires, assetId: asset.id });
    }

    return fail("Not found", 404);
  } catch (error) {
    console.error(error);
    return fail(error instanceof Error ? error.message : "Request failed", 500);
  }
});
