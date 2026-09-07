export const BILLING_INTERVAL = Object.freeze({ MONTH: 'month', QUARTER: 'quarter', YEAR: 'year' });

export const SERVICE_PLANS = Object.freeze({
  ESSENTIAL: { code: 'essential', name: 'Essential', setupFrom: 3500, monthly: 149, annual: 149 * 10, support: 'standard' },
  PREMIUM: { code: 'premium', name: 'Premium', setupFrom: 6000, monthly: 249, annual: 249 * 10, support: 'priority' },
  ENTERPRISE: { code: 'enterprise', name: 'Enterprise', setupFrom: 10000, monthlyFrom: 500, annualFrom: 5000, support: 'sla' },
});

export const SERVICE_SCOPE = Object.freeze({
  INCLUDED: 'included',
  QUOTED: 'quoted',
});

export const INCLUDED_SERVICE_CHANGES = [
  'price', 'availability', 'commercial-copy', 'approved-images', 'contact-data', 'promotions',
];

export const QUOTED_SERVICE_CHANGES = [
  'new-building', 'new-tower', 'new-3d-model', 'new-interior', 'new-animation', 'crm-integration', 'major-redesign',
];

export function calculateAnnualPrice(planCode) {
  const plan = SERVICE_PLANS[planCode?.toUpperCase()];
  return plan?.annual ?? plan?.annualFrom ?? null;
}
