import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL");
const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !secretKey) throw new Error("Supabase secret key is not configured");
const db = createClient(url, secretKey);

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "x-api-key,content-type",
    "Access-Control-Allow-Methods": "GET,PATCH,OPTIONS",
  },
});

const unit = (r: any) => ({
  ...r,
  projectId: r.projectid,
  buildingId: r.buildingid,
  floorId: r.floorid,
  planId: r.planid,
  modelReference: r.modelreference,
  images: Array.isArray(r.images) ? r.images : [],
});

async function auth(req: Request, projectId: string) {
  const key = req.headers.get("x-api-key");
  if (!key) return null;
  const { data: company, error: companyError } = await db
    .from("companies")
    .select("id,status")
    .eq("apikey", key)
    .maybeSingle();
  if (companyError || !company || company.status !== "ACTIVE") return null;

  const { data: project, error: projectError } = await db
    .from("projects")
    .select("id,companyid")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError || !project || String(project.companyid) !== String(company.id)) return null;
  return company;
}

const allowedStatuses = new Set(["AVAILABLE", "RESERVED", "SOLD", "HIDDEN"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({}, 204);

  try {
    const url = new URL(req.url);
    const parts = url.pathname.replace(/^\/realestate-unit\/?/, "").split("/").filter(Boolean);
    const projectId = parts[0];
    const unitId = parts[1];

    if (!projectId || !unitId) return json({ message: "projectId and unitId are required" }, 400);
    if (!await auth(req, projectId)) return json({ message: "project access denied" }, 403);

    if (req.method === "GET") {
      const { data, error } = await db.from("units")
        .select("*")
        .eq("id", unitId)
        .eq("projectid", projectId)
        .maybeSingle();
      if (error) throw error;
      return data ? json(unit(data)) : json({ message: "Unit not found" }, 404);
    }

    if (req.method !== "PATCH") return json({ message: "Method not allowed" }, 405);

    const body = await req.json().catch(() => ({}));
    const values: Record<string, unknown> = {};
    const mapping: Record<string, string> = {
      planId: "planid",
      modelReference: "modelreference",
    };
    const allowed = new Set([
      "number", "surface", "bedrooms", "bathrooms", "terrace", "price",
      "currency", "status", "description", "planid", "modelreference", "images",
    ]);

    for (const [key, value] of Object.entries(body)) {
      const dbKey = mapping[key] || key;
      if (allowed.has(dbKey)) values[dbKey] = value;
    }

    if (!Object.keys(values).length) return json({ message: "No editable unit fields supplied" }, 400);

    if ("status" in values && !allowedStatuses.has(String(values.status))) {
      return json({ message: "Invalid unit status" }, 400);
    }
    if ("currency" in values && !["USD", "UYU", "ARS", "EUR"].includes(String(values.currency))) {
      return json({ message: "Invalid currency" }, 400);
    }
    if ("images" in values && !Array.isArray(values.images)) {
      return json({ message: "images must be an array" }, 400);
    }

    if ("planid" in values && values.planid) {
      const { data: plan, error } = await db.from("plans")
        .select("id")
        .eq("id", values.planid)
        .eq("projectid", projectId)
        .maybeSingle();
      if (error) throw error;
      if (!plan) return json({ message: "Plan does not belong to this project" }, 400);
    }

    for (const field of ["surface", "bedrooms", "bathrooms", "terrace", "price"]) {
      if (field in values) {
        const numeric = Number(values[field]);
        if (!Number.isFinite(numeric) || numeric < 0) return json({ message: `${field} must be a non-negative number` }, 400);
        values[field] = numeric;
      }
    }

    const { data, error } = await db.from("units")
      .update(values)
      .eq("id", unitId)
      .eq("projectid", projectId)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? json(unit(data)) : json({ message: "Unit not found" }, 404);
  } catch (e: any) {
    return json({ message: e?.message || "Request failed" }, 500);
  }
});
