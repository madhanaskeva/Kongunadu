/**
 * Common Reusable Export Utilities for Kongunadu TMS
 * Supports:
 * - Excel (.xlsx / .csv compatible tabular download)
 * - PDF / Printable document generation with company header & styling
 */

/**
 * Export tabular data to an Excel-compatible CSV file.
 * @param {Object} options
 * @param {Array<Object>} options.data - Array of row objects
 * @param {Array<string>} options.headers - Array of column headers
 * @param {Array<string>|Function} options.keys - Keys in data object or value getter function
 * @param {string} options.filename - Name of exported file (without extension)
 * @param {string} [options.title] - Optional title for metadata
 */
export const exportToExcel = ({
  data = [],
  headers = [],
  keys = [],
  filename = 'export',
  title = '',
}) => {
  if (!data || !data.length) {
    return { success: false, message: 'No data available to export' };
  }

  // Format headers
  const headerRow = headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',');

  // Format data rows
  const dataRows = data.map(row => {
    return (keys || []).map(key => {
      let val = '';
      if (typeof key === 'function') {
        val = key(row);
      } else if (typeof key === 'string') {
        val = row[key];
      }
      if (val == null) val = '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  // Construct CSV content with UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const csvContent = BOM + [headerRow, ...dataRows].join('\r\n');

  // Create downloadable blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, count: data.length, filename: `${filename}.csv` };
};

/**
 * Export data to a printable PDF document with Kongunadu TMS branding.
 * @param {Object} options
 * @param {string} options.title - Document title
 * @param {string} [options.subtitle] - Document subtitle or filters summary
 * @param {Array<string>} options.headers - Table column headers
 * @param {Array<string>|Function} options.keys - Data row keys or getter functions
 * @param {Array<Object>} options.data - Rows to print
 * @param {string} [options.timestamp] - Current timestamp or date
 */
export const exportToPDF = ({
  title = 'Report',
  subtitle = '',
  headers = [],
  keys = [],
  data = [],
  timestamp = new Date().toLocaleString('en-IN'),
}) => {
  if (!data || !data.length) {
    return { success: false, message: 'No data available to export' };
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return { success: false, message: 'Pop-up blocked. Allow pop-ups to export PDF.' };
  }

  const rowsHtml = data.map((row, idx) => {
    const cells = keys.map(key => {
      let val = '';
      if (typeof key === 'function') {
        val = key(row);
      } else if (typeof key === 'string') {
        val = row[key];
      }
      return `<td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; color: #1e293b;">${val ?? '—'}</td>`;
    }).join('');
    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    return `<tr style="background-color: ${bg};">${cells}</tr>`;
  }).join('');

  const headersHtml = headers.map(h => 
    `<th style="padding: 10px 12px; background: #00623f; color: #ffffff; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; font-weight: 700;">${h}</th>`
  ).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 20px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #00623f; margin-bottom: 16px; }
          .brand { font-size: 20px; font-weight: 800; color: #00623f; letter-spacing: -0.02em; }
          .sub { font-size: 12px; color: #64748b; margin-top: 4px; }
          .meta { text-align: right; font-size: 11px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">KONGUNADU ROAD LINES</div>
            <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 6px;">${title}</div>
            ${subtitle ? `<div class="sub">${subtitle}</div>` : ''}
          </div>
          <div class="meta">
            <div>Generated: ${timestamp}</div>
            <div>Records: ${data.length}</div>
          </div>
        </div>
        <table>
          <thead><tr>${headersHtml}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="footer">
          Kongunadu Road Lines · Transport Management System · Confidential Document
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  return { success: true };
};
