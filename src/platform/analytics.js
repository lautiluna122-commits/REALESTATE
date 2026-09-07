export const ANALYTICS_EVENT = Object.freeze({
  SHOWROOM_OPEN: 'showroom_open',
  EXTERIOR_VIEW: 'exterior_view',
  BUILDING_VIEW: 'building_view',
  FLOOR_SELECT: 'floor_select',
  UNIT_SELECT: 'unit_select',
  PLAN_VIEW: 'plan_view',
  INTERIOR_OPEN: 'interior_open',
  ROOM_SELECT: 'room_select',
  PANORAMA_OPEN: 'panorama_open',
  CTA_CONTACT: 'cta_contact',
  CTA_WHATSAPP: 'cta_whatsapp',
});

const SESSION_KEY = 'realestate:analytics-session';

export function getAnalyticsSessionId() {
  if (typeof window === 'undefined') return null;
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function createAnalyticsEvent(projectId, event, payload = {}) {
  return {
    projectId,
    sessionId: getAnalyticsSessionId(),
    event,
    entityType: payload.entityType ?? null,
    entityId: payload.entityId ?? null,
    metadata: payload.metadata ?? {},
    occurredAt: new Date().toISOString(),
  };
}

export async function trackShowroomEvent(projectId, event, payload = {}) {
  const body = createAnalyticsEvent(projectId, event, payload);
  if (typeof window === 'undefined') return body;
  try {
    const response = await fetch('/api/analytics/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true });
    return response.ok ? body : null;
  } catch {
    return null;
  }
}
