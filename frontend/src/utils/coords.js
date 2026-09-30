// Latitude / longitude checks shared by the master forms.
// Returns { lat?, lng? } error messages; empty object when both are valid.
export const coordErrors = (f) => {
  const errs = {};
  const check = (key, label, max) => {
    const raw = String(f[key] ?? '').trim();
    if (!raw) { errs[key] = `Enter ${label.toLowerCase()}.`; return; }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < -max || n > max) errs[key] = `${label} must be a number between −${max} and ${max}.`;
  };
  check('lat', 'Latitude', 90);
  check('lng', 'Longitude', 180);
  return errs;
};
