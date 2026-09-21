import React from 'react';
import { ConfigProvider } from 'antd';

/**
 * AntdProvider — wraps the app with antd's ConfigProvider.
 *
 * ALL token values are mapped from the existing TMS design tokens
 * (variables.css) so that antd components inherit the brand's exact
 * colours, radii, fonts, and sizing without any visual difference.
 */
const TMS_THEME = {
  token: {
    /* ── Brand colours ── */
    colorPrimary: '#00623f',          // --kr-green-700 / --color-brand
    colorPrimaryHover: '#004a31',     // --kr-green-800
    colorPrimaryActive: '#003021',    // --kr-green-900
    colorPrimaryBg: '#edf8f3',        // --kr-green-50 / --color-brand-tint
    colorPrimaryBgHover: '#daf1e7',   // --kr-green-100 / --color-brand-soft
    colorPrimaryBorder: '#0b7e52',    // --kr-green-600
    colorPrimaryText: '#00623f',      // --text-brand

    colorError: '#d91619',            // --kr-red-600 / --color-accent
    colorErrorHover: '#b31114',       // --kr-red-700
    colorErrorBg: '#fbe0e0',          // --kr-red-100
    colorErrorBorder: '#d91619',

    colorWarning: '#f29a1f',          // --kr-saffron-500
    colorWarningBg: '#fdebd3',        // --kr-saffron-100

    colorSuccess: '#0b7e52',          // --status-success

    /* ── Neutral / surface ── */
    colorTextBase: '#4a4a46',         // --text-body / --kr-grey-700
    colorText: '#4a4a46',
    colorTextSecondary: '#7c7c76',    // --text-muted / --kr-grey-500
    colorTextDisabled: '#7c7c76',
    colorTextHeading: '#1c1c1a',      // --text-heading / --kr-grey-900
    colorBgBase: '#ffffff',
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f6f6f4',         // --surface-muted / --kr-grey-50
    colorBorder: '#dcdcd6',           // --border-default / --kr-grey-200
    colorBorderSecondary: '#c2c2bb',  // --border-strong / --kr-grey-300

    /* ── Typography ── */
    fontFamily:
      '"Source Sans 3", "Source Sans Pro", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontFamilyCode:
      'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,
    fontWeightStrong: 700,
    lineHeight: 1.5,

    /* ── Border radius ── */
    borderRadius: 8,                  // --radius-md
    borderRadiusSM: 4,                // --radius-sm
    borderRadiusLG: 12,               // --radius-lg
    borderRadiusXS: 4,

    /* ── Shadows ── */
    boxShadow: '0 4px 12px rgba(20, 32, 43, 0.1)',    // --shadow-md
    boxShadowSecondary: '0 1px 2px rgba(20, 32, 43, 0.08)', // --shadow-sm

    /* ── Motion ── */
    motionDurationFast: '0.15s',      // --dur-fast
    motionDurationMid: '0.25s',       // --dur-base
    motionDurationSlow: '0.35s',

    /* ── Control sizing ── */
    controlHeight: 42,                // default input/select height
    controlHeightSM: 32,
    controlHeightLG: 48,

    /* ── Padding ── */
    padding: 16,
    paddingSM: 12,
    paddingLG: 24,
    paddingXS: 8,
  },
  components: {
    Button: {
      fontWeight: 700,
      borderRadius: 8,
      controlHeight: 40,
      controlHeightSM: 32,
      controlHeightLG: 48,
      fontFamily:
        '"Archivo", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingInline: 16,
      paddingInlineSM: 10,
      paddingInlineLG: 24,
    },
    Input: {
      controlHeight: 42,
      borderRadius: 8,
      colorBorder: '#c2c2bb',         // --border-strong
      colorBgContainer: '#ffffff',
      activeBorderColor: '#00623f',   // --color-brand
      activeShadow: '0 0 0 3px rgba(0, 98, 63, 0.35)', // --focus-ring
    },
    Select: {
      controlHeight: 42,
      borderRadius: 8,
      colorBorder: '#c2c2bb',
      colorBgContainer: '#ffffff',
      activeBorderColor: '#00623f',
      activeShadow: '0 0 0 3px rgba(0, 98, 63, 0.35)',
      optionSelectedBg: '#edf8f3',
      optionActiveBg: '#f6f6f4',
    },
    Table: {
      borderRadius: 14,
      headerBg: '#f6f6f4',            // --surface-muted
      headerColor: '#7c7c76',         // --text-muted
      headerSplitColor: '#dcdcd6',
      rowHoverBg: '#f6f6f4',
      cellPaddingBlock: 14,
      cellPaddingInline: 16,
      headerCellSplitColor: '#dcdcd6',
      fontSize: 14,
    },
    Modal: {
      borderRadius: 12,
      borderRadiusLG: 12,
      contentBg: '#ffffff',
      headerBg: '#ffffff',
      titleFontSize: 18,
      titleLineHeight: 1.3,
    },
    Drawer: {
      borderRadius: 0,
    },
    Tag: {
      borderRadius: 4,                // --radius-sm
      fontSizeSM: 12,
    },
    Tabs: {
      inkBarColor: '#00623f',
      itemActiveColor: '#00623f',
      itemSelectedColor: '#00623f',
      itemHoverColor: '#004a31',
    },
    Spin: {
      colorPrimary: '#00623f',
    },
    Notification: {
      borderRadius: 8,
      width: 380,
    },
    Message: {
      borderRadius: 8,
    },
    Tooltip: {
      borderRadius: 6,
    },
  },
};

export const AntdProvider = ({ children }) => {
  return (
    <ConfigProvider theme={TMS_THEME}>
      {children}
    </ConfigProvider>
  );
};

export default AntdProvider;

