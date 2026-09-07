export const PUBLICATION_SURFACE = Object.freeze({
  SHOWROOM: 'showroom',
  EMBED: 'embed',
  CLIENT_PORTAL: 'client-portal',
  CUSTOM_DOMAIN: 'custom-domain',
});

export function createPublicationManifest(project) {
  const slug = project.publication?.publicSlug ?? project.slug;
  return {
    projectId: project.id,
    slug,
    surfaces: {
      showroom: `/proyecto/${slug}`,
      embed: `/embed/${slug}`,
      clientPortal: `/cliente/${slug}`,
      customDomain: project.publication?.customDomain ?? null,
    },
    readOnly: true,
    publishedAt: project.publication?.publishedAt ?? null,
  };
}

export function canPublish(project) {
  return Boolean(project?.id && project?.slug && project?.units?.length && project?.config);
}
