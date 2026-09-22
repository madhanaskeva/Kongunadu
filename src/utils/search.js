// Shared search matching for the admin pages: ignores upper / lower case, spaces and punctuation,
// so "tn28aq4521", "TN 28 AQ" and "tn-28 aq 4521" all find "TN 28 AQ 4521". Each word of the
// query must appear somewhere in the fields.
const lower = s => String(s == null ? '' : s).toLowerCase();
const squash = s => lower(s).replace(/[\s\-_/.,·:;()'"]+/g, '');

export const matchesSearch = (query, ...fields) => {
  const q = lower(query).trim();
  if (!q) return true;
  const text = lower(fields.flat(Infinity).filter(f => f != null && typeof f !== 'object').join(' '));
  const flat = squash(text);
  if (text.includes(q) || flat.includes(squash(q))) return true;
  return q.split(/\s+/).every(w => text.includes(w) || flat.includes(squash(w)));
};

export default matchesSearch;
