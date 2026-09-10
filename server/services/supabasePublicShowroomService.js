import { select } from '../supabaseClient.js';
import { getPublishedProjectByPublicSlug } from './supabaseProjectService.js';

const projection = (p) => ({
  id:p.id,name:p.name,slug:p.slug,description:p.description,status:p.status,
  location:p.location,branding:p.branding,buildingReference:p.buildingReference,createdAt:p.createdAt,
});
const one = (rows) => Array.isArray(rows) ? rows[0] || null : rows;

export async function getPublishedShowroomBySlug(publicSlug){
  const base=await getPublishedProjectByPublicSlug(publicSlug);if(!base)return null;
  const projectId=base.project.id;
  const [buildings,floors,units,plans,amenities,assets,locations]=await Promise.all([
    select('buildings',{projectid:`eq.${projectId}`,select:'id,projectid,name,reference,metadata,createdat',order:'createdat.asc'}),
    select('floors',{projectid:`eq.${projectId}`,select:'id,projectid,buildingid,number,name,metadata,createdat',order:'number.asc'}),
    select('units',{projectid:`eq.${projectId}`,select:'id,projectid,buildingid,floorid,number,surface,bedrooms,bathrooms,terrace,price,currency,status,description,planid,modelreference,images,createdat',order:'floorid.asc,number.asc'}),
    select('plans',{projectid:`eq.${projectId}`,select:'id,projectid,name,kind,filepath,description,createdat',order:'createdat.asc'}),
    select('amenities',{projectid:`eq.${projectId}`,select:'id,projectid,name,description,category,createdat',order:'createdat.asc'}),
    select('assets',{projectid:`eq.${projectId}`,select:'id,projectid,entitytype,entityid,name,kind,path,url,mimetype,metadata,isprimary,createdat',order:'createdat.asc'}),
    select('locations',{projectid:`eq.${projectId}`,select:'id,projectid,name,city,country,district,coordinates,createdat',limit:'1'}),
  ]);
  return {
    project:projection(base.project), publication:base.publication,
    buildings,floors,units,plans,amenities,assets,location:one(locations)||null,
  };
}
