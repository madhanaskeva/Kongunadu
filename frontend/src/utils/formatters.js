export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === '') return '—';
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount;
  if (isNaN(num)) return amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatNumber = (val) => {
  if (val === null || val === undefined || val === '') return '—';
  const num = Number(val);
  if (isNaN(num)) return val;
  return new Intl.NumberFormat('en-IN').format(num);
};

export const formatPhone = (phone) => {
  if (!phone) return '—';
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return phone;
};

export const formatImei = (imei) => {
  if (!imei) return '—';
  const s = String(imei).replace(/\D/g, '');
  if (s.length === 15) {
    return `${s.slice(0, 2)} ${s.slice(2, 8)} ${s.slice(8, 14)} ${s.slice(14)}`;
  }
  return imei;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return dateStr;
};

