import TMSReports from './tms-report-builder.js';

// Download sheets as an .xlsx file. sheets: [{ name, columns, rows }]
export const downloadXlsx = (fileName, sheets) => {
  const R = (typeof window !== 'undefined' && window.TMSReports) || TMSReports;
  const url = URL.createObjectURL(R.xlsx(sheets));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

// DD-MM-YYYY for file names.
export const fileDate = (d = new Date()) => {
  const p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
};

// ---- reading ----------------------------------------------------------------------------------

const parseCsv = (text) => {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
};

// Minimal .xlsx reader: unzip with the browser's DecompressionStream, then read the
// first worksheet and the shared strings table.
const unzip = async (buf) => {
  const dv = new DataView(buf), u8 = new Uint8Array(buf), dec = new TextDecoder();
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= 0; i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('Not an .xlsx file');
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const files = {};
  for (let n = 0; n < count; n++) {
    const method = dv.getUint16(p + 10, true), size = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true), extra = dv.getUint16(p + 30, true), comment = dv.getUint16(p + 32, true);
    const local = dv.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nameLen));
    const start = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
    files[name] = { method, data: u8.subarray(start, start + size) };
    p += 46 + nameLen + extra + comment;
  }
  const read = async (name) => {
    const f = files[name];
    if (!f) return null;
    if (f.method === 0) return dec.decode(f.data);
    const stream = new Blob([f.data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Response(stream).text();
  };
  return { files, read };
};

const colIndex = ref => ref.replace(/\d+/g, '').split('').reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;

const parseXlsx = async (buf) => {
  const zip = await unzip(buf);
  const xml = s => new DOMParser().parseFromString(s, 'application/xml');
  const ssText = await zip.read('xl/sharedStrings.xml');
  const shared = ssText ? [...xml(ssText).getElementsByTagName('si')].map(si => [...si.getElementsByTagName('t')].map(t => t.textContent).join('')) : [];
  const sheetName = Object.keys(zip.files).filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort()[0];
  if (!sheetName) throw new Error('No worksheet found');
  const doc = xml(await zip.read(sheetName));
  return [...doc.getElementsByTagName('row')].map(r => {
    const out = [];
    [...r.getElementsByTagName('c')].forEach(c => {
      const t = c.getAttribute('t'), v = c.getElementsByTagName('v')[0];
      const val = t === 's' ? shared[+(v && v.textContent)] : t === 'inlineStr' ? [...c.getElementsByTagName('t')].map(x => x.textContent).join('') : v ? v.textContent : '';
      out[colIndex(c.getAttribute('r') || 'A')] = val == null ? '' : String(val);
    });
    return Array.from(out, x => x || '');
  });
};

// File (.xlsx or .csv) -> rows as arrays of strings; blank rows dropped.
export const readSheet = async (file) => {
  const rows = /\.csv$/i.test(file.name) ? parseCsv(await file.text()) : await parseXlsx(await file.arrayBuffer());
  return rows.map(r => r.map(c => String(c).trim())).filter(r => r.some(Boolean));
};
