import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !secretKey) throw new Error("Supabase secret key is not configured");
const db = createClient(supabaseUrl, secretKey);

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-api-key, x-platform-key, content-type", "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS" } });
const err = (e: any, status = 400) => json({ message: e?.message || "Request failed" }, e?.status || status);
const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const slugify = (value: unknown) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
const unitStatuses = new Set(["AVAILABLE", "RESERVED", "SOLD", "HIDDEN"]);
const currencies = new Set(["USD", "UYU", "ARS", "EUR"]);

const publicProject = (r: any) => r && ({ id: r.id, name: r.name, slug: r.slug, description: r.description || "", status: r.status, location: r.location || null, branding: r.branding || null, buildingReference: r.buildingreference || null, createdAt: r.createdat });
const project = (r: any) => r && ({ ...publicProject(r), companyId: r.companyid, environmentConfig: r.environmentconfig || null, publicationConfig: r.publicationconfig || null });
const unit = (r: any) => r && ({ ...r, projectId: r.projectid, buildingId: r.buildingid, floorId: r.floorid, planId: r.planid, modelReference: r.modelreference, images: Array.isArray(r.images) ? r.images : [] });
const pub = (r: any) => r && ({ ...r, projectId: r.projectid, publicSlug: r.publicslug, publicUrl: r.publicurl || "", buttonText: r.buttontext || "Explorar en 3D", isPublished: Boolean(r.ispublished), customDomain: r.customdomain || "" });

async function q(table: string, params: any = {}) { const { data, error } = await db.from(table).select(params.select || "*").match(params.match || {}).order(params.order || "createdat.asc"); if (error) throw error; return data || []; }
async function getProject(pid: string) { const { data, error } = await db.from("projects").select("*").eq("id", pid).maybeSingle(); if (error) throw error; return project(data); }
async function companyByKey(key: string) { if (!key) return null; const { data, error } = await db.from("companies").select("id,name,slug,status,createdat,apikey").eq("apikey", key).maybeSingle(); if (error) throw error; return data; }
async function ownProject(req: Request, pid: string) { const key = req.headers.get("x-api-key"); if (!key) throw Object.assign(new Error("x-api-key header required"), { status: 401 }); const c = await companyByKey(key); if (!c || c.status !== "ACTIVE") throw Object.assign(new Error("invalid api key"), { status: 401 }); const p = await getProject(pid); if (!p) throw Object.assign(new Error("Project not found"), { status: 404 }); if (String(p.companyId) !== String(c.id)) throw Object.assign(new Error("project access denied"), { status: 403 }); return { c, p }; }
async function platformAuth(req: Request) { const configured = Deno.env.get("PLATFORM_API_KEY") || secretKeys.platform || ""; const supplied = req.headers.get("x-platform-key") || ""; if (!configured || !supplied || supplied !== configured) throw Object.assign(new Error("invalid platform key"), { status: 401 }); }
async function parse(req: Request) { try { return await req.json(); } catch { return {}; } }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({}, 204);
  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/realestate-api/, "").replace(/^\/+/, "").split("/").filter(Boolean);
    const method = req.method;
    if (path[0] === "health") return json({ status: "ok", service: "realestate-api", database: "supabase" });

    if (path[0] === "admin" && path[1] === "companies" && method === "GET") { await platformAuth(req); return json(await q("companies", { select: "id,name,slug,status,createdat", order: "createdat.asc" })); }
    if (path[0] === "platform") {
      await platformAuth(req);
      if (path[1] === "companies" && path[2] && path[3] === "projects" && method === "GET") return json((await q("projects", { match: { companyid: path[2] } })).map(project));
      if (path[1] === "projects" && path[2]) { const pid = path[2]; if (path[3] === "units" && method === "GET") return json((await q("units", { match: { projectid: pid } })).map(unit)); if (path[3] === "leads" && method === "GET") return json(await q("leads", { match: { projectid: pid }, order: "createdat.desc" })); const p = await getProject(pid); return p ? json(p) : json({ message: "Project not found" }, 404); }
      return json({ message: "Not found" }, 404);
    }

    if (path[0] === "public") {
      if (path[1] === "projects" && path[2]) {
        const { data: publication } = await db.from("project_publications").select("*").eq("publicslug", path[2]).eq("ispublished", true).eq("status", "PUBLISHED").maybeSingle();
        if (!publication) return json({ message: "Project not found or not published" }, 404);
        const { data: rawProject, error: projectError } = await db.from("projects").select("*").eq("id", publication.projectid).eq("status", "PUBLISHED").maybeSingle();
        if (projectError) throw projectError; if (!rawProject) return json({ message: "Project not found or not published" }, 404);
        const pid = rawProject.id;
        const [buildings, floors, units, plans, amenities, assets, locations] = await Promise.all([q("buildings", { match: { projectid: pid } }), q("floors", { match: { projectid: pid } }), q("units", { match: { projectid: pid } }), q("plans", { match: { projectid: pid } }), q("amenities", { match: { projectid: pid } }), q("assets", { match: { projectid: pid } }), q("locations", { match: { projectid: pid } })]);
        return json({ project: publicProject(rawProject), publication: pub(publication), buildings, floors, units: units.map(unit), plans, amenities, assets, location: locations[0] || null });
      }
      if (path[1] === "projects" && method === "GET") { const { data: pubs } = await db.from("project_publications").select("projectid").eq("ispublished", true).eq("status", "PUBLISHED"); const ids = (pubs || []).map((x: any) => x.projectid); if (!ids.length) return json([]); const { data: ps, error } = await db.from("projects").select("*").in("id", ids).eq("status", "PUBLISHED").order("createdat", { ascending: false }); if (error) throw error; return json((ps || []).map(publicProject)); }
    }

    if (path[0] === "projects" && path[1] && path[2] === "leads" && method === "POST") {
      const body = await parse(req); const name = String(body.name || "").trim(); const email = String(body.email || "").trim().toLowerCase(); const unitId = body.unitId || null; const message = String(body.message || "").trim();
      if (name.length < 2 || name.length > 120) return json({ message: "name must be between 2 and 120 characters" }, 400); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ message: "valid email is required" }, 400); if (String(body.phone || "").length > 40) return json({ message: "phone is too long" }, 400); if (message.length > 2000) return json({ message: "message is too long" }, 400);
      const { data: rawProject } = await db.from("projects").select("id,status").eq("id", path[1]).maybeSingle(); if (!rawProject || rawProject.status !== "PUBLISHED") return json({ message: "Project not found or not published" }, 404); const { data: publication } = await db.from("project_publications").select("id").eq("projectid", rawProject.id).eq("ispublished", true).eq("status", "PUBLISHED").maybeSingle(); if (!publication) return json({ message: "Project not found or not published" }, 404); if (unitId) { const { data: u } = await db.from("units").select("id").eq("id", unitId).eq("projectid", rawProject.id).maybeSingle(); if (!u) return json({ message: "Unit not found for this project" }, 404); }
      const { data: lead, error } = await db.from("leads").insert({ id: id(), name, email, phone: String(body.phone || "").slice(0, 40) || null, projectid: rawProject.id, unitid: unitId, message, createdat: now() }).select().single(); if (error) throw error; return json(lead, 201);
    }

    if (path[0] === "admin" || path[0] === "company") {
      const key = req.headers.get("x-api-key"); if (!key) return json({ message: "x-api-key header required" }, 401); const c = await companyByKey(key); if (!c || c.status !== "ACTIVE") return json({ message: "invalid api key" }, 401); if (path[1] === "me") return json({ id: c.id, name: c.name, slug: c.slug, status: c.status });
      if (path[1] === "projects" && !path[2] && method === "POST") { const body = await parse(req); const name = String(body.name || "").trim(); const slug = slugify(body.slug || name); if (name.length < 2 || name.length > 160) return json({ message: "project name is required" }, 400); if (!slug) return json({ message: "project slug is required" }, 400); const { data: duplicate } = await db.from("projects").select("id").eq("slug", slug).maybeSingle(); if (duplicate) return json({ message: "project slug already exists" }, 409); const { data, error } = await db.from("projects").insert({ id: id(), companyid: c.id, name, slug, description: String(body.description || "").slice(0, 4000), status: "DRAFT", location: body.location || null, branding: body.branding || null, buildingreference: String(body.buildingReference || ""), environmentconfig: body.environmentConfig || {}, publicationconfig: body.publicationConfig || {}, createdat: now() }).select().single(); if (error) throw error; return json(project(data), 201); }
      if (path[1] === "companies" && path[2] && path[3] === "projects") { if (String(path[2]) !== String(c.id)) return json({ message: "company mismatch" }, 403); return json((await q("projects", { match: { companyid: c.id } })).map(project)); }
      if (path[1] === "projects" && path[2]) {
        const pid = path[2]; const own = await ownProject(req, pid); const rest = path.slice(3); const resource = rest[0];
        if (!resource && method === "GET") return json(own.p);
        if (!resource && method === "PATCH") { const body = await parse(req); const allowed = ["name", "slug", "description", "status", "location", "branding", "buildingReference", "environmentConfig", "publicationConfig"]; const values: Record<string, unknown> = {}; const mapping: Record<string, string> = { buildingReference: "buildingreference", environmentConfig: "environmentconfig", publicationConfig: "publicationconfig" }; for (const k of allowed) if (k in body) values[mapping[k] || k] = body[k]; if ("status" in values && !["DRAFT", "PUBLISHED"].includes(String(values.status))) return json({ message: "Invalid project status" }, 400); if ("slug" in values) values.slug = slugify(values.slug); const { data, error } = await db.from("projects").update(values).eq("id", pid).eq("companyid", c.id).select().single(); if (error) throw error; return json(project(data)); }

        if (resource === "buildings") { if (method === "GET") return json(await q("buildings", { match: { projectid: pid } })); const b = await parse(req); if (!String(b.name || "").trim()) return json({ message: "building name is required" }, 400); const { data, error } = await db.from("buildings").insert({ id: id(), projectid: pid, name: String(b.name).trim(), reference: String(b.reference || ""), metadata: b.metadata || null, createdat: now() }).select().single(); if (error) throw error; return json(data, 201); }
        if (resource === "floors") { if (method === "GET") { const b = url.searchParams.get("buildingId"); const { data, error } = await db.from("floors").select("*").eq("projectid", pid).order("number"); if (error) throw error; return json(b ? (data || []).filter((x: any) => String(x.buildingid) === String(b)) : data || []); } const f = await parse(req); const number = Number(f.number); const { data: building } = await db.from("buildings").select("id").eq("id", f.buildingId).eq("projectid", pid).maybeSingle(); if (!building) return json({ message: "Building does not belong to this project" }, 400); if (!Number.isFinite(number)) return json({ message: "floor number is required" }, 400); const { data, error } = await db.from("floors").insert({ id: id(), projectid: pid, buildingid: f.buildingId, number, name: String(f.name || ""), metadata: f.metadata || null, createdat: now() }).select().single(); if (error) throw error; return json(data, 201); }
        if (resource === "units") { if (method === "GET") return json((await q("units", { match: { projectid: pid } })).map(unit)); const u = await parse(req); const { data: building } = await db.from("buildings").select("id").eq("id", u.buildingId).eq("projectid", pid).maybeSingle(); const { data: floor } = await db.from("floors").select("id").eq("id", u.floorId).eq("projectid", pid).eq("buildingid", u.buildingId).maybeSingle(); if (!building || !floor) return json({ message: "Building/floor does not belong to this project" }, 400); const status = u.status || "AVAILABLE"; const currency = u.currency || "USD"; if (!unitStatuses.has(status)) return json({ message: "Invalid unit status" }, 400); if (!currencies.has(currency)) return json({ message: "Invalid currency" }, 400); const price = Number(u.price || 0), surface = Number(u.surface || 0); if (!Number.isFinite(price) || price < 0 || !Number.isFinite(surface) || surface < 0) return json({ message: "Invalid unit numeric values" }, 400); if (u.planId) { const { data: plan } = await db.from("plans").select("id").eq("id", u.planId).eq("projectid", pid).maybeSingle(); if (!plan) return json({ message: "Plan does not belong to this project" }, 400); } const { data: errorCheck } = await db.from("units").select("id").eq("projectid", pid).eq("floorid", u.floorId).eq("number", String(u.number)).maybeSingle(); if (errorCheck) return json({ message: "unit number already exists on this floor" }, 409); const { data, error } = await db.from("units").insert({ id: id(), projectid: pid, buildingid: u.buildingId, floorid: u.floorId, number: String(u.number), surface, bedrooms: Number(u.bedrooms || 0), bathrooms: Number(u.bathrooms || 0), terrace: Number(u.terrace || 0), price, currency, status, description: String(u.description || ""), planid: u.planId || null, modelreference: String(u.modelReference || ""), images: Array.isArray(u.images) ? u.images : [], createdat: now() }).select().single(); if (error) throw error; return json(unit(data), 201); }
        if (resource === "units" && rest[1] && method === "PATCH") {
          const unitId = rest[1];
          const body = await parse(req);
          const current = await db.from("units").select("*").eq("id", unitId).eq("projectid", pid).maybeSingle();
          if (current.error) throw current.error;
          if (!current.data) return json({ message: "Unit not found" }, 404);
          const values: Record<string, unknown> = {};
          const allowed = ["number", "surface", "bedrooms", "bathrooms", "terrace", "price", "currency", "status", "description", "planId", "modelReference", "images"];
          const mapping: Record<string, string> = { planId: "planid", modelReference: "modelreference" };
          for (const key of allowed) if (key in body) values[mapping[key] || key] = body[key];
          if ("status" in values && !unitStatuses.has(String(values.status))) return json({ message: "Invalid unit status" }, 400);
          if ("currency" in values && !currencies.has(String(values.currency))) return json({ message: "Invalid currency" }, 400);
          for (const key of ["surface", "bedrooms", "bathrooms", "terrace", "price"]) {
            if (key in values) {
              const n = Number(values[key]);
              if (!Number.isFinite(n) || n < 0) return json({ message: `Invalid unit numeric value: ${key}` }, 400);
              values[key] = n;
            }
          }
          if ("planid" in values && values.planid) {
            const { data: plan } = await db.from("plans").select("id").eq("id", values.planid).eq("projectid", pid).maybeSingle();
            if (!plan) return json({ message: "Plan does not belong to this project" }, 400);
          }
          if ("number" in values) {
            const duplicate = await db.from("units").select("id").eq("projectid", pid).eq("floorid", current.data.floorid).eq("number", String(values.number)).neq("id", unitId).maybeSingle();
            if (duplicate.data) return json({ message: "unit number already exists on this floor" }, 409);
            values.number = String(values.number);
          }
          if ("images" in values && !Array.isArray(values.images)) return json({ message: "images must be an array" }, 400);
          const { data, error } = await db.from("units").update(values).eq("id", unitId).eq("projectid", pid).select().single();
          if (error) throw error;
          return json(unit(data));
        }

        if (["plans", "amenities", "assets", "location"].includes(resource)) { const table: any = { plans: "plans", amenities: "amenities", assets: "assets", location: "locations" }[resource]; if (method === "GET") { const rows = await q(table, { match: { projectid: pid } }); return json(resource === "location" ? (rows[0] || null) : rows); } const b = await parse(req); const base: any = { id: id(), projectid: pid, createdat: now() }; if (resource === "plans") Object.assign(base, { name: b.name, kind: b.kind || "architectural", filepath: b.filePath || "", description: b.description || "" }); if (resource === "amenities") Object.assign(base, { name: b.name, description: b.description || "", category: b.category || "common" }); if (resource === "assets") Object.assign(base, { entitytype: b.entityType || null, entityid: b.entityId || null, name: b.name, kind: b.kind || "image", path: b.path || "", url: b.url || "", mimetype: b.mimeType || "", metadata: b.metadata || null, isprimary: Boolean(b.isPrimary) }); if (resource === "location") Object.assign(base, { name: b.name, city: b.city, country: b.country, district: b.district || "", coordinates: b.coordinates || null }); const { data, error } = await db.from(table).insert(base).select().single(); if (error) throw error; return json(data, 201); }
        if (resource === "publication") { if (method === "GET") { const { data } = await db.from("project_publications").select("*").eq("projectid", pid).maybeSingle(); return json(pub(data)); } const body = await parse(req); const publicSlug = slugify(body.publicSlug || own.p.slug); if (!publicSlug) return json({ message: "public slug is required" }, 400); if (method === "POST") { const { data: conflict } = await db.from("project_publications").select("projectid").eq("publicslug", publicSlug).maybeSingle(); if (conflict && String(conflict.projectid) !== String(pid)) return json({ message: "public slug already exists" }, 409); const { data, error } = await db.from("project_publications").insert({ id: id(), projectid: pid, publicslug: publicSlug, publicurl: body.publicUrl || "", title: body.title || "", description: body.description || "", thumbnail: body.thumbnail || "", buttontext: body.buttonText || "Explorar en 3D", ispublished: false, customdomain: body.customDomain || "", status: "DRAFT", createdat: now() }).select().single(); if (error) throw error; return json(pub(data), 201); } const values: any = {}; for (const [k, v] of Object.entries(body)) values[{ publicSlug: "publicslug", publicUrl: "publicurl", buttonText: "buttontext", customDomain: "customdomain" }[k] || k] = v; if ("publicslug" in values) { values.publicslug = slugify(values.publicslug); const { data: conflict } = await db.from("project_publications").select("projectid").eq("publicslug", values.publicslug).neq("projectid", pid).maybeSingle(); if (conflict) return json({ message: "public slug already exists" }, 409); } const { data, error } = await db.from("project_publications").update(values).eq("projectid", pid).select().single(); if (error) throw error; return json(pub(data)); }
        if (resource === "publish" && method === "POST") { const body = await parse(req); const current = await db.from("project_publications").select("*").eq("projectid", pid).maybeSingle(); const slug = slugify(body.publicSlug || current.data?.publicslug || own.p.slug); if (!slug) return json({ message: "public slug is required" }, 400); const { data: conflict } = await db.from("project_publications").select("projectid").eq("publicslug", slug).neq("projectid", pid).maybeSingle(); if (conflict) return json({ message: "public slug already exists" }, 409); let data; if (current.data) { const r = await db.from("project_publications").update({ publicslug: slug, ispublished: true, status: "PUBLISHED" }).eq("projectid", pid).select().single(); if (r.error) throw r.error; data = r.data; } else { const r = await db.from("project_publications").insert({ id: id(), projectid: pid, publicslug: slug, ispublished: true, status: "PUBLISHED", createdat: now(), buttontext: "Explorar en 3D" }).select().single(); if (r.error) throw r.error; data = r.data; } const pr = await db.from("projects").update({ status: "PUBLISHED" }).eq("id", pid).select().single(); if (pr.error) throw pr.error; return json({ project: project(pr.data), publication: pub(data) }); }
        if (resource === "unpublish" && method === "POST") { const r = await db.from("project_publications").update({ ispublished: false, status: "DRAFT" }).eq("projectid", pid).select().single(); if (r.error) throw r.error; const pr = await db.from("projects").update({ status: "DRAFT" }).eq("id", pid).select().single(); if (pr.error) throw pr.error; return json(pub(r.data)); }
        if (resource === "leads" && method === "GET") return json(await q("leads", { match: { projectid: pid }, order: "createdat.desc" }));

        if (resource === "ai") {
          if (rest[1] === "jobs" && !rest[2] && method === "GET") return json(await q("content_ingestion_jobs", { match: { projectid: pid }, order: "createdat.desc" }));
          if (rest[1] === "jobs" && !rest[2] && method === "POST") { const body = await parse(req); const job = { id: id(), companyid: own.c.id, projectid: pid, kind: String(body.kind || "PROJECT_PACKAGE"), status: "QUEUED", requestedby: body.requestedBy || null, inputmanifest: body.inputManifest || [], extracteddata: null, validationerrors: [], aimetadata: { pipelineVersion: "1.0", mode: "review_required" }, createdat: now() }; const { data, error } = await db.from("content_ingestion_jobs").insert(job).select().single(); if (error) throw error; return json(data, 201); }
          if (rest[1] === "jobs" && rest[2] && method === "GET") { const { data, error } = await db.from("content_ingestion_jobs").select("*").eq("id", rest[2]).eq("projectid", pid).maybeSingle(); if (error) throw error; return data ? json(data) : json({ message: "AI job not found" }, 404); }
          if (rest[1] === "jobs" && rest[2] && rest[3] === "approve" && method === "POST") { const { data: job, error } = await db.from("content_ingestion_jobs").select("*").eq("id", rest[2]).eq("projectid", pid).maybeSingle(); if (error) throw error; if (!job) return json({ message: "AI job not found" }, 404); const { data, error: updateError } = await db.from("content_ingestion_jobs").update({ status: "APPROVED", completedat: now(), ai_metadata: { ...(job.aimetadata || {}), approvedAt: now() } }).eq("id", job.id).select().single(); if (updateError) throw updateError; return json(data); }
        }
        if (resource === "experience") { if (method === "GET") { const { data, error } = await db.from("project_experience_configs").select("*").eq("projectid", pid).maybeSingle(); if (error) throw error; return json(data || null); } if (method === "PUT") { const body = await parse(req); const existing = await db.from("project_experience_configs").select("id").eq("projectid", pid).maybeSingle(); const payload = { projectid: pid, schemaversion: Number(body.schemaVersion || 1), config: body.config || {}, generatedby: body.generatedBy || "manual", approved: Boolean(body.approved), updatedat: now() }; const result = existing.data ? await db.from("project_experience_configs").update(payload).eq("projectid", pid).select().single() : await db.from("project_experience_configs").insert({ id: id(), createdat: now(), ...payload }).select().single(); if (result.error) throw result.error; return json(result.data); } }
      }
    }

    if (path[0] === "auth" && path[1] === "tenant-access" && method === "POST") { const key = req.headers.get("x-api-key"); const c = await companyByKey(key || ""); if (!c) return json({ message: "invalid api key" }, 401); const body = await parse(req); return json({ allowed: String(body.requestedCompanyId) === String(c.id) && String(body.targetCompanyId) === String(c.id) }); }
    return json({ message: "Not found" }, 404);
  } catch (e: any) { console.error(e); return err(e, 500); }
});
