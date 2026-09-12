import express from 'express';
import cors from 'cors';
import {
  listCompanies,createCompany,getCompanyByApiKey,listProjectsByCompany,createProject,getProjectById,getPublishedProjectByPublicSlug,listPublicProjects,updateProject,
  createBuilding,listProjectBuildings,createFloor,listProjectFloors,createUnit,listProjectUnits,getUnitById,updateUnit,createPlan,listProjectPlans,
  createAmenity,listProjectAmenities,createAsset,listProjectAssets,createLocation,getProjectLocation,getPublication,createProjectPublication,updatePublication,
  publishProject,unpublishProject,listProjectLeads,createLead,ensureCompanyAccess,createProjectAccessLink,getProjectAccessLinkByToken,revokeProjectAccessLink,
} from './services/supabaseProjectService.js';
import { getPublishedShowroomBySlug } from './services/supabasePublicShowroomService.js';

const app=express();
app.set('trust proxy',1);
const allowedOrigins=(process.env.CORS_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
app.use(cors({origin:(origin,cb)=>{if(!origin||allowedOrigins.length===0||allowedOrigins.includes(origin))return cb(null,true);return cb(new Error('Origin not allowed'));}}));
app.use(express.json({limit:'5mb'}));

const fail=(res,e,defaultStatus=400)=>res.status(e?.status||defaultStatus).json({message:e?.message||'Request failed'});
async function requireApiKey(req,res,next){try{
  const key=req.header('x-api-key');
  const share=req.header('x-share-token');
  if(share){
    const access=await getProjectAccessLinkByToken(share);
    if(!access)return res.status(401).json({message:'invalid or expired share link'});
    const project=await getProjectById(access.projectId);
    if(!project||String(project.companyId)!==String(access.companyId))return res.status(403).json({message:'share project access denied'});
    req.company={id:access.companyId,name:project.name,slug:'shared',status:'ACTIVE'};
    req.share=access;
    return next();
  }
  if(!key)return res.status(401).json({message:'x-api-key header required'});
  const company=await getCompanyByApiKey(key);
  if(!company)return res.status(401).json({message:'invalid api key'});
  req.company=company; next();
}catch(e){fail(res,e,500);}}
function requirePlatformKey(req,res,next){const configured=process.env.PLATFORM_API_KEY;if(!configured)return res.status(503).json({message:'platform access is not configured'});if(req.header('x-platform-key')!==configured)return res.status(401).json({message:'invalid platform key'});req.authScope='platform';next();}
async function requireOwnCompany(req,res,next){if(!req.company||String(req.company.id)!==String(req.params.companyId))return res.status(403).json({message:'company mismatch'});next();}
async function requireOwnProject(req,res,next){try{const p=await getProjectById(req.params.projectId);if(!p)return res.status(404).json({message:'Project not found'});if(!req.company||String(p.companyId)!==String(req.company.id))return res.status(403).json({message:'project access denied'});req.project=p;next();}catch(e){fail(res,e,500);}}

app.get('/api/health',(_req,res)=>res.json({status:'ok',service:'real-estate-platform',database:'supabase',timestamp:new Date().toISOString()}));
app.get('/api/admin/companies',requirePlatformKey,async(_req,res)=>{try{res.json(await listCompanies());}catch(e){fail(res,e,500);}});
app.post('/api/admin/companies',requirePlatformKey,async(req,res)=>{try{const {name,slug}=req.body||{};if(!name||!slug)return res.status(400).json({message:'name and slug are required'});res.status(201).json(await createCompany({name,slug}));}catch(e){fail(res,e);}});
app.use('/api/admin',requireApiKey);
app.use('/api/admin/projects/:projectId', (req,res,next)=>{ if(req.share && String(req.share.projectId)!==String(req.params.projectId)) return res.status(403).json({message:'share link is scoped to another project'}); next(); });
app.get('/api/admin/me',(req,res)=>res.json({id:req.company.id,name:req.company.name,slug:req.company.slug,status:req.company.status}));
app.get('/api/admin/companies/:companyId/projects',requireOwnCompany,async(req,res)=>{try{res.json(await listProjectsByCompany(req.params.companyId));}catch(e){fail(res,e,500);}});
app.post('/api/admin/projects',async(req,res)=>{try{const payload=req.body||{};if(String(payload.companyId)!==String(req.company.id))return res.status(403).json({message:'company mismatch'});res.status(201).json(await createProject(payload));}catch(e){fail(res,e);}});
app.use('/api/admin/projects/:projectId',requireOwnProject);
app.get('/api/admin/projects/:projectId',(_req,res)=>res.json(_req.project));
app.patch('/api/admin/projects/:projectId',async(req,res)=>{try{const allowed=['name','slug','description','status','location','branding','buildingReference','environmentConfig','publicationConfig'];const updates=Object.fromEntries(Object.entries(req.body||{}).filter(([k])=>allowed.includes(k)));if(updates.slug){const conflict=await getProjectById(req.params.projectId);if(conflict&&conflict.slug!==updates.slug&&await (async()=>{const list=await listProjectsByCompany(req.company.id);return list.some(p=>p.slug===updates.slug&&p.id!==req.params.projectId);})())return res.status(409).json({message:'project slug already exists for this company'});}res.json(await updateProject(req.params.projectId,req.company.id,updates));}catch(e){fail(res,e);}});

app.post('/api/admin/projects/:projectId/buildings',async(req,res)=>{try{res.status(201).json(await createBuilding({projectId:req.params.projectId,...req.body}));}catch(e){fail(res,e);}});
app.get('/api/admin/projects/:projectId/buildings',async(req,res)=>{try{res.json(await listProjectBuildings(req.params.projectId));}catch(e){fail(res,e,500);}});
app.post('/api/admin/projects/:projectId/floors',async(req,res)=>{try{res.status(201).json(await createFloor({projectId:req.params.projectId,...req.body,number:Number(req.body.number)}));}catch(e){fail(res,e);}});
app.get('/api/admin/projects/:projectId/floors',async(req,res)=>{try{res.json(await listProjectFloors(req.params.projectId,req.query.buildingId||null));}catch(e){fail(res,e,500);}});
app.post('/api/admin/projects/:projectId/units',async(req,res)=>{try{res.status(201).json(await createUnit({projectId:req.params.projectId,...req.body}));}catch(e){fail(res,e);}});
app.get('/api/admin/projects/:projectId/units',async(req,res)=>{try{res.json(await listProjectUnits(req.params.projectId));}catch(e){fail(res,e,500);}});
app.get('/api/admin/projects/:projectId/units/:unitId',async(req,res)=>{try{const u=await getUnitById(req.params.projectId,req.params.unitId);return u?res.json(u):res.status(404).json({message:'Unit not found'});}catch(e){fail(res,e,500);}});
app.patch('/api/admin/projects/:projectId/units/:unitId',async(req,res)=>{try{const u=await updateUnit(req.params.projectId,req.params.unitId,req.body||{});return u?res.json(u):res.status(404).json({message:'Unit not found'});}catch(e){fail(res,e);}});
app.post('/api/admin/projects/:projectId/plans',async(req,res)=>{try{res.status(201).json(await createPlan({projectId:req.params.projectId,...req.body}));}catch(e){fail(res,e);}});
app.get('/api/admin/projects/:projectId/plans',async(req,res)=>{try{res.json(await listProjectPlans(req.params.projectId));}catch(e){fail(res,e,500);}});
app.post('/api/admin/projects/:projectId/amenities',async(req,res)=>{try{res.status(201).json(await createAmenity({projectId:req.params.projectId,...req.body}));}catch(e){fail(res,e);}});
app.get('/api/admin/projects/:projectId/amenities',async(req,res)=>{try{res.json(await listProjectAmenities(req.params.projectId));}catch(e){fail(res,e,500);}});
app.post('/api/admin/projects/:projectId/assets',async(req,res)=>{try{res.status(201).json(await createAsset({projectId:req.params.projectId,...req.body}));}catch(e){fail(res,e);}});
app.get('/api/admin/projects/:projectId/assets',async(req,res)=>{try{res.json(await listProjectAssets(req.params.projectId));}catch(e){fail(res,e,500);}});
app.post('/api/admin/projects/:projectId/location',async(req,res)=>{try{res.status(201).json(await createLocation({projectId:req.params.projectId,...req.body}));}catch(e){fail(res,e);}});
app.get('/api/admin/projects/:projectId/location',async(req,res)=>{try{res.json(await getProjectLocation(req.params.projectId));}catch(e){fail(res,e,500);}});

app.get('/api/admin/projects/:projectId/publication',async(req,res)=>{try{res.json(await getPublication(req.params.projectId));}catch(e){fail(res,e,500);}});
app.post('/api/admin/projects/:projectId/publication',async(req,res)=>{try{res.status(201).json(await createProjectPublication({projectId:req.params.projectId,...req.body}));}catch(e){fail(res,e);}});
app.patch('/api/admin/projects/:projectId/publication',async(req,res)=>{try{const current=await getPublication(req.params.projectId);if(!current)return res.status(404).json({message:'Publication not configured'});const allowed=['publicSlug','publicUrl','title','description','thumbnail','buttonText','customDomain'];const entries=Object.fromEntries(Object.entries(req.body||{}).filter(([k])=>allowed.includes(k)));if(entries.publicSlug&&entries.publicSlug!==current.publicSlug){const publicProject=await getPublishedProjectByPublicSlug(entries.publicSlug);if(publicProject&&publicProject.project.id!==req.params.projectId)return res.status(409).json({message:'public slug already in use'});}res.json(await updatePublication(req.params.projectId,entries));}catch(e){fail(res,e);}});
app.post('/api/admin/projects/:projectId/publish',async(req,res)=>{try{res.json(await publishProject(req.params.projectId,req.body||{}));}catch(e){fail(res,e);}});
app.post('/api/admin/projects/:projectId/unpublish',async(req,res)=>{try{const pub=await getPublication(req.params.projectId);if(!pub)return res.status(404).json({message:'Publication not configured'});res.json(await unpublishProject(req.params.projectId));}catch(e){fail(res,e);}});
app.post('/api/admin/projects/:projectId/access-link',async(req,res)=>{try{if(req.share)return res.status(403).json({message:'share links cannot create share links'});res.status(201).json(await createProjectAccessLink({companyId:req.company.id,projectId:req.params.projectId,label:req.body?.label||'Cliente',permissions:req.body?.permissions}));}catch(e){fail(res,e);}});
app.get('/api/admin/projects/:projectId/access-link',async(req,res)=>{try{const link=await getProjectAccessLinkByToken(req.header('x-share-token')||''); if(req.share)return res.json({active:true,role:req.share.role,permissions:req.share.permissions}); res.json({active:false});}catch(e){fail(res,e);}});
app.delete('/api/admin/projects/:projectId/access-link',async(req,res)=>{try{if(req.share)return res.status(403).json({message:'share links cannot revoke access'});res.json(await revokeProjectAccessLink(req.params.projectId,req.company.id));}catch(e){fail(res,e);}});
app.get('/api/admin/projects/:projectId/leads',async(req,res)=>{try{res.json(await listProjectLeads(req.params.projectId));}catch(e){fail(res,e,500);}});

app.use('/api/company',requireApiKey);
app.get('/api/company/:companyId/projects',requireOwnCompany,async(req,res)=>{try{res.json(await listProjectsByCompany(req.params.companyId));}catch(e){fail(res,e,500);}});
app.get('/api/company/:companyId/projects/:projectId',requireOwnCompany,async(req,res)=>{try{const p=await getProjectById(req.params.projectId);if(!p)return res.status(404).json({message:'Project not found'});if(String(p.companyId)!==String(req.params.companyId))return res.status(403).json({message:'Access denied'});res.json(p);}catch(e){fail(res,e,500);}});

app.get('/api/platform/companies',requirePlatformKey,async(_req,res)=>{try{res.json(await listCompanies());}catch(e){fail(res,e,500);}});
app.get('/api/platform/companies/:companyId/projects',requirePlatformKey,async(req,res)=>{try{res.json(await listProjectsByCompany(req.params.companyId));}catch(e){fail(res,e,500);}});
app.get('/api/platform/projects/:projectId',requirePlatformKey,async(req,res)=>{try{const p=await getProjectById(req.params.projectId);res.status(p?200:404).json(p||{message:'Project not found'});}catch(e){fail(res,e,500);}});
app.get('/api/platform/projects/:projectId/units',requirePlatformKey,async(req,res)=>{try{res.json(await listProjectUnits(req.params.projectId));}catch(e){fail(res,e,500);}});
app.get('/api/platform/projects/:projectId/leads',requirePlatformKey,async(req,res)=>{try{res.json(await listProjectLeads(req.params.projectId));}catch(e){fail(res,e,500);}});

app.get('/api/public/projects',async(_req,res)=>{try{res.json(await listPublicProjects());}catch(e){fail(res,e,500);}});
app.get('/api/public/projects/:publicSlug',async(req,res)=>{try{const r=await getPublishedShowroomBySlug(req.params.publicSlug);return r?res.json(r):res.status(404).json({message:'Project not found or not published'});}catch(e){fail(res,e,500);}});
app.get('/api/projects/public/list',async(_req,res)=>{try{res.json(await listPublicProjects());}catch(e){fail(res,e,500);}});
app.get('/api/projects/public/:slug',async(req,res)=>{try{const r=await getPublishedShowroomBySlug(req.params.slug);return r?res.json(r):res.status(404).json({message:'Project not found or not published'});}catch(e){fail(res,e,500);}});
app.post('/api/projects/:projectId/leads',async(req,res)=>{try{const name=typeof req.body?.name==='string'?req.body.name.trim():'';const email=typeof req.body?.email==='string'?req.body.email.trim().toLowerCase():'';const phone=typeof req.body?.phone==='string'?req.body.phone.trim():null;const message=typeof req.body?.message==='string'?req.body.message.trim():'';const {unitId=null}=req.body||{};if(name.length<2||name.length>120)return res.status(400).json({message:'name must be between 2 and 120 characters'});if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return res.status(400).json({message:'valid email is required'});if(phone!==null&&(phone.length>40||phone.length===0))return res.status(400).json({message:'phone must be a non-empty value up to 40 characters'});res.status(201).json(await createLead({name,email,phone,message,projectId:req.params.projectId,unitId}));}catch(e){fail(res,/not found/i.test(e.message)?{...e,status:404}:e);}});
app.post('/api/auth/tenant-access',requireApiKey,(req,res)=>{const {requestedCompanyId,targetCompanyId}=req.body||{};if(String(requestedCompanyId)!==String(req.company.id))return res.status(403).json({allowed:false});res.json({allowed:ensureCompanyAccess(requestedCompanyId,targetCompanyId)});});

export {app};
