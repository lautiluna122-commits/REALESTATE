import crypto from 'node:crypto';
import { select, insert, update } from '../supabaseClient.js';

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const one = (rows) => Array.isArray(rows) ? rows[0] || null : rows;
const bool = (v) => Boolean(v);

const projectMap = (r) => r && ({
  id: r.id, companyId: r.companyid, name: r.name, slug: r.slug, description: r.description || '',
  status: r.status, location: r.location || null, branding: r.branding || null,
  buildingReference: r.buildingreference || null, environmentConfig: r.environmentconfig || null,
  publicationConfig: r.publicationconfig || null, createdAt: r.createdat,
});
const buildingMap = (r) => ({ id:r.id, projectId:r.projectid, name:r.name, reference:r.reference||'', metadata:r.metadata||null, createdAt:r.createdat });
const floorMap = (r) => ({ id:r.id, projectId:r.projectid, buildingId:r.buildingid, number:Number(r.number), name:r.name||'', metadata:r.metadata||null, createdAt:r.createdat });
const unitMap = (r) => ({ id:r.id, projectId:r.projectid, buildingId:r.buildingid, floorId:r.floorid, number:String(r.number), surface:Number(r.surface)||0, bedrooms:Number(r.bedrooms)||0, bathrooms:Number(r.bathrooms)||0, terrace:Number(r.terrace)||0, price:Number(r.price)||0, currency:r.currency||'USD', status:r.status, description:r.description||'', planId:r.planid||null, modelReference:r.modelreference||'', images:Array.isArray(r.images)?r.images:[], createdAt:r.createdat });
const publicationMap = (r) => r && ({ id:r.id, projectId:r.projectid, publicSlug:r.publicslug, publicUrl:r.publicurl||'', title:r.title||'', description:r.description||'', thumbnail:r.thumbnail||'', buttonText:r.buttontext||'Explorar en 3D', isPublished:bool(r.ispublished), customDomain:r.customdomain||'', status:r.status, createdAt:r.createdat });

export async function listCompanies() {
  const rows = await select('companies', { select:'id,name,slug,status,createdat', order:'createdat.desc' });
  return rows;
}
export async function createCompany({name,slug,status='ACTIVE',apiKey}) {
  const row = one(await insert('companies', [{id:id(),name,slug,status,createdat:now(),apikey:apiKey||crypto.randomUUID()}]));
  return row;
}
export async function getCompanyByApiKey(apiKey) {
  return one(await select('companies',{apikey:`eq.${apiKey}`,select:'id,name,slug,status,createdat,apikey',limit:'1'}));
}
export async function listProjectsByCompany(companyId) {
  const rows=await select('projects',{companyid:`eq.${companyId}`,select:'*',order:'createdat.desc'}); return rows.map(projectMap);
}
export async function getProjectById(projectId) { return projectMap(one(await select('projects',{id:`eq.${projectId}`,select:'*',limit:'1'}))); }
export async function getProjectBySlug(slug,companyId=null) {
  const q={slug:`eq.${slug}`,select:'*',limit:'1'}; if(companyId) q.companyid=`eq.${companyId}`;
  return projectMap(one(await select('projects',q)));
}
export async function createProject(payload) {
  const {companyId,name,slug,description='',status='DRAFT',location=null,branding=null,buildingReference=null,environmentConfig=null,publicationConfig=null}=payload;
  if(!companyId||!name||!slug) throw new Error('companyId, name and slug are required');
  if(await getProjectBySlug(slug,companyId)) throw new Error(`A project with slug "${slug}" already exists for this company.`);
  const row=one(await insert('projects',[{id:id(),companyid:companyId,name,slug,description,status,location,branding,buildingreference:buildingReference,environmentconfig:environmentConfig,publicationconfig:publicationConfig,createdat:now()}]));
  return projectMap(row);
}
export async function updateProject(projectId,companyId,updates) {
  const values={}; for(const [k,v] of Object.entries(updates)){ const key={companyId:'companyid',buildingReference:'buildingreference',environmentConfig:'environmentconfig',publicationConfig:'publicationconfig'}[k]||k; values[key]=v; }
  const rows=await update('projects',{id:`eq.${projectId}`,companyid:`eq.${companyId}`},values); return projectMap(one(rows));
}

export async function getPublishedProjectByPublicSlug(publicSlug){
  const pubs=await select('project_publications',{publicslug:`eq.${publicSlug}`,ispublished:'eq.true',status:'eq.PUBLISHED',select:'*',limit:'1'}); const pub=one(pubs); if(!pub)return null;
  const project=await getProjectById(pub.projectid); if(!project||project.status!=='PUBLISHED')return null;
  return {project,publication:publicationMap(pub)};
}
export async function listPublicProjects(){
  const pubs=await select('project_publications',{ispublished:'eq.true',status:'eq.PUBLISHED',select:'projectid,publicslug'}); if(!pubs.length)return [];
  const rows=await select('projects',{id:`in.(${pubs.map(p=>p.projectid).join(',')})`,status:'eq.PUBLISHED',select:'*',order:'createdat.desc'}); return rows.map(projectMap);
}

export async function createBuilding({projectId,name,reference='',metadata=null}){ const row=one(await insert('buildings',[{id:id(),projectid:projectId,name,reference,metadata,createdat:now()}])); return buildingMap(row); }
export async function listProjectBuildings(projectId){ const rows=await select('buildings',{projectid:`eq.${projectId}`,select:'*',order:'createdat.asc'}); return rows.map(buildingMap); }
export async function createFloor({projectId,buildingId,number,name='',metadata=null}){
  const b=one(await select('buildings',{id:`eq.${buildingId}`,projectid:`eq.${projectId}`,select:'id',limit:'1'})); if(!b)throw new Error('Building does not belong to this project');
  const row=one(await insert('floors',[{id:id(),projectid:projectId,buildingid:buildingId,number:Number(number),name,metadata,createdat:now()}])); return floorMap(row);
}
export async function listProjectFloors(projectId,buildingId=null){ const q={projectid:`eq.${projectId}`,select:'*',order:'number.asc'};if(buildingId)q.buildingid=`eq.${buildingId}`;return (await select('floors',q)).map(floorMap); }

export async function createUnit(payload){
  const {projectId,buildingId,floorId,number,surface,bedrooms,bathrooms,terrace,price,currency='USD',status='AVAILABLE',description='',planId=null,modelReference='',images=[]}=payload;
  const b=one(await select('buildings',{id:`eq.${buildingId}`,projectid:`eq.${projectId}`,select:'id',limit:'1'}));if(!b)throw new Error('Building does not belong to this project');
  const f=one(await select('floors',{id:`eq.${floorId}`,projectid:`eq.${projectId}`,buildingid:`eq.${buildingId}`,select:'id',limit:'1'}));if(!f)throw new Error('Floor does not belong to this building');
  const row=one(await insert('units',[{id:id(),projectid:projectId,buildingid:buildingId,floorid:floorId,number:String(number),surface:Number(surface)||0,bedrooms:Number(bedrooms)||0,bathrooms:Number(bathrooms)||0,terrace:Number(terrace)||0,price:Number(price)||0,currency,status,description,planid:planId,modelreference:modelReference,images:Array.isArray(images)?images:[],createdat:now()}]));return unitMap(row);
}
export async function listProjectUnits(projectId){return (await select('units',{projectid:`eq.${projectId}`,select:'*',order:'floorid.asc,number.asc'})).map(unitMap);}
export async function getUnitById(projectId,unitId){return unitMap(one(await select('units',{projectid:`eq.${projectId}`,id:`eq.${unitId}`,select:'*',limit:'1'})));}
export async function updateUnit(projectId,unitId,updates){
  const allowed=['number','surface','bedrooms','bathrooms','terrace','price','currency','status','description','planid','modelreference','images'];
  const values={};for(const k of allowed)if(Object.prototype.hasOwnProperty.call(updates,k)){const key={planId:'planid',modelReference:'modelreference'}[k]||k;values[key]=updates[k];}
  const rows=await update('units',{id:`eq.${unitId}`,projectid:`eq.${projectId}`},values);return unitMap(one(rows));
}

export async function createPlan({projectId,name,kind='architectural',filePath='',description=''}){const row=one(await insert('plans',[{id:id(),projectid:projectId,name,kind,filepath:filePath,description,createdat:now()}]));return row;}
export async function listProjectPlans(projectId){return await select('plans',{projectid:`eq.${projectId}`,select:'*',order:'createdat.asc'});}
export async function createAmenity({projectId,name,description='',category='common'}){const row=one(await insert('amenities',[{id:id(),projectid:projectId,name,description,category,createdat:now()}]));return row;}
export async function listProjectAmenities(projectId){return await select('amenities',{projectid:`eq.${projectId}`,select:'*',order:'createdat.asc'});}
export async function createAsset({projectId,entityType=null,entityId=null,name,kind,path='',url='',mimeType='',metadata=null,isPrimary=false}){const row=one(await insert('assets',[{id:id(),projectid:projectId,entitytype:entityType,entityid:entityId,name,kind,path,url,mimetype:mimeType,metadata,isprimary:Boolean(isPrimary),createdat:now()}]));return row;}
export async function listProjectAssets(projectId){return await select('assets',{projectid:`eq.${projectId}`,select:'*',order:'createdat.asc'});}
export async function createLocation({projectId,name,city,country,district='',coordinates=null}){const row=one(await insert('locations',[{id:id(),projectid:projectId,name,city,country,district,coordinates,createdat:now()}]));return row;}
export async function getProjectLocation(projectId){return one(await select('locations',{projectid:`eq.${projectId}`,select:'*',limit:'1'}));}

export async function getPublication(projectId){return publicationMap(one(await select('project_publications',{projectid:`eq.${projectId}`,select:'*',limit:'1'})));}
export async function createProjectPublication({projectId,publicSlug,publicUrl='',title='',description='',thumbnail='',buttonText='Explorar en 3D',isPublished=false,customDomain='',status='DRAFT'}){
  if(await one(await select('project_publications',{publicslug:`eq.${publicSlug}`,select:'id',limit:'1'})))throw new Error('public slug already in use');
  const row=one(await insert('project_publications',[{id:id(),projectid:projectId,publicslug:publicSlug,publicurl:publicUrl,title,description,thumbnail,buttontext:buttonText,ispublished:Boolean(isPublished),customdomain:customDomain,status,createdat:now()}]));return publicationMap(row);
}
export async function updatePublication(projectId,updates){const values={};for(const [k,v] of Object.entries(updates)){values[{publicSlug:'publicslug',publicUrl:'publicurl',buttonText:'buttontext',customDomain:'customdomain'}[k]||k]=v;}return publicationMap(one(await update('project_publications',{projectid:`eq.${projectId}`},values)));}
export async function publishProject(projectId,payload={}){
  const project=await getProjectById(projectId);if(!project)throw new Error('Project not found');
  const current=await getPublication(projectId);const publicSlug=payload.publicSlug||current?.publicSlug||project.slug;
  let pub;if(current)pub=await updatePublication(projectId,{...payload,publicSlug,isPublished:true,status:'PUBLISHED'});else pub=await createProjectPublication({projectId,publicSlug,...payload,isPublished:true,status:'PUBLISHED'});
  await update('projects',{id:`eq.${projectId}`},{status:'PUBLISHED'});return {project:await getProjectById(projectId),publication:pub};
}
export async function unpublishProject(projectId){const pub=await updatePublication(projectId,{isPublished:false,status:'DRAFT'});await update('projects',{id:`eq.${projectId}`},{status:'DRAFT'});return pub;}

export async function listProjectLeads(projectId){return await select('leads',{projectid:`eq.${projectId}`,select:'*',order:'createdat.desc'});}
export async function createLead({name,email,phone=null,message='',projectId,unitId=null}){
  const project=await getProjectById(projectId);if(!project)throw new Error('Project not found');
  if(unitId){const unit=await getUnitById(projectId,unitId);if(!unit)throw new Error('Unit not found for this project');}
  const row=one(await insert('leads',[{id:id(),name,email,phone,projectid:projectId,unitid:unitId,message,createdat:now()}]));return row;
}
export async function ensureCompanyAccess(requestedCompanyId,targetCompanyId){return String(requestedCompanyId)===String(targetCompanyId);}

export async function createProjectAccessLink({companyId,projectId,label='Cliente',role='CLIENT_EDITOR',permissions}) {
  const project=await getProjectById(projectId);
  if(!project || String(project.companyId)!==String(companyId)) throw new Error('Project access denied');
  const token=crypto.randomBytes(32).toString('base64url');
  const tokenhash=crypto.createHash('sha256').update(token).digest('hex');
  const rows=await select('project_access_links',{projectid:`eq.${projectId}`,status:'eq.ACTIVE',select:'id',limit:'1'});
  if(rows.length) await update('project_access_links',{projectid:`eq.${projectId}`,status:'eq.ACTIVE'},{status:'REVOKED'});
  const row=one(await insert('project_access_links',[{id:id(),companyid:companyId,projectid:projectId,tokenhash,label,role,permissions:permissions||{editProject:false,editInventory:true,editContent:true,publish:false},status:'ACTIVE',createdat:now()}]));
  return {id:row.id,projectId,companyId,label,role,permissions:row.permissions,token};
}
export async function getProjectAccessLinkByToken(token){
  if(!token)return null;
  const tokenhash=crypto.createHash('sha256').update(token).digest('hex');
  const row=one(await select('project_access_links',{tokenhash:`eq.${tokenhash}`,status:'eq.ACTIVE',select:'*',limit:'1'}));
  if(!row)return null;
  if(row.expiresat && new Date(row.expiresat)<=new Date()) return null;
  await update('project_access_links',{id:`eq.${row.id}`},{lastusedat:now()});
  return {id:row.id,companyId:row.companyid,projectId:row.projectid,label:row.label,role:row.role,permissions:row.permissions||{}};
}
export async function revokeProjectAccessLink(projectId,companyId){return one(await update('project_access_links',{projectid:`eq.${projectId}`,companyid:`eq.${companyId}`,status:'eq.ACTIVE'},{status:'REVOKED'}));}
