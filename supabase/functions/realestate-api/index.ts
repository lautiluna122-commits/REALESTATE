import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
const secretKey = secretKeys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const db = createClient(supabaseUrl, secretKey);
const json = (data: unknown, status=200) => new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-api-key, content-type','Access-Control-Allow-Methods':'GET,POST,PATCH,DELETE,OPTIONS'}});
const err = (e:any,status=400) => json({message:e?.message||'Request failed'}, e?.status||status);
const id=()=>crypto.randomUUID();
const now=()=>new Date().toISOString();

const publicProject=(r:any)=>r&&({id:r.id,name:r.name,slug:r.slug,description:r.description||'',status:r.status,location:r.location||null,branding:r.branding||null,buildingReference:r.buildingreference||null,createdAt:r.createdat});
const project=(r:any)=>r&&({...publicProject(r),companyId:r.companyid,environmentConfig:r.environmentconfig||null,publicationConfig:r.publicationconfig||null});
const unit=(r:any)=>r&&({...r,projectId:r.projectid,buildingId:r.buildingid,floorId:r.floorid,planId:r.planid,modelReference:r.modelreference,images:Array.isArray(r.images)?r.images:[]});
const pub=(r:any)=>r&&({...r,projectId:r.projectid,publicSlug:r.publicslug,publicUrl:r.publicurl||'',buttonText:r.buttontext||'Explorar en 3D',isPublished:Boolean(r.ispublished),customDomain:r.customdomain||''});
async function q(table: string, params:any={}) { const {data,error}=await db.from(table).select(params.select||'*').match(params.match||{}).order(params.order||'createdat.asc'); if(error)throw error; return data||[]; }
async function getProject(pid:string){const {data,error}=await db.from('projects').select('*').eq('id',pid).maybeSingle();if(error)throw error;return project(data);}
async function companyByKey(key:string){const {data,error}=await db.from('companies').select('id,name,slug,status,createdat,apikey').eq('apikey',key).maybeSingle();if(error)throw error;return data;}
async function ownProject(req:Request,pid:string){const key=req.headers.get('x-api-key');if(!key)throw Object.assign(new Error('x-api-key header required'),{status:401});const c=await companyByKey(key);if(!c)throw Object.assign(new Error('invalid api key'),{status:401});const p=await getProject(pid);if(!p)throw Object.assign(new Error('Project not found'),{status:404});if(String(p.companyId)!==String(c.id))throw Object.assign(new Error('project access denied'),{status:403});return {c,p};}
async function parse(req:Request){try{return await req.json()}catch{return {}}}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return json({},204);
  try{
    const url=new URL(req.url), path=url.pathname.replace(/^\/realestate-api/,'').replace(/^\/+/,'').split('/').filter(Boolean), method=req.method;
    if(path[0]==='health')return json({status:'ok',service:'realestate-api',database:'supabase'});
    if(path[0]==='public'){
      if(path[1]==='projects'&&path[2]){
        const {data:publication}=await db.from('project_publications').select('*').eq('publicslug',path[2]).eq('ispublished',true).eq('status','PUBLISHED').maybeSingle();
        if(!publication)return json({message:'Project not found or not published'},404);
        const {data:rawProject,error:projectError}=await db.from('projects').select('*').eq('id',publication.projectid).eq('status','PUBLISHED').maybeSingle();
        if(projectError)throw projectError;
        if(!rawProject)return json({message:'Project not found or not published'},404);
        const pid=rawProject.id;
        const [buildings,floors,units,plans,amenities,assets,locations]=await Promise.all([
          q('buildings',{match:{projectid:pid}}),q('floors',{match:{projectid:pid}}),q('units',{match:{projectid:pid}}),q('plans',{match:{projectid:pid}}),q('amenities',{match:{projectid:pid}}),q('assets',{match:{projectid:pid}}),q('locations',{match:{projectid:pid}})
        ]);
        return json({project:publicProject(rawProject),publication:pub(publication),buildings,floors,units:units.map(unit),plans,amenities,assets,location:locations[0]||null});
      }
      if(path[1]==='projects'&&method==='GET'){
        const {data:pubs}=await db.from('project_publications').select('projectid').eq('ispublished',true).eq('status','PUBLISHED');
        const ids=(pubs||[]).map(x=>x.projectid); if(!ids.length)return json([]);
        const {data:ps,error}=await db.from('projects').select('*').in('id',ids).eq('status','PUBLISHED').order('createdat',{ascending:false});if(error)throw error;
        return json((ps||[]).map(publicProject));
      }
    }
    if(path[0]==='projects'&&path[1]&&path[2]==='leads'&&method==='POST'){
      const body=await parse(req),name=String(body.name||'').trim(),email=String(body.email||'').trim().toLowerCase(),unitId=body.unitId||null,message=String(body.message||'').trim();
      if(name.length<2||name.length>120)return json({message:'name must be between 2 and 120 characters'},400);
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({message:'valid email is required'},400);
      if(message.length>2000)return json({message:'message is too long'},400);
      const {data:rawProject}=await db.from('projects').select('id,status').eq('id',path[1]).maybeSingle();
      if(!rawProject||rawProject.status!=='PUBLISHED')return json({message:'Project not found or not published'},404);
      const {data:publication}=await db.from('project_publications').select('id').eq('projectid',rawProject.id).eq('ispublished',true).eq('status','PUBLISHED').maybeSingle();
      if(!publication)return json({message:'Project not found or not published'},404);
      if(unitId){const {data:u}=await db.from('units').select('id').eq('id',unitId).eq('projectid',rawProject.id).maybeSingle();if(!u)return json({message:'Unit not found for this project'},404);}
      const {data:lead,error}=await db.from('leads').insert({id:id(),name,email,phone:String(body.phone||'').slice(0,40)||null,projectid:rawProject.id,unitid:unitId,message,createdat:now()}).select().single();if(error)throw error;return json(lead,201);
    }
    if(path[0]==='admin' || path[0]==='company'){
      const key=req.headers.get('x-api-key');if(!key)return json({message:'x-api-key header required'},401);const c=await companyByKey(key);if(!c)return json({message:'invalid api key'},401);
      if(path[1]==='me')return json({id:c.id,name:c.name,slug:c.slug,status:c.status});
      if(path[1]==='companies'&&path[2]&&path[3]==='projects'){
        if(String(path[2])!==String(c.id))return json({message:'company mismatch'},403);const ps=await q('projects',{match:{companyid:c.id}});return json(ps.map(project));
      }
      if(path[1]==='projects'&&path[2]){
        const pid=path[2];const own=await ownProject(req,pid);const rest=path.slice(3);const resource=rest[0];
        if(!resource&&method==='GET')return json(own.p);
        if(!resource&&method==='PATCH'){const body=await parse(req),allowed=['name','slug','description','status','location','branding','buildingReference','environmentConfig','publicationConfig'],values:any={};for(const k of allowed)if(k in body)values[{companyId:'companyid',buildingReference:'buildingreference',environmentConfig:'environmentconfig',publicationConfig:'publicationconfig'}[k]||k]=body[k];const {data,error}=await db.from('projects').update(values).eq('id',pid).eq('companyid',c.id).select().single();if(error)throw error;return json(project(data));}
        if(resource==='buildings'){if(method==='GET')return json(await q('buildings',{match:{projectid:pid}}));const b=await parse(req);const {data,error}=await db.from('buildings').insert({id:id(),projectid:pid,name:b.name,reference:b.reference||'',metadata:b.metadata||null,createdat:now()}).select().single();if(error)throw error;return json(data,201);}
        if(resource==='floors'){if(method==='GET'){const b=url.searchParams.get('buildingId');const {data,error}=await db.from('floors').select('*').eq('projectid',pid).order('number');if(error)throw error;return json(b?(data||[]).filter(x=>String(x.buildingid)===String(b)):data||[]);}const f=await parse(req);const {data:building}=await db.from('buildings').select('id').eq('id',f.buildingId).eq('projectid',pid).maybeSingle();if(!building)return json({message:'Building does not belong to this project'},400);const {data,error}=await db.from('floors').insert({id:id(),projectid:pid,buildingid:f.buildingId,number:Number(f.number),name:f.name||'',metadata:f.metadata||null,createdat:now()}).select().single();if(error)throw error;return json(data,201);}
        if(resource==='units'){if(method==='GET'){const rows=await q('units',{match:{projectid:pid}});return json(rows.map(unit));}const u=await parse(req);const {data:building}=await db.from('buildings').select('id').eq('id',u.buildingId).eq('projectid',pid).maybeSingle();const {data:floor}=await db.from('floors').select('id').eq('id',u.floorId).eq('projectid',pid).eq('buildingid',u.buildingId).maybeSingle();if(!building||!floor)return json({message:'Building/floor does not belong to this project'},400);const {data,error}=await db.from('units').insert({id:id(),projectid:pid,buildingid:u.buildingId,floorid:u.floorId,number:String(u.number),surface:Number(u.surface)||0,bedrooms:Number(u.bedrooms)||0,bathrooms:Number(u.bathrooms)||0,terrace:Number(u.terrace)||0,price:Number(u.price)||0,currency:u.currency||'USD',status:u.status||'AVAILABLE',description:u.description||'',planid:u.planId||null,modelreference:u.modelReference||'',images:Array.isArray(u.images)?u.images:[],createdat:now()}).select().single();if(error)throw error;return json(unit(data),201);}
        if(['plans','amenities','assets','location'].includes(resource)){
          const table:any={plans:'plans',amenities:'amenities',assets:'assets',location:'locations'}[resource];if(method==='GET'){const rows=await q(table,{match:{projectid:pid}});return json(resource==='location'?(rows[0]||null):rows);}
          const b=await parse(req);const base:any={id:id(),projectid:pid,createdat:now()};if(resource==='plans')Object.assign(base,{name:b.name,kind:b.kind||'architectural',filepath:b.filePath||'',description:b.description||''});if(resource==='amenities')Object.assign(base,{name:b.name,description:b.description||'',category:b.category||'common'});if(resource==='assets')Object.assign(base,{entitytype:b.entityType||null,entityid:b.entityId||null,name:b.name,kind:b.kind,path:b.path||'',url:b.url||'',mimetype:b.mimeType||'',metadata:b.metadata||null,isprimary:Boolean(b.isPrimary)});if(resource==='location')Object.assign(base,{name:b.name,city:b.city,country:b.country,district:b.district||'',coordinates:b.coordinates||null});const {data,error}=await db.from(table).insert(base).select().single();if(error)throw error;return json(data,201);
        }
        if(resource==='publication'){
          if(method==='GET'){const {data}=await db.from('project_publications').select('*').eq('projectid',pid).maybeSingle();return json(pub(data));}
          const body=await parse(req);if(method==='POST'){const {data,error}=await db.from('project_publications').insert({id:id(),projectid:pid,publicslug:body.publicSlug||own.p.slug,publicurl:body.publicUrl||'',title:body.title||'',description:body.description||'',thumbnail:body.thumbnail||'',buttontext:body.buttonText||'Explorar en 3D',ispublished:false,customdomain:body.customDomain||'',status:'DRAFT',createdat:now()}).select().single();if(error)throw error;return json(pub(data),201);}const values:any={};for(const [k,v] of Object.entries(body)){values[{publicSlug:'publicslug',publicUrl:'publicurl',buttonText:'buttontext',customDomain:'customdomain'}[k]||k]=v;}const {data,error}=await db.from('project_publications').update(values).eq('projectid',pid).select().single();if(error)throw error;return json(pub(data));
        }
        if(resource==='publish'&&method==='POST'){const body=await parse(req),current=await db.from('project_publications').select('*').eq('projectid',pid).maybeSingle();const slug=body.publicSlug||current.data?.publicslug||own.p.slug;let data;if(current.data){const r=await db.from('project_publications').update({publicslug:slug,ispublished:true,status:'PUBLISHED'}).eq('projectid',pid).select().single();if(r.error)throw r.error;data=r.data;}else{const r=await db.from('project_publications').insert({id:id(),projectid:pid,publicslug:slug,ispublished:true,status:'PUBLISHED',createdat:now(),buttontext:'Explorar en 3D'}).select().single();if(r.error)throw r.error;data=r.data;}const pr=await db.from('projects').update({status:'PUBLISHED'}).eq('id',pid).select().single();if(pr.error)throw pr.error;return json({project:project(pr.data),publication:pub(data)});}
        if(resource==='unpublish'&&method==='POST'){const r=await db.from('project_publications').update({ispublished:false,status:'DRAFT'}).eq('projectid',pid).select().single();if(r.error)throw r.error;await db.from('projects').update({status:'DRAFT'}).eq('id',pid);return json(pub(r.data));}
        if(resource==='leads'&&method==='GET')return json(await q('leads',{match:{projectid:pid},order:'createdat.desc'}));
      }
    }
    if(path[0]==='auth'&&path[1]==='tenant-access'&&method==='POST'){const key=req.headers.get('x-api-key');const c=await companyByKey(key||'');if(!c)return json({message:'invalid api key'},401);const body=await parse(req);return json({allowed:String(body.requestedCompanyId)===String(c.id)&&String(body.targetCompanyId)===String(c.id)});}
    return json({message:'Not found'},404);
  }catch(e){console.error(e);return err(e,500);}
});
