export const generateId = (prefix = 'ID') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

export const calculateVariance = (fixedKm, actualKm) => {
  if (!fixedKm || !actualKm) return 0;
  const f = Number(fixedKm);
  const a = Number(actualKm);
  if (f === 0) return 0;
  return Number((((a - f) / f) * 100).toFixed(1));
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'enroute':
      return { bg: 'var(--st-enroute-bg)', fg: 'var(--st-enroute-fg)', border: 'var(--st-enroute-edge)' };
    case 'closed':
      return { bg: 'var(--st-closed-bg)', fg: 'var(--st-closed-fg)', border: 'var(--st-closed-edge)' };
    case 'loading':
      return { bg: 'var(--st-loading-bg)', fg: 'var(--st-loading-fg)', border: 'var(--st-loading-edge)' };
    case 'unloading':
      return { bg: 'var(--st-unloading-bg)', fg: 'var(--st-unloading-fg)', border: 'var(--st-unloading-edge)' };
    case 'delayed':
      return { bg: 'var(--st-delayed-bg)', fg: 'var(--st-delayed-fg)', border: 'var(--st-delayed-edge)' };
    case 'active':
    case 'approved':
    case 'ok':
      return { bg: 'var(--kr-green-100)', fg: 'var(--kr-green-800)', border: 'var(--kr-green-600)' };
    case 'pending':
    case 'under review':
      return { bg: 'var(--kr-saffron-100)', fg: '#7A4300', border: 'var(--kr-saffron-500)' };
    case 'inactive':
    case 'rejected':
    case 'failed':
      return { bg: 'var(--kr-red-100)', fg: 'var(--kr-red-800)', border: 'var(--kr-red-600)' };
    default:
      return { bg: 'var(--kr-grey-100)', fg: 'var(--kr-grey-700)', border: 'var(--kr-grey-300)' };
  }
};

