/** Breadcrumb summary of the wizard's current selections, e.g. "Housing Loan · Private Sector · engineer". */
export function buildContextLabel(state, t) {
  if (!state.loanCategory) return null;
  const parts = [
    t(`categories.${state.loanCategory}.label`),
    state.sector ? t(`sectors.${state.sector}`) : null,
    state.occupationId && state.occupationId !== 'general' ? state.occupationId : null,
  ].filter(Boolean);
  return parts.join(' · ');
}
