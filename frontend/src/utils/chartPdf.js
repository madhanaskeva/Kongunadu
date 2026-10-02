import logoUrl from '../assets/images/logo-1600.png';
import { fileDate, saveBlob } from './spreadsheet';

/* One chart as an A4 PDF download — no library.
 *
 *   downloadChartPdf(spec)   builds the PDF and starts the download
 *   buildChartPdf(spec)      the same PDF as a Blob (for callers that want the bytes)
 *
 *   spec: {
 *     section,   kicker above the title, e.g. 'Trip Statistics'
 *     title,     chart name, e.g. 'Trips'
 *     scope,     what the figures cover, e.g. '02 Sep 2026 – 01 Oct 2026 · 5 clients'
 *     notes,     extra lines under the scope (view, grouping, total …)
 *     chart:     { type: 'bars', categories: [{ label }], series: [{ label, color, values }], integer }
 *              | { type: 'rank', items: [{ label, value, color }] }
 *     format,    value -> display text (with unit)
 *     totals,    optional: one total per series, printed as the table's last row
 *     fileName,  optional; defaults to the title and today's date
 *   }
 *
 * Page: Kongunadu letterhead (logo, tagline, brand rule), title block, the chart drawn
 * as vector shapes, the figures as a table (continuing on further pages if long), and a
 * footer with the generated time and page numbers. Text uses the PDF base fonts
 * (Helvetica, WinAnsi), so characters outside Latin-1 are swapped for close equivalents.
 */

// ---- page geometry (PDF points, A4 portrait) ---------------------------------------------------
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 40; // side margin
const CONTENT_W = PAGE_W - 2 * M;
const FOOTER_Y = PAGE_H - 34;

const NAVY = '#214f63';
const BRAND = '#275e74';
const COPPER = '#b8733a'; // the logo's accent stripe
const INK = '#1c2430';
const MUTED = '#6b7685';
const RULE = '#dfe5ee';
const GRID = '#e6ebf2';
const BAND = '#f3f6fb';

// ---- text: WinAnsi bytes and widths -----------------------------------------------------------
const WIN_ANSI = {
  '€': 0x80, '…': 0x85, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '™': 0x99,
};
const SWAP = { '→': '->', '←': '<-', '₹': 'Rs ', '≥': '>=', '≤': '<=', '×': 'x', '÷': '/', ' ': ' ' };

// Text as WinAnsi bytes (one char per byte), anything unprintable swapped or dropped.
const toAnsi = (s) => {
  let out = '';
  for (const ch of String(s ?? '')) {
    if (SWAP[ch]) { out += SWAP[ch]; continue; }
    const c = ch.codePointAt(0);
    if (WIN_ANSI[ch]) out += String.fromCharCode(WIN_ANSI[ch]);
    else if ((c >= 0x20 && c < 0x7f) || (c >= 0xa0 && c <= 0xff)) out += ch;
    else if (c === 0x0a || c === 0x09) out += ' ';
    else out += '?';
  }
  return out;
};
const escapePdf = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

// Helvetica widths, measured with Arial (same metrics) on a canvas.
let measureCtx = null;
const textWidth = (s, size, bold) => {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  measureCtx.font = `${bold ? 'bold ' : ''}100px Helvetica, Arial, sans-serif`;
  // Measure the Latin-1 form, so swapped characters are counted as printed.
  const printed = toAnsi(s).replace(/[\x80-\x9f]/g, ch => Object.keys(WIN_ANSI).find(k => WIN_ANSI[k] === ch.charCodeAt(0)) || ch);
  return (measureCtx.measureText(printed).width / 100) * size;
};
const fit = (s, size, bold, max) => {
  let t = String(s ?? '');
  if (textWidth(t, size, bold) <= max) return t;
  while (t.length > 1 && textWidth(`${t}…`, size, bold) > max) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
};

// ---- colours ----------------------------------------------------------------------------------
// Accepts #rgb / #rrggbb / rgb() / var(--token) (read from the page's CSS).
const resolveColor = (c, depth = 0) => {
  const v = String(c || '').trim();
  const varName = v.match(/^var\((--[^,)]+)(?:,([^)]+))?\)$/);
  if (varName && depth < 6 && typeof document !== 'undefined') {
    const val = getComputedStyle(document.documentElement).getPropertyValue(varName[1]).trim() || (varName[2] || '').trim();
    return resolveColor(val, depth + 1);
  }
  return v || BRAND;
};
const rgb = (c) => {
  const v = resolveColor(c);
  let r = 13, g = 110, b = 253;
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  const fn = v.match(/^rgba?\(([^)]+)\)$/i);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split('').map(x => x + x).join('') : hex[1];
    [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  } else if (fn) {
    [r, g, b] = fn[1].split(',').map(x => parseFloat(x));
  }
  return [r, g, b].map(x => (Math.max(0, Math.min(255, x)) / 255).toFixed(3)).join(' ');
};

// ---- drawing: a page's content stream, in top-left coordinates ---------------------------------
const n = (x) => (Math.round(x * 100) / 100).toString();

class Page {
  constructor() { this.ops = []; }
  rect(x, y, w, h, fill, stroke, lineW = 0.6) {
    const yy = PAGE_H - y - h;
    if (fill) this.ops.push(`${rgb(fill)} rg`);
    if (stroke) this.ops.push(`${rgb(stroke)} RG ${n(lineW)} w`);
    this.ops.push(`${n(x)} ${n(yy)} ${n(w)} ${n(h)} re ${fill && stroke ? 'B' : fill ? 'f' : 'S'}`);
  }
  // Rectangle with rounded top corners (bar tops), r ≤ half the width.
  bar(x, y, w, h, fill, r = 2) {
    const rr = Math.max(0, Math.min(r, w / 2, h));
    if (rr < 0.5) { this.rect(x, y, w, h, fill); return; }
    const k = 0.5523 * rr;
    const b = PAGE_H - y - h; // bottom
    const t = PAGE_H - y; // top
    this.ops.push(`${rgb(fill)} rg`,
      `${n(x)} ${n(b)} m ${n(x)} ${n(t - rr)} l`,
      `${n(x)} ${n(t - rr + k)} ${n(x + rr - k)} ${n(t)} ${n(x + rr)} ${n(t)} c`,
      `${n(x + w - rr)} ${n(t)} l`,
      `${n(x + w - rr + k)} ${n(t)} ${n(x + w)} ${n(t - rr + k)} ${n(x + w)} ${n(t - rr)} c`,
      `${n(x + w)} ${n(b)} l h f`);
  }
  line(x1, y1, x2, y2, color, w = 0.6, dash) {
    this.ops.push(`${rgb(color)} RG ${n(w)} w ${dash ? `[${dash.join(' ')}] 0 d` : '[] 0 d'}`,
      `${n(x1)} ${n(PAGE_H - y1)} m ${n(x2)} ${n(PAGE_H - y2)} l S`, '[] 0 d');
  }
  // y is the text baseline, measured from the top of the page.
  text(x, y, s, { size = 9, bold = false, color = INK, align = 'left', spacing = 0 } = {}) {
    const str = toAnsi(s);
    if (!str) return;
    let w = textWidth(s, size, bold) + spacing * Math.max(0, str.length - 1);
    const xx = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
    this.ops.push('BT', `/${bold ? 'F2' : 'F1'} ${n(size)} Tf`, `${rgb(color)} rg`,
      spacing ? `${n(spacing)} Tc` : '0 Tc', `${n(xx)} ${n(PAGE_H - y)} Td`, `(${escapePdf(str)}) Tj`, 'ET');
    return w;
  }
  image(name, x, y, w, h) {
    this.ops.push('q', `${n(w)} 0 0 ${n(h)} ${n(x)} ${n(PAGE_H - y - h)} cm`, `/${name} Do`, 'Q');
  }
  toString() { return this.ops.join('\n'); }
}

// ---- the logo, as JPEG bytes on white (PDF base readers take JPEG directly) ---------------------
let logoPromise = null;
const loadLogo = () => {
  if (!logoPromise) {
    logoPromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const w = 1200;
        const h = Math.round((img.naturalHeight / img.naturalWidth) * w);
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const b64 = cv.toDataURL('image/jpeg', 0.92).split(',')[1];
        resolve({ bytes: atob(b64), w, h });
      };
      img.onerror = () => resolve(null);
      img.src = logoUrl;
    });
  }
  return logoPromise;
};

// ---- page furniture ---------------------------------------------------------------------------
const LOGO_H = 36;

// Letterhead on the first page; returns the y where content may start.
const drawLetterhead = (pg, logo, { section, title, scope, notes }) => {
  pg.rect(0, 0, PAGE_W, 5, NAVY);
  pg.rect(0, 5, 90, 2, COPPER);

  let y = 30;
  if (logo) {
    // Sized by height so the logo always clears the rule below it.
    pg.image('Logo', M, y - 6, (logo.w / logo.h) * LOGO_H, LOGO_H);
  } else {
    pg.text(M, y + 18, 'KONGUNADU ROAD LINES', { size: 15, bold: true, color: NAVY });
  }
  pg.text(PAGE_W - M, y + 9, 'SAFE MOVES', { size: 7.5, bold: true, color: NAVY, align: 'right', spacing: 1.6 });
  pg.text(PAGE_W - M, y + 20, 'STRONGER TOMORROWS', { size: 7.5, bold: true, color: NAVY, align: 'right', spacing: 1.6 });

  y = 72;
  pg.line(M, y, PAGE_W - M, y, NAVY, 1.2);
  pg.line(M, y, M + 46, y, COPPER, 2.4);

  y += 26;
  if (section) pg.text(M, y, String(section).toUpperCase(), { size: 8, bold: true, color: BRAND, spacing: 1.1 });
  y += 22;
  pg.text(M, y, fit(title, 20, true, CONTENT_W), { size: 20, bold: true, color: INK });
  if (scope) { y += 17; pg.text(M, y, fit(scope, 9.5, false, CONTENT_W), { size: 9.5, color: MUTED }); }
  (notes || []).filter(Boolean).forEach(line => { y += 13; pg.text(M, y, fit(line, 8.5, false, CONTENT_W), { size: 8.5, color: MUTED }); });
  return y + 20;
};

// Slim header on continuation pages.
const drawRunningHead = (pg, { section, title }) => {
  pg.rect(0, 0, PAGE_W, 5, NAVY);
  pg.rect(0, 5, 90, 2, COPPER);
  pg.text(M, 32, 'KONGUNADU ROAD LINES', { size: 8.5, bold: true, color: NAVY, spacing: 0.8 });
  pg.text(PAGE_W - M, 32, fit(`${section ? `${section} · ` : ''}${title}`, 8.5, false, CONTENT_W - 160), { size: 8.5, color: MUTED, align: 'right' });
  pg.line(M, 42, PAGE_W - M, 42, RULE, 0.8);
  return 64;
};

const drawFooter = (pg, index, count, stamp) => {
  pg.line(M, FOOTER_Y - 12, PAGE_W - M, FOOTER_Y - 12, RULE, 0.8);
  pg.text(M, FOOTER_Y, 'Kongunadu Road Lines · Transport Management System', { size: 7.5, color: MUTED });
  pg.text(PAGE_W - M, FOOTER_Y, `Generated ${stamp} · Page ${index} of ${count}`, { size: 7.5, color: MUTED, align: 'right' });
};

// ---- charts -----------------------------------------------------------------------------------
const compact = (v) => {
  const a = Math.abs(v);
  if (a >= 1e7) return `${Math.round(v / 1e6) / 10}Cr`.replace('.0', '');
  if (a >= 1000) return `${Math.round((v / 1000) * 10) / 10}k`;
  return String(Math.round(v * 10) / 10);
};

// Rounds the axis top to 1 / 2 / 2.5 / 5 × 10ⁿ, as on screen.
const niceTop = (v, integer) => {
  if (!v || v <= 0) return integer ? 2 : 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const f = v / p;
  const top = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  return integer ? Math.max(2, Math.ceil(top / 2) * 2) : top;
};

// Wrapping legend; returns its height.
const drawLegend = (pg, x, y, width, series) => {
  let cx = x, cy = y;
  series.forEach(s => {
    const label = fit(s.label, 8, false, 150);
    const w = 12 + textWidth(label, 8, false) + 14;
    if (cx + w > x + width && cx > x) { cx = x; cy += 14; }
    pg.bar(cx, cy - 7, 8, 8, s.color, 1.5);
    pg.text(cx + 12, cy, label, { size: 8, color: MUTED });
    cx += w;
  });
  return cy - y + 14;
};

const EMPTY_NOTE = 'Nothing recorded in this range.';

// Grouped vertical bars; returns the y below the panel.
const drawBars = (pg, top, { categories, series, integer }, panelH = 290) => {
  const x0 = M, w = CONTENT_W;
  pg.rect(x0, top, w, panelH, '#ffffff', RULE, 0.8);

  const max = Math.max(0, ...series.flatMap(s => s.values.map(v => v || 0)));
  let y = top + 20;
  if (series.length > 1) y += drawLegend(pg, x0 + 14, y, w - 28, series);
  if (!max) {
    pg.text(x0 + w / 2, top + panelH / 2, EMPTY_NOTE, { size: 10, color: MUTED, align: 'center' });
    return top + panelH;
  }

  const axisW = 36;
  const plotL = x0 + 14 + axisW, plotR = x0 + w - 14;
  const plotT = y + 6, plotB = top + panelH - 30;
  const plotH = plotB - plotT, plotW = plotR - plotL;
  const yTop = niceTop(max, integer);
  const steps = integer && yTop % 4 ? 2 : 4;

  for (let i = 0; i <= steps; i++) {
    const v = (yTop / steps) * i;
    const gy = plotB - (v / yTop) * plotH;
    pg.line(plotL, gy, plotR, gy, i === 0 ? '#b9c3d0' : GRID, i === 0 ? 0.9 : 0.6, i === 0 ? null : [2, 2]);
    pg.text(plotL - 6, gy + 2.5, compact(v), { size: 7, color: MUTED, align: 'right' });
  }

  const nCat = categories.length, nSer = series.length;
  const groupW = plotW / Math.max(1, nCat);
  const gap = nSer > 1 ? 1.5 : 0;
  const barW = Math.max(1.5, Math.min(nSer > 1 ? 16 : 34, (groupW * 0.74 - gap * (nSer - 1)) / nSer));
  const clusterW = barW * nSer + gap * (nSer - 1);
  const showValues = barW >= 9 && nCat * nSer <= 60;
  const labelEvery = Math.max(1, Math.ceil(nCat / 12));

  categories.forEach((c, ci) => {
    const gx = plotL + groupW * ci + (groupW - clusterW) / 2;
    series.forEach((s, si) => {
      const v = s.values[ci];
      if (!v || v <= 0) return;
      const h = Math.max(0.8, (v / yTop) * plotH);
      const bx = gx + si * (barW + gap);
      pg.bar(bx, plotB - h, barW, h, s.color, 2);
      // Value over the bar only where it fits the bar's width, so neighbours never collide.
      if (showValues && textWidth(compact(v), 6.3, false) <= barW + gap + 1) {
        pg.text(bx + barW / 2, plotB - h - 3, compact(v), { size: 6.3, color: INK, align: 'center' });
      }
    });
    if (ci % labelEvery === 0) {
      pg.text(plotL + groupW * ci + groupW / 2, plotB + 13, fit(c.label, 7.3, false, groupW * labelEvery - 4), { size: 7.3, color: MUTED, align: 'center' });
    }
  });
  return top + panelH;
};

// Ranked horizontal bars (largest first); returns the y below the panel.
const RANK_MAX = 16;
const drawRank = (pg, top, { items }, format) => {
  const sorted = [...items].sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity)).slice(0, RANK_MAX);
  const rowH = 17;
  const panelH = Math.max(110, 32 + sorted.length * rowH);
  const x0 = M, w = CONTENT_W;
  pg.rect(x0, top, w, panelH, '#ffffff', RULE, 0.8);
  const max = Math.max(0, ...sorted.map(x => x.value || 0));
  if (!max) {
    pg.text(x0 + w / 2, top + panelH / 2, EMPTY_NOTE, { size: 10, color: MUTED, align: 'center' });
    return top + panelH;
  }
  const labelW = 150, valueW = 70;
  const barL = x0 + 14 + labelW, barMaxW = w - 28 - labelW - valueW;
  sorted.forEach((it, i) => {
    const cy = top + 20 + i * rowH;
    pg.text(x0 + 14, cy + 8, fit(it.label, 8.5, false, labelW - 10), { size: 8.5, color: INK });
    pg.rect(barL, cy, barMaxW, 10, BAND);
    const bw = it.value ? Math.max(1, (it.value / max) * barMaxW) : 0;
    if (bw) pg.rect(barL, cy, bw, 10, it.color);
    pg.text(x0 + w - 14, cy + 8, format(it.value), { size: 8.5, bold: true, color: INK, align: 'right' });
  });
  return top + panelH;
};

// ---- the figures table (paginates) ------------------------------------------------------------
const ROW_H = 17;
const HEAD_LINE = 10;

// Splits a heading into at most two lines that fit the width (the second ends in … if cut).
const wrap2 = (s, size, max) => {
  const words = String(s ?? '').split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  words.forEach(w => {
    const next = cur ? `${cur} ${w}` : w;
    if (textWidth(next, size, true) <= max || !cur) cur = next;
    else { lines.push(cur); cur = w; }
  });
  if (cur) lines.push(cur);
  if (lines.length <= 2) return lines.map(l => fit(l, size, true, max));
  return [fit(lines[0], size, true, max), fit(lines.slice(1).join(' '), size, true, max)];
};

const tableOf = (spec) => {
  const { chart, format, totals } = spec;
  if (chart.type === 'rank') {
    const sorted = [...chart.items].sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
    return {
      columns: [{ label: '#', w: 30 }, { label: 'Name', w: CONTENT_W - 30 - 120 }, { label: 'Value', w: 120, right: true }],
      rows: sorted.map((it, i) => [String(i + 1), it.label, format(it.value)]),
    };
  }
  const first = 120;
  const each = (CONTENT_W - first) / Math.max(1, chart.series.length);
  const rows = chart.categories.map((c, ci) => [c.label, ...chart.series.map(s => format(s.values[ci]))]);
  if (totals) rows.push(['Total', ...chart.series.map((s, si) => format(totals[si]))]);
  return {
    columns: [{ label: 'Period', w: first }, ...chart.series.map(s => ({ label: s.label, w: each, right: true, color: s.color }))],
    rows,
    totalRow: !!totals,
  };
};

// ---- assembling the file ----------------------------------------------------------------------
const buildPdfFile = (pages, logo) => {
  // Objects: 1 catalog, 2 pages, 3 F1, 4 F2, 5 logo (optional), then a page + content pair per page.
  const objs = [];
  const add = (body) => { objs.push(body); return objs.length; };
  add('<< /Type /Catalog /Pages 2 0 R >>');
  add(null); // pages tree, filled in below
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const logoId = logo
    ? add(`<< /Type /XObject /Subtype /Image /Width ${logo.w} /Height ${logo.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.bytes.length} >>\nstream\n${logo.bytes}\nendstream`)
    : null;
  const resources = `<< /Font << /F1 3 0 R /F2 4 0 R >>${logoId ? ` /XObject << /Logo ${logoId} 0 R >>` : ''} >>`;
  const kids = pages.map(pg => {
    const content = pg.toString();
    const cId = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    return add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources ${resources} /Contents ${cId} 0 R >>`);
  });
  objs[1] = `<< /Type /Pages /Kids [${kids.map(k => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`;

  let out = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  const offsets = [];
  objs.forEach((body, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach(o => { out += `${String(o).padStart(10, '0')} 00000 n \n`; });
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: 'application/pdf' });
};

export const buildChartPdf = async (spec) => {
  const logo = await loadLogo();
  const pages = [];
  let pg = new Page();
  pages.push(pg);

  let y = drawLetterhead(pg, logo, spec);
  y = spec.chart.type === 'rank' ? drawRank(pg, y, spec.chart, spec.format) : drawBars(pg, y, spec.chart);

  // Figures table under the chart, header repeated on every page it runs onto.
  const table = tableOf(spec);
  const bottom = FOOTER_Y - 24;
  y += 26;
  pg.text(M, y, 'Figures', { size: 10.5, bold: true, color: INK });
  y += 10;
  // Headings wrap onto a second line rather than being cut short.
  const pad = 8;
  const headLines = table.columns.map(c => wrap2(c.label, 8, c.w - pad * 2 - (c.color ? 10 : 0)));
  const headH = 10 + HEAD_LINE * Math.max(...headLines.map(l => l.length));
  const head = () => {
    pg.rect(M, y, CONTENT_W, headH, NAVY);
    let cx = M;
    table.columns.forEach((c, ci) => {
      headLines[ci].forEach((line, li) => {
        const by = y + 13.5 + li * HEAD_LINE;
        if (c.right) {
          pg.text(cx + c.w - pad, by, line, { size: 8, bold: true, color: '#ffffff', align: 'right' });
          if (c.color && li === 0) pg.bar(cx + c.w - pad - textWidth(line, 8, true) - 10, by - 7, 7, 7, c.color, 1.5);
        } else {
          pg.text(cx + pad, by, line, { size: 8, bold: true, color: '#ffffff' });
        }
      });
      cx += c.w;
    });
    y += headH;
  };
  head();
  table.rows.forEach((row, ri) => {
    if (y + ROW_H > bottom) {
      pg = new Page();
      pages.push(pg);
      y = drawRunningHead(pg, spec);
      head();
    }
    const isTotal = table.totalRow && ri === table.rows.length - 1;
    if (isTotal) pg.rect(M, y, CONTENT_W, ROW_H, '#e8effa');
    else if (ri % 2) pg.rect(M, y, CONTENT_W, ROW_H, BAND);
    let cx = M;
    row.forEach((cell, ci) => {
      const c = table.columns[ci];
      const bold = isTotal || ci === 0;
      const t = fit(cell, 8.3, bold, c.w - pad * 2);
      pg.text(c.right ? cx + c.w - pad : cx + pad, y + 11.8, t, { size: 8.3, bold, color: INK, align: c.right ? 'right' : 'left' });
      cx += c.w;
    });
    pg.line(M, y + ROW_H, M + CONTENT_W, y + ROW_H, RULE, 0.5);
    y += ROW_H;
  });

  const now = new Date();
  const stamp = `${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  pages.forEach((p, i) => drawFooter(p, i + 1, pages.length, stamp));

  return buildPdfFile(pages, logo);
};

const safeName = (s) => String(s || 'Chart').replace(/%/g, ' pct').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, '_').replace(/_+/g, '_').slice(0, 80);

export const downloadChartPdf = async (spec) => {
  const blob = await buildChartPdf(spec);
  const name = spec.fileName || `${safeName([spec.section, spec.title].filter(Boolean).join(' '))}_${fileDate()}.pdf`;
  saveBlob(blob, name.toLowerCase().endsWith('.pdf') ? name : `${name}.pdf`);
  return name;
};

export default downloadChartPdf;
