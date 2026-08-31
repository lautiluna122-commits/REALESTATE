import { useEffect, useState } from 'react';
import { adminApi } from './api';

const sections = ['overview', 'buildings', 'floors', 'units', 'inventory', 'plans', 'assets', 'amenities', 'location', 'publication'];
const resourceFields = {
  buildings: ['name', 'reference'], floors: ['buildingId', 'number', 'name'], units: ['buildingId', 'floorId', 'number', 'bedrooms', 'bathrooms', 'surface', 'price', 'currency', 'status', 'description'],
  plans: ['name', 'kind', 'filePath', 'description'], assets: ['name', 'kind', 'url', 'mimeType'], amenities: ['name', 'category', 'description'],
};
const path = () => window.location.pathname.split('/').filter(Boolean);
function Link({ href, children }) { return <a href={href}>{children}</a>; }
function Form({ fields, initial = {}, onSave }) {
  const [value, setValue] = useState(initial);
  return <form onSubmit={(e) => { e.preventDefault(); onSave(value); }} className="admin-form">{fields.map((field) => <label key={field}>{field}<input value={value[field] ?? ''} onChange={(e) => setValue({ ...value, [field]: e.target.value })} /></label>)}<button>Save</button></form>;
}
export default function AdminApp() {
  const parts = path(), [companies, setCompanies] = useState([]), [project, setProject] = useState(null), [items, setItems] = useState([]), [error, setError] = useState('');
  const companyId = parts[1] === 'companies' ? parts[2] : null, projectId = parts[1] === 'projects' ? parts[2] : null, section = projectId ? (parts[3] || 'overview') : null;
  const load = async () => { try {
    if (projectId) { const p = await adminApi.project(projectId); setProject(p); if (section && section !== 'overview' && section !== 'publication' && section !== 'location') setItems(await adminApi.resource(projectId, section === 'inventory' ? 'units' : section)); }
    else setCompanies(await adminApi.companies());
  } catch (e) { setError(e.message); } };
  useEffect(() => { load(); }, [companyId, projectId, section]);
  if (projectId && project) return <main className="admin-page"><nav><Link href="/admin">Companies</Link> / <Link href="/admin/projects">Projects</Link></nav><h1>{project.name}</h1><p>{project.description}</p><nav className="tabs">{sections.map((s) => <Link key={s} href={`/admin/projects/${projectId}/${s}`}>{s}</Link>)}</nav>{error && <p>{error}</p>}{section === 'overview' && <Form fields={['name','slug','description','status']} initial={project} onSave={async (body) => { await adminApi.updateProject(projectId, body); load(); }} />}{section === 'publication' && <button onClick={async () => { project.status === 'PUBLISHED' ? await adminApi.unpublish(projectId) : await adminApi.publish(projectId, { publicSlug: project.slug, title: project.name }); load(); }}>{project.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}</button>}{section === 'location' && <Form fields={['name','city','country','district']} initial={{}} onSave={(body) => adminApi.saveLocation(projectId, body)} />}{!['overview','publication','location'].includes(section) && <><Form fields={resourceFields[section === 'inventory' ? 'units' : section] || []} onSave={async (body) => { await adminApi.createResource(projectId, section === 'inventory' ? 'units' : section, body); load(); }} /><table><tbody>{items.map((item) => <tr key={item.id}><td>{item.name || item.number}</td><td>{item.status || item.kind || ''}</td></tr>)}</tbody></table></>}</main>;
  return <main className="admin-page"><h1>Project management</h1><p>{error}</p><Form fields={['name','slug']} onSave={async (body) => { await adminApi.createCompany(body); load(); }} /><h2>Companies</h2><ul>{companies.map((c) => <li key={c.id}><Link href={`/admin/companies/${c.id}`}>{c.name}</Link></li>)}</ul>{companyId && <CompanyDetail id={companyId} />}</main>;
}
function CompanyDetail({ id }) {
 const [projects, setProjects] = useState([]); useEffect(() => { adminApi.companyProjects(id).then(setProjects); }, [id]);
 return <section><h2>Projects</h2><ul>{projects.map((p) => <li key={p.id}><Link href={`/admin/projects/${p.id}`}>{p.name}</Link></li>)}</ul></section>;
}