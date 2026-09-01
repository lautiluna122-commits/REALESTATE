import { useEffect, useState } from 'react';
import { api } from '../admin/api';

export default function ShowroomPlaceholder({ publicSlug }) {
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  useEffect(() => {
    api(`/public/projects/${publicSlug}`).then((data) => setState({ loading: false, data, error: '' }))
      .catch((error) => setState({ loading: false, data: null, error: error.message }));
  }, [publicSlug]);
  if (state.loading) return <main className="admin-page">Loading showroom…</main>;
  if (state.error) return <main className="admin-page"><h1>Showroom unavailable</h1><p>{state.error}</p></main>;
  const { project, publication } = state.data;
  return <main className="admin-page"><p className="eyebrow">Published project</p><h1>{project.name}</h1><p>{project.description}</p><dl><dt>Location</dt><dd>{project.location?.city || 'Not specified'} {project.location?.country || ''}</dd><dt>Status</dt><dd>{publication?.status}</dd></dl></main>;
}