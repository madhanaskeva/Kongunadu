import TMSReports from './tms-report-builder.js';

/* Spreadsheet download and upload for the Admin Portal — no library.
 *
 *   downloadXlsx(fileName, sheets)    sheets: [{ name, columns, rows }] -> real .xlsx download
 *   downloadCsv(fileName, columns, rows)  UTF-8 CSV with BOM (Excel shows ₹ / Tamil correctly)
 *   readSheet(file)                   .xlsx / .csv / .tsv / .txt / SpreadsheetML .xml|.xls /
 *                                     HTML-table .xls -> rows as arrays of trimmed strings
 *   rowsToObjects(rows)               first row as headings -> [{ heading: value }]
 *   fileDate()                        DD-MM-YYYY for file names
 */

// ---- writing ----------------------------------------------------------------------------------

// One cell value as something a spreadsheet can hold: numbers stay numbers, everything
// else becomes readable text (arrays joined, booleans Yes/No, dates formatted).
export const cellValue = (v) => {
  if (v == null) return '';
  if (typeof v === 'number') return isFinite(v) ? v : '';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (v instanceof Date) return isNaN(v) ? '' : v.toLocaleString('en-IN');
  if (Array.isArray(v)) return v.map(x => { const c = cellValue(x); return c === '' ? null : c; }).filter(x => x != null).join(', ');
  if (typeof v === 'object') return String(v.label ?? v.name ?? v.value ?? v.number ?? '');
  return String(v);
};

const saveBlob = (blob, fileName) => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(blob, fileName);
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

const cleanSheets = (sheets) => {
  const used = new Set();
  return (sheets || []).map((s, i) => {
    let base = String((s && s.name) || `Sheet${i + 1}`).replace(/[\\/?*[\]:]/g, ' ').replace(/^'+|'+$/g, '').trim().slice(0, 31) || `Sheet${i + 1}`;
    let name = base, n = 2;
    while (used.has(name.toLowerCase())) { const suf = ` (${n++})`; name = base.slice(0, 31 - suf.length) + suf; }
    used.add(name.toLowerCase());
    const columns = ((s && s.columns) || []).map(c => String(cellValue(c)));
    const rows = ((s && s.rows) || []).map(r => (Array.isArray(r) ? r : []).map(v => {
      const c = cellValue(v);
      return typeof c === 'string' && c.length > 32767 ? c.slice(0, 32767) : c;
    }));
    return { name, columns, rows };
  });
};

// Build the .xlsx Blob (exposed for tests and callers that want the bytes).
export const buildXlsx = (sheets) => {
  const R = (typeof window !== 'undefined' && window.TMSReports && window.TMSReports.xlsx) ? window.TMSReports : TMSReports;
  return R.xlsx(cleanSheets(sheets));
};

// Download sheets as an .xlsx file. sheets: [{ name, columns, rows }]
export const downloadXlsx = (fileName, sheets) => {
  const name = /\.xlsx$/i.test(fileName) ? fileName : `${fileName}.xlsx`;
  saveBlob(buildXlsx(sheets), name);
  return name;
};

const csvCell = (v) => {
  const s = String(cellValue(v));
  return /[",\r\n]/.test(s) || /^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const buildCsv = (columns, rows) =>
  '﻿' + [columns, ...(rows || [])].map(r => (r || []).map(csvCell).join(',')).join('\r\n') + '\r\n';

// Download a CSV that Excel opens with Unicode intact (UTF-8 BOM).
export const downloadCsv = (fileName, columns, rows) => {
  const name = /\.csv$/i.test(fileName) ? fileName : `${fileName}.csv`;
  saveBlob(new Blob([buildCsv(columns, rows)], { type: 'text/csv;charset=utf-8' }), name);
  return name;
};

// DD-MM-YYYY for file names.
export const fileDate = (d = new Date()) => {
  const p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
};

// ---- reading ----------------------------------------------------------------------------------

export const parseCsv = (input) => {
  const text = String(input || '').replace(/^﻿/, '');
  // Pick the delimiter the first line actually uses (Excel in some locales saves ";").
  const first = text.split(/\r?\n/, 1)[0] || '';
  const count = ch => first.split(ch).length - 1;
  const delim = [',', ';', '\t'].reduce((best, ch) => (count(ch) > count(best) ? ch : best), ',');
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"' && cell.trim() === '') { q = true; cell = ''; }
    else if (ch === delim) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
};

const decodeXml = (s) => String(s || '')
  .replace(/_x([0-9A-Fa-f]{4})_/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&');

const stripTags = s => String(s || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');

// Text of every <t> in a shared/inline string, skipping phonetic runs (<rPh>).
const textOf = (xml) => {
  const body = String(xml || '').replace(/<rPh\b[\s\S]*?<\/rPh>/g, '');
  let out = '';
  body.replace(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g, (_, t) => { out += t; return ''; });
  return decodeXml(out);
};

// Zip reader using the browser's DecompressionStream (Chrome 103+, Edge, Firefox 113+, Safari 16.4+).
const unzip = (buf) => {
  const dv = new DataView(buf), u8 = new Uint8Array(buf), dec = new TextDecoder();
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('This file is not a valid .xlsx workbook.');
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const files = {};
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true), size = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true), extra = dv.getUint16(p + 30, true), comment = dv.getUint16(p + 32, true);
    const local = dv.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nameLen));
    const start = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
    files[name.replace(/^\//, '')] = { method, data: u8.subarray(start, start + size) };
    p += 46 + nameLen + extra + comment;
  }
  const read = async (name) => {
    const f = files[name];
    if (!f) return null;
    if (f.method === 0) return dec.decode(f.data);
    if (f.method !== 8) throw new Error('This .xlsx uses an unsupported compression. Save it again from Excel, or save as CSV.');
    if (typeof DecompressionStream === 'undefined') throw new Error('This browser cannot open .xlsx files. Save the sheet as CSV (UTF-8) and import that, or update the browser.');
    const stream = new Blob([f.data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Response(stream).text();
  };
  return { files, read };
};

const colIndex = ref => String(ref).replace(/[^A-Z]/gi, '').toUpperCase().split('').reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
const attr = (tag, name) => { const m = new RegExp('\\s' + name + '="([^"]*)"').exec(tag); return m ? decodeXml(m[1]) : null; };
// Excel stores 12.9605 as 12.960500000000001 — show what the user typed.
const numText = s => { const n = Number(s); return s !== '' && isFinite(n) ? String(Number(n.toPrecision(15))) : s; };

export const parseXlsx = async (buf) => {
  const zip = await unzip(buf);
  const ssText = await zip.read('xl/sharedStrings.xml');
  const shared = [];
  if (ssText) ssText.replace(/<si\b[^>]*>([\s\S]*?)<\/si>|<si\b[^>]*\/>/g, (_, inner) => { shared.push(textOf(inner || '')); return ''; });

  // First sheet in workbook order (falls back to the lowest-numbered worksheet part).
  let sheetPath = null;
  const wb = await zip.read('xl/workbook.xml'), rels = await zip.read('xl/_rels/workbook.xml.rels');
  if (wb && rels) {
    const firstSheet = /<sheet\b[^>]*>/.exec(wb);
    const rid = firstSheet && attr(firstSheet[0], 'r:id');
    const rel = rid && new RegExp('<Relationship\\b[^>]*Id="' + rid + '"[^>]*>').exec(rels);
    const target = rel && attr(rel[0], 'Target');
    if (target) sheetPath = target.startsWith('/') ? target.slice(1) : 'xl/' + target.replace(/^\.\//, '');
  }
  if (!sheetPath || !zip.files[sheetPath]) {
    sheetPath = Object.keys(zip.files).filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
      .sort((a, b) => parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10))[0];
  }
  if (!sheetPath) throw new Error('No worksheet found in this workbook.');
  const xml = await zip.read(sheetPath);
  const rows = [];
  let nextRow = 0;
  xml.replace(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g, (_, rattrs, inner) => {
    const rn = attr(' ' + rattrs, 'r');
    const ri = rn ? +rn - 1 : nextRow;
    nextRow = ri + 1;
    const out = [];
    let nextCol = 0;
    (inner || '').replace(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, (__, cattrs, body) => {
      const ref = attr(' ' + cattrs, 'r');
      const ci = ref ? colIndex(ref) : nextCol;
      nextCol = ci + 1;
      const t = attr(' ' + cattrs, 't');
      const vm = /<v>([\s\S]*?)<\/v>/.exec(body || '');
      const v = vm ? decodeXml(vm[1]) : '';
      let val;
      if (t === 's') val = shared[+v] ?? '';
      else if (t === 'inlineStr') val = textOf(body);
      else if (t === 'b') val = v === '1' ? 'TRUE' : v === '0' ? 'FALSE' : v;
      else if (t === 'str' || t === 'e') val = v;
      else val = numText(v);
      out[ci] = val == null ? '' : String(val);
      return '';
    });
    rows[ri] = Array.from(out, x => x || '');
    return '';
  });
  return Array.from(rows, r => r || []);
};

// Excel 2003 XML Spreadsheet (SpreadsheetML) — often saved with an .xls or .xml name.
const parseSpreadsheetMl = (text) => {
  const ws = /<(?:ss:)?Worksheet\b[\s\S]*?<\/(?:ss:)?Worksheet>/.exec(text);
  const src = ws ? ws[0] : text;
  const rows = [];
  src.replace(/<(?:ss:)?Row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:ss:)?Row>)/g, (_, rattrs, inner) => {
    const ri = /(?:ss:)?Index="(\d+)"/.exec(rattrs);
    const r = [];
    let ci = 0;
    (inner || '').replace(/<(?:ss:)?Cell\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:ss:)?Cell>)/g, (__, cattrs, body) => {
      const ix = /(?:ss:)?Index="(\d+)"/.exec(cattrs);
      if (ix) ci = +ix[1] - 1;
      const d = /<(?:ss:)?Data\b[^>]*>([\s\S]*?)<\/(?:ss:)?Data>/.exec(body || '');
      r[ci] = d ? decodeXml(stripTags(d[1])) : '';
      ci++;
      return '';
    });
    rows[ri ? +ri[1] - 1 : rows.length] = Array.from(r, x => x || '');
    return '';
  });
  return Array.from(rows, r => r || []);
};

// An HTML table saved with an .xls name (what many web systems call "Excel export").
const parseHtmlTable = (text) => {
  const t = /<table\b[\s\S]*?<\/table>/i.exec(text);
  if (!t) return [];
  const rows = [];
  t[0].replace(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi, (_, inner) => {
    const r = [];
    inner.replace(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi, (__, cell) => { r.push(decodeXml(stripTags(cell)).replace(/\s+/g, ' ')); return ''; });
    rows.push(r);
    return '';
  });
  return rows;
};

export const UNSUPPORTED_XLS = 'This is an old Excel 97-2003 (.xls) file. In Excel choose File → Save As → "Excel Workbook (.xlsx)" or "CSV UTF-8", then import that file.';

// Bytes + file name -> raw rows (no trimming).
export const parseSheetBuffer = async (buf, name = '') => {
  const u8 = new Uint8Array(buf);
  // .xlsx (zip) — detected by content, so a renamed file still works.
  if (u8[0] === 0x50 && u8[1] === 0x4b) {
    if (/\.ods$/i.test(name)) throw new Error('OpenDocument (.ods) sheets are not supported. Save as .xlsx or CSV and import again.');
    return parseXlsx(buf);
  }
  // Legacy binary .xls (OLE compound file).
  if (u8[0] === 0xd0 && u8[1] === 0xcf && u8[2] === 0x11 && u8[3] === 0xe0) throw new Error(UNSUPPORTED_XLS);
  let text;
  if (u8[0] === 0xff && u8[1] === 0xfe) text = new TextDecoder('utf-16le').decode(u8.subarray(2));
  else if (u8[0] === 0xfe && u8[1] === 0xff) text = new TextDecoder('utf-16be').decode(u8.subarray(2));
  else text = new TextDecoder('utf-8').decode(u8);
  text = text.replace(/^﻿/, '');
  const head = text.slice(0, 2000);
  if (/<(?:ss:)?Workbook\b/.test(head) || /urn:schemas-microsoft-com:office:spreadsheet/.test(head)) return parseSpreadsheetMl(text);
  if (/<table\b/i.test(text) && /^\s*</.test(text)) return parseHtmlTable(text);
  if (/\.(pdf|docx?|pptx?|png|jpe?g|gif)$/i.test(name) || text.indexOf('\u0000') >= 0) {
    throw new Error('This file is not a spreadsheet. Import an .xlsx or .csv file.');
  }
  return parseCsv(text);
};

// File (.xlsx / .csv / .xls saved as XML or HTML) -> rows as arrays of trimmed strings; blank rows dropped.
export const readSheet = async (file) => {
  const buf = await file.arrayBuffer();
  const rows = await parseSheetBuffer(buf, file.name || '');
  return rows.map(r => (r || []).map(c => String(c == null ? '' : c).replace(/ /g, ' ').trim())).filter(r => r.some(Boolean));
};

// First row as headings -> objects keyed by heading text.
export const rowsToObjects = (rows) => {
  const [head = [], ...body] = rows || [];
  return body.map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
};
