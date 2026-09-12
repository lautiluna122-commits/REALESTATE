import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, v) => { const f = path.join(root, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, v); };
const exists = (p) => fs.existsSync(path.join(root, p));
const fail = (m) => { throw new Error(m); };

function replaceOnce(file, needle, replacement) {
  const value = read(file);
  const i = value.indexOf(needle);
  if (i < 0) fail(`No se encontró el ancla en ${file}: ${needle.slice(0,120)}`);
  write(file, value.slice(0, i) + replacement + value.slice(i + needle.length));
}

function replaceRegexOnce(file, re, replacement) {
  const value = read(file);
  if (!re.test(value)) fail(`Regex no encontrada en ${file}: ${re}`);
  write(file, value.replace(re, replacement));
}

function allRepoTextFiles() {
  const roots = ['src','api','server','supabase','docs','.github'];
  const out = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules','.git','dist'].includes(entry.name)) continue;
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/\.(js|jsx|ts|tsx|mjs|md|json|css|yml|yaml|html)$/.test(entry.name)) out.push(p);
    }
  };
  for (const r of roots) walk(path.join(root, r));
  return out;
}

function references(target) {
  const normalized = target.replaceAll('\\','/');
  const base = path.basename(target, path.extname(target));
  const found = [];
  for (const f of allRepoTextFiles()) {
    const rel = path.relative(root, f).replaceAll('\\','/');
    if (rel === normalized) continue;
    const text = fs.readFileSync(f, 'utf8');
    if (text.includes(normalized) || text.includes(base)) found.push(rel);
  }
  return found;
}

// B1.1 — ProjectBuilder: remove hard dependency on missing checklist/audit endpoints.
{
  const file = 'src/admin/ProjectBuilder.jsx';
  let v = read(file);
  v = v.replace(
    "function Overview({project,data,check})",
    "function Overview({project,data})"
  );
  v = v.replace(
    "const items=[['Estructura',check?.structure],['Inventario',check?.inventory],['Contenido',check?.content],['Experiencia',check?.experience],['Publicación',check?.publication]];",
    "const items=[['Estructura',data.buildings.length>0&&data.floors.length>0],['Inventario',data.units.length>0],['Contenido',data.assets.length>0||data.plans.length>0],['Experiencia',true],['Publicación',Boolean(data.publication?.isPublished)]];"
  );
  v = v.replace(
    "function Publication({project,data,headers,run}){const [f=setF",
    "function Publication({project,data,headers,run}){const [f=setF"
  );
  // Remove Publication's missing checklist state/effect.
  v = v.replace(/const \[check,setCheck\]=useState\(null\);useEffect\(\(\)=>\{req\(`\/admin\/projects\/\$\{project\.id\}\/checklist`,\{headers\}\)\.then\(setCheck\)\.catch\(\(\)=>\{\}\)\},\[project\.id\]\);/g, "");
  v = v.replace(/<article className="adminPanel"><span className="adminKicker">PUBLICATION GATE<\/span><h2>Checklist<\/h2><div className="checkList">\{check&&\[\['Estructura',check\.structure\],\['Inventario',check\.inventory\],\['Contenido',check\.content\],\['Experiencia',check\.experience\],\['Publicación',check\.publication\]\]\.map\(\(\[x,ok\]\)=>.*?<\/div><\/div><\/article>/s, "<article className=\"adminPanel\"><span className=\"adminKicker\">PUBLICATION GATE<\/span><h2>Estado de publicación</h2><div className=\"checkList\">{[['Estructura',data.buildings.length>0&&data.floors.length>0],['Inventario',data.units.length>0],['Contenido',data.assets.length>0||data.plans.length>0],['Publicación',Boolean(data.publication?.isPublished)]].map(([x,ok])=><div key={x}><i>{ok?'✓':'○'}</i>{x}<small>{ok?'Listo':'Pendiente'}</small></div>)}</div></article>");
  // Remove top-level missing endpoint state/calls and hide Audit/Team tabs.
  v = v.replace("const [check,setCheck]=useState(null);", "");
  v = v.replace("const [events,setEvents]=useState([]);", "");
  v = v.replace(/,checklist,audit\]\s*=\s*await Promise\.all\(\[/, "] = await Promise.all([");
  v = v.replace(/,req\(`\$\{b\}\/checklist`,\{headers\}\),req\(`\$\{b\}\/audit`,\{headers\}\)/, "");
  v = v.replace(/setCheck\(checklist\);setEvents\(audit\)/, "");
  v = v.replace(/function Overview\(\{project,data\}\)/, "function Overview({project,data})");
  v = v.replace(/<Overview project=\{project\} data=\{data\} check=\{check\}\/>/, "<Overview project={project} data={data}/>");
  v = v.replace(/\['audit','Actividad'\],/g, "");
  v = v.replace(/\['team','Equipo'\],/g, "");
  v = v.replace(/\{tab==='team'&&<Team[^\n]*?\/>\}\s*/g, "");
  v = v.replace(/\{tab==='audit'&&<Audit[^\n]*?\/>\}\s*/g, "");
  // Experience must match production endpoint (PUT).
  v = v.replace("json('PATCH',{schemaVersion:1,config,approved,generatedBy:'workspace'}", "json('PUT',{schemaVersion:1,config,approved,generatedBy:'workspace'}");
  write(file, v);
}

// B1.2 — Vercel proxy: one production API for all admin unit operations, including share-token auth.
write('api/[...path].js', `const SUPABASE_FUNCTION_URL = 'https://tldhihhyiphqarijpgcm.supabase.co/functions/v1/realestate-api';\n\nexport default async function handler(req, res) {\n  const incoming = new URL(req.url, \`https://\${req.headers.host || 'localhost'}\`);\n  const apiPath = incoming.pathname.replace(/^\\/api/, '');\n  const target = \`\${SUPABASE_FUNCTION_URL}\${apiPath}\${incoming.search}\`;\n  const headers = new Headers();\n  for (const [key, value] of Object.entries(req.headers)) {\n    if (key.toLowerCase() === 'host' || value == null) continue;\n    headers.set(key, Array.isArray(value) ? value.join(',') : value);\n  }\n  try {\n    const response = await fetch(target, {\n      method: req.method,\n      headers,\n      body: ['GET','HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),\n    });\n    const text = await response.text();\n    res.status(response.status);\n    response.headers.forEach((value, key) => res.setHeader(key, value));\n    res.send(text);\n  } catch (error) {\n    res.status(502).json({ message: 'API upstream unavailable', detail: error.message });\n  }\n}\n`);

// B1.3 — Production company creation endpoint.
{
  const file = 'supabase/functions/realestate-api/index.ts';
  const anchor = '    if (path[0] === "platform") {';
  const block = `    if (path[0] === "admin" && path[1] === "companies" && method === "POST") {\n      await platformAuth(req);\n      const body = await parse(req);\n      const name = String(body.name || "").trim();\n      const slug = slugify(body.slug || name);\n      const status = String(body.status || "ACTIVE");\n      const apiKey = String(body.apiKey || body.apikey || crypto.randomUUID().replaceAll("-", ""));\n      if (name.length < 2 || name.length > 160) return json({ message: "company name is required" }, 400);\n      if (!slug) return json({ message: "company slug is required" }, 400);\n      if (!/[A-Za-z0-9]/.test(apiKey)) return json({ message: "api key is required" }, 400);\n      if (!["ACTIVE", "INACTIVE"].includes(status)) return json({ message: "Invalid company status" }, 400);\n      const { data: duplicate, error: duplicateError } = await db.from("companies").select("id").eq("slug", slug).maybeSingle();\n      if (duplicateError) throw duplicateError;\n      if (duplicate) return json({ message: "company slug already exists" }, 409);\n      const { data, error } = await db.from("companies").insert({ id: id(), name, slug, status, apikey: apiKey, createdat: now() }).select("id,name,slug,status,createdat").single();\n      if (error) throw error;\n      return json({ ...data, apiKey }, 201);\n    }\n\n` + anchor;
  replaceOnce(file, anchor, block);
}

// B1.4 — DELETE buildings, floors and units in production.
{
  const file = 'supabase/functions/realestate-api/index.ts';
  let v = read(file);
  const buildingRe = /        if \(resource === "buildings"\) \{.*?\n/s;
  const floorRe = /        if \(resource === "floors"\) \{.*?\n/s;
  const unitRe = /        if \(resource === "units"\) \{.*?\n/s;
  const building = `        if (resource === "buildings") {\n          if (method === "GET") return json(await q("buildings", { match: { projectid: pid } }));\n          if (method === "DELETE" && rest[1]) {\n            const buildingId = rest[1];\n            const { data: existing, error: existingError } = await db.from("buildings").select("id").eq("id", buildingId).eq("projectid", pid).maybeSingle();\n            if (existingError) throw existingError;\n            if (!existing) return json({ message: "Building not found" }, 404);\n            const { error: unitsError } = await db.from("units").delete().eq("buildingid", buildingId).eq("projectid", pid);\n            if (unitsError) throw unitsError;\n            const { error: floorsError } = await db.from("floors").delete().eq("buildingid", buildingId).eq("projectid", pid);\n            if (floorsError) throw floorsError;\n            const { error: deleteError } = await db.from("buildings").delete().eq("id", buildingId).eq("projectid", pid);\n            if (deleteError) throw deleteError;\n            return json({ deleted: true, id: buildingId });\n          }\n          if (method !== "POST") return json({ message: "Method not allowed" }, 405);\n          const b = await parse(req);\n          if (!String(b.name || "").trim()) return json({ message: "building name is required" }, 400);\n          const { data, error } = await db.from("buildings").insert({ id: id(), projectid: pid, name: String(b.name).trim(), reference: String(b.reference || ""), metadata: b.metadata || null, createdat: now() }).select().single();\n          if (error) throw error;\n          return json(data, 201);\n        }\n`;
  v = v.replace(buildingRe, building);
  const floor = `        if (resource === "floors") {\n          if (method === "GET") { const b = url.searchParams.get("buildingId"); const { data, error } = await db.from("floors").select("*").eq("projectid", pid).order("number"); if (error) throw error; return json(b ? (data || []).filter((x: any) => String(x.buildingid) === String(b)) : data || []); }\n          if (method === "DELETE" && rest[1]) {\n            const floorId = rest[1];\n            const { data: existing, error: existingError } = await db.from("floors").select("id").eq("id", floorId).eq("projectid", pid).maybeSingle();\n            if (existingError) throw existingError;\n            if (!existing) return json({ message: "Floor not found" }, 404);\n            const { error: unitsError } = await db.from("units").delete().eq("floorid", floorId).eq("projectid", pid);\n            if (unitsError) throw unitsError;\n            const { error: deleteError } = await db.from("floors").delete().eq("id", floorId).eq("projectid", pid);\n            if (deleteError) throw deleteError;\n            return json({ deleted: true, id: floorId });\n          }\n          if (method !== "POST") return json({ message: "Method not allowed" }, 405);\n          const f = await parse(req); const number = Number(f.number); const { data: building } = await db.from("buildings").select("id").eq("id", f.buildingId).eq("projectid", pid).maybeSingle();\n          if (!building) return json({ message: "Building does not belong to this project" }, 400); if (!Number.isFinite(number)) return json({ message: "floor number is required" }, 400);\n          const { data, error } = await db.from("floors").insert({ id: id(), projectid: pid, buildingid: f.buildingId, number, name: String(f.name || ""), metadata: f.metadata || null, createdat: now() }).select().single();\n          if (error) throw error; return json(data, 201);\n        }\n`;
  v = v.replace(floorRe, floor);
  const unit = `        if (resource === "units") {\n          if (method === "GET") return json((await q("units", { match: { projectid: pid } })).map(unit));\n          if (method === "DELETE" && rest[1]) {\n            const unitId = rest[1];\n            const { data: existing, error: existingError } = await db.from("units").select("id").eq("id", unitId).eq("projectid", pid).maybeSingle();\n            if (existingError) throw existingError; if (!existing) return json({ message: "Unit not found" }, 404);\n            const { data, error } = await db.from("units").delete().eq("id", unitId).eq("projectid", pid).select("id").maybeSingle();\n            if (error) throw error; return json({ deleted: true, id: data?.id || unitId });\n          }\n          if (method !== "POST") return json({ message: "Method not allowed" }, 405);\n          const u = await parse(req); const { data: building } = await db.from("buildings").select("id").eq("id", u.buildingId).eq("projectid", pid).maybeSingle(); const { data: floor } = await db.from("floors").select("id").eq("id", u.floorId).eq("projectid", pid).eq("buildingid", u.buildingId).maybeSingle();\n          if (!building || !floor) return json({ message: "Building/floor does not belong to this project" }, 400); const status = u.status || "AVAILABLE"; const currency = u.currency || "USD";\n          if (!unitStatuses.has(status)) return json({ message: "Invalid unit status" }, 400); if (!currencies.has(currency)) return json({ message: "Invalid currency" }, 400);\n          const price = Number(u.price || 0), surface = Number(u.surface || 0); if (!Number.isFinite(price) || price < 0 || !Number.isFinite(surface) || surface < 0) return json({ message: "Invalid unit numeric values" }, 400);\n          if (u.planId) { const { data: plan } = await db.from("plans").select("id").eq("id", u.planId).eq("projectid", pid).maybeSingle(); if (!plan) return json({ message: "Plan does not belong to this project" }, 400); }\n          const { data: errorCheck } = await db.from("units").select("id").eq("projectid", pid).eq("floorid", u.floorId).eq("number", String(u.number)).maybeSingle(); if (errorCheck) return json({ message: "unit number already exists on this floor" }, 409);\n          const { data, error } = await db.from("units").insert({ id: id(), projectid: pid, buildingid: u.buildingId, floorid: u.floorId, number: String(u.number), surface, bedrooms: Number(u.bedrooms || 0), bathrooms: Number(u.bathrooms || 0), terrace: Number(u.terrace || 0), price, currency, status, description: String(u.description || ""), planid: u.planId || null, modelreference: String(u.modelReference || ""), images: Array.isArray(u.images) ? u.images : [], createdat: now() }).select().single();\n          if (error) throw error; return json(unit(data), 201);\n        }\n`;
  v = v.replace(unitRe, unit);
  write(file, v);
}

// B1.7 — production contract tests as an additive test script.
write('server/tests/production-api.test.js', `import test from 'node:test';\nimport assert from 'node:assert/strict';\n\nconst BASE = process.env.PRODUCTION_API_BASE || 'https://tldhihhyiphqarijpgcm.supabase.co/functions/v1/realestate-api';\nconst maybe = process.env.RUN_PRODUCTION_MUTATION_TESTS === '1';\n\ntest('production API health', async () => {\n  const r = await fetch(\`${BASE}/health\`);\n  assert.equal(r.status, 200);\n  const body = await r.json();\n  assert.equal(body.status, 'ok');\n});\n\ntest('published showroom contract', async () => {\n  const r = await fetch(\`${BASE}/public/projects/ocean-mansions\`);\n  assert.equal(r.status, 200);\n  const body = await r.json();\n  assert.equal(body.project.slug, 'ocean-mansions');\n  assert.ok(Array.isArray(body.units));\n});\n\ntest('protected admin API rejects unauthenticated access', async () => {\n  const r = await fetch(\`${BASE}/admin/me\`);\n  assert.equal(r.status, 401);\n});\n\nif (maybe) {\n  test('production API authenticated smoke', async () => {\n    const apiKey = process.env.PRODUCTION_COMPANY_API_KEY;\n    const projectId = process.env.PRODUCTION_TEST_PROJECT_ID;\n    assert.ok(apiKey && projectId, 'production mutation test requires PRODUCTION_COMPANY_API_KEY and PRODUCTION_TEST_PROJECT_ID');\n    const r = await fetch(\`${BASE}/admin/projects/\${projectId}\`, { headers: { 'x-api-key': apiKey } });\n    assert.equal(r.status, 200);\n    const body = await r.json();\n    assert.equal(body.id, projectId);\n  });\n}\n`);

// B2 — delete known dead files only after reference scan.
const deadFiles = [
  'server/index.supabase.js',
  'server/services/supabaseProjectService.js',
  'server/services/supabasePublicShowroomService.js',
  'server/supabaseClient.js',
  'src/components/admin/CompanyList.jsx',
  'src/experience/ShowroomV4.jsx',
];
for (const file of deadFiles) {
  if (!exists(file)) continue;
  const refs = references(file);
  if (refs.length) fail(`No se puede eliminar ${file}; referencias: ${refs.join(', ')}`);
  fs.rmSync(path.join(root, file));
}

// AdminLayout duplicate: delete only the unreferenced one.
const layouts = ['src/admin/AdminLayout.jsx','src/components/AdminLayout.jsx'];
for (const file of layouts) {
  if (!exists(file)) continue;
  const refs = references(file).filter((x) => !x.endsWith('AdminLayout.jsx'));
  if (!refs.length) fs.rmSync(path.join(root, file));
}

// Remove the old realestate-unit function if source references no longer exist.
if (exists('supabase/functions/realestate-unit/index.ts')) {
  const refs = references('supabase/functions/realestate-unit/index.ts');
  if (!refs.length) fs.rmSync(path.join(root, 'supabase/functions/realestate-unit/index.ts'));
}

// B3.2 — route-level code splitting. Keep existing behavior, lazy-load admin and showroom surfaces.
{
  const file = 'src/App.jsx';
  let v = read(file);
  v = v.replace("import React, { useEffect, useState } from 'react';", "import React, { lazy, Suspense, useEffect, useState } from 'react';");
  v = v.replace("import ShowroomStable from './experience/ShowroomStable';\nimport LeadCapture from './experience/LeadCapture';\nimport AdminPortal from './admin/AdminPortal';", "const ShowroomStable = lazy(() => import('./experience/ShowroomStable'));\nconst LeadCapture = lazy(() => import('./experience/LeadCapture'));\nconst AdminPortal = lazy(() => import('./admin/AdminPortal'));" );
  const loading = `\nfunction RouteLoading({ label = 'Cargando REALESTATE…' }) {\n  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#0b1214',color:'#f5f1e9',fontFamily:'Arial,sans-serif'}}><p>{label}</p></main>;\n}\n`;
  v = v.replace("const API = import.meta.env.VITE_API_BASE_URL || '/api';", "const API = import.meta.env.VITE_API_BASE_URL || '/api';" + loading);
  v = v.replace("return <AdminPortal sharedToken={token} sharedProject={project}/>;", "return <Suspense fallback={<RouteLoading label=\"Cargando workspace…\" />}><AdminPortal sharedToken={token} sharedProject={project}/></Suspense>;");
  v = v.replace("return <AppErrorBoundary><ShowroomStable projectId={project.id}/><LeadCapture projectId={project.id}/></AppErrorBoundary>;", "return <Suspense fallback={<RouteLoading label=\"Cargando showroom…\" />}><AppErrorBoundary><ShowroomStable projectId={project.id}/><LeadCapture projectId={project.id}/></AppErrorBoundary></Suspense>;");
  v = v.replace("if (path === '/admin' || path.startsWith('/admin/')) return <AdminPortal />;", "if (path === '/admin' || path.startsWith('/admin/')) return <Suspense fallback={<RouteLoading />}><AdminPortal /></Suspense>;");
  v = v.replace("if (path === '/workspace' || path.startsWith('/workspace/')) return <AdminPortal />;", "if (path === '/workspace' || path.startsWith('/workspace/')) return <Suspense fallback={<RouteLoading />}><AdminPortal /></Suspense>;");
  v = v.replace("if (path === '/platform' || path.startsWith('/platform/')) return <AdminPortal platform />;", "if (path === '/platform' || path.startsWith('/platform/')) return <Suspense fallback={<RouteLoading />}><AdminPortal platform /></Suspense>;");
  write(file, v);
}

// B3.3 — accessControl: remove only if no source code imports it.
if (exists('src/platform/accessControl.js')) {
  const refs = references('src/platform/accessControl.js').filter((x) => !x.endsWith('accessControl.js'));
  if (!refs.length) fs.rmSync(path.join(root, 'src/platform/accessControl.js'));
}

// B3.1 — production architecture docs.
write('docs/ARCHITECTURE.md', `# REALESTATE — Arquitectura actual\n\n## Producción\n\nLa aplicación está dividida en tres superficies:\n\n- **Platform**: administración global de empresas y proyectos.\n- **Company workspace**: gestión privada de un proyecto, inventario, contenido, publicación y leads.\n- **Public showroom**: experiencia pública en \\`/proyecto/:slug\\`.\n\n### Flujo de producción\n\n\\`Browser → Vercel → api/[...path].js → Supabase Edge Function realestate-api → Supabase Postgres\\`\n\nLos recursos especializados de assets e IA utilizan sus Edge Functions correspondientes. El proxy de Vercel envía ahora también las operaciones de unidades al mismo \\`realestate-api\\`, de modo que \\`x-api-key\\` y \\`x-share-token\\` siguen la misma lógica de scoping.\n\n## Desarrollo local\n\nEl repositorio conserva el servidor Express/SQLite para desarrollo y tests locales de legado. **No es el backend de producción**. Las decisiones de producción deben verificarse contra las Edge Functions de \\`supabase/functions/\\`.\n\n## Modelo de datos\n\n\\`Company → Project → Building → Floor → Unit\\`\n\nAlrededor de esta jerarquía viven locations, plans, amenities, assets, publications, experience configs, access links, content ingestion jobs y leads.\n\n## Fuente de verdad\n\nLa base Supabase es la fuente de verdad. Administración y showroom no deben mantener copias manuales de precios, estados, superficies u otros datos comerciales.\n\n## Seguridad\n\nLa autorización actual usa platform key, company API key y share token con scoping por proyecto. El endurecimiento posterior debe incluir origen CORS restringido, rotación formal de claves, rate limiting y auditoría persistente.\n`);

write('docs/DATA_MODEL.md', `# REALESTATE — Modelo de datos actual\n\n## Jerarquía principal\n\n\\`companies\\` → \\`projects\\` → \\`buildings\\` → \\`floors\\` → \\`units\\`.\n\n## Relaciones complementarias\n\n- \\`locations\\`: ubicación de proyecto.\n- \\`plans\\`: planos asociados al proyecto/unidades.\n- \\`amenities\\`: amenities del proyecto.\n- \\`assets\\`: imágenes, modelos, tours, videos y documentos.\n- \\`project_publications\\`: configuración y estado de publicación.\n- \\`project_experience_configs\\`: configuración de la experiencia 3D/showroom.\n- \\`project_access_links\\`: enlaces privados revocables para clientes.\n- \\`leads\\`: consultas generadas desde el showroom.\n- \\`content_ingestion_jobs\\`: flujo de ingreso asistido por IA.\n\n## Unidad\n\nUna unidad tiene identificador, edificio, piso, superficie, dormitorios, baños, terraza, precio, moneda, estado, descripción, plano, referencia de modelo e imágenes. Los estados comerciales soportados son \\`AVAILABLE\\`, \\`RESERVED\\`, \\`SOLD\\` y \\`HIDDEN\\`.\n\n## Fuente de verdad\n\nLos paneles escriben en Supabase a través de la Edge Function \\`realestate-api\\`. El showroom público lee el proyecto publicado desde la misma base y debe reflejar cambios de inventario sin duplicar datos.\n`);

write('docs/BRANCHING.md', `# REALESTATE — Flujo de ramas\n\n## Regla\n\n\\`main\\` es la rama estable. Todo cambio funcional se realiza primero en una rama \\`feature/*\\`, \\`fix/*\\` o \\`chore/*\\`.\n\n## Ciclo\n\n1. Crear rama desde \\`main\\`.\n2. Implementar un bloque acotado.\n3. Ejecutar build y tests.\n4. Crear PR contra \\`main\\`.\n5. Revisar diff y checks.\n6. Mergear solamente cuando la validación esté verde.\n\nLas ramas antiguas se eliminan únicamente después de comprobar que no contienen commits únicos valiosos.\n`);

// CI — add production contract test to the existing validation workflow.
if (exists('.github/workflows/validate.yml')) {
  let v = read('.github/workflows/validate.yml');
  if (!v.includes('server/tests/production-api.test.js')) {
    v = v.replace('      - run: node --test --test-concurrency=1 server/tests/*.test.js', '      - run: node --test --test-concurrency=1 server/tests/*.test.js\n      - name: Production Edge Function contract tests\n        run: node --test --test-concurrency=1 server/tests/production-api.test.js');
    write('.github/workflows/validate.yml', v);
  }
}

console.log('Finalization transformation completed.');
`}
