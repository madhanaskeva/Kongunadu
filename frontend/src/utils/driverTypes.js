// Driver types. "Acting" replaced the old "Supporting"; records saved before the
// rename are read back as Acting everywhere (admin portal and supervisor app).
export const DRIVER_TYPES = ['Regular', 'Acting'];
export const normDriverType = t => (t === 'Supporting' ? 'Acting' : t);
export const normDriver = d => (d && d.type === 'Supporting' ? { ...d, type: 'Acting' } : d);
