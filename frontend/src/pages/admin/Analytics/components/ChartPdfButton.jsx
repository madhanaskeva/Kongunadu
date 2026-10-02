import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { FileDown } from 'lucide-react';
import { useTMSAdmin } from '../../../../context/TMSAdminContext';
import { downloadChartPdf } from '../../../../utils/chartPdf';

// "Download PDF" for one chart card: an A4 page on the Kongunadu letterhead with the
// chart and its figures. getSpec() is read at click time, so it follows the view shown.
export const ChartPdfButton = ({ getSpec, label }) => {
  const { showToast } = useTMSAdmin();
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const name = await downloadChartPdf(getSpec());
      showToast('success', 'PDF downloaded', name);
    } catch (e) {
      showToast('warning', 'Download failed', (e && e.message) || 'Could not create the PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Tooltip title="Download as PDF (A4)">
      <Button
        size="small"
        shape="round"
        icon={<FileDown size={15} />}
        loading={busy}
        onClick={download}
        aria-label={`Download ${label} chart as PDF`}
      >
        PDF
      </Button>
    </Tooltip>
  );
};

export default ChartPdfButton;
