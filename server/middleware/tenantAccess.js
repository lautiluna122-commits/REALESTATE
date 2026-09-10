import { getProjectById } from '../services/projectService.js';

export function requireOwnProject(req, res, next) {
  const projectId = req.params.projectId;
  if (!projectId) return res.status(400).json({ message: 'projectId is required' });

  const project = getProjectById(projectId);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  if (!req.company || String(project.companyId) !== String(req.company.id)) {
    return res.status(403).json({ message: 'project access denied' });
  }

  req.project = project;
  next();
}
