import React from 'react';
import { App as AntApp, ConfigProvider } from 'antd';

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
    // Explicit tints: antd's derived ones from #0b7e52 come out grey-green and
    // make "Active" / "Approved" tags look disabled.
    colorSuccessBg: '#dff5e9',
    colorSuccessBgHover: '#c8ecd9',
    colorSuccessBorder: '#86d1ab',
    colorSuccessBorderHover: '#5fbf8f',
    colorSuccessText: '#00623f',

    colorLink: '#00623f',             // --link
    colorLinkHover: '#004a31',        // --link-hover
    colorLinkActive: '#003021',

    /* ── Neutral / surface ── */
    colorTextBase: '#4a4a46',         // --text-body / --kr-grey-700
    colorText: '#4a4a46',
    colorTextSecondary: '#62645e',    // --text-muted (darkened for contrast)
    colorTextDisabled: '#7c7c76',
    colorTextPlaceholder: '#6f716b',  // readable placeholders (antd default is 25% grey)
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
    /* One dropdown spec for the whole portal (see .ant-select-dropdown in
       global.css for the panel border/shadow and the selected-row check mark):
       trigger 42px like Input, 1px --border-strong, brand border + focus ring;
       rows 40px, brand-tint hover, selected row brand tint + bold green text. */
    Select: {
      controlHeight: 42,
      borderRadius: 8,
      borderRadiusSM: 6,              // option rows
      borderRadiusLG: 12,             // open panel
      colorBorder: '#c2c2bb',         // --border-strong
      colorBgContainer: '#ffffff',
      hoverBorderColor: '#00623f',    // --color-brand
      activeBorderColor: '#00623f',
      activeOutlineColor: 'rgba(0, 98, 63, 0.35)', // --focus-ring
      controlOutlineWidth: 3,
      colorTextPlaceholder: '#6f716b',
      colorText: '#1c1c1a',           // --text-heading
      optionHeight: 40,
      optionPadding: '9px 12px',
      optionFontSize: 14,
      optionActiveBg: '#edf8f3',      // --color-brand-tint (hover / keyboard)
      optionSelectedBg: '#edf8f3',    // --color-brand-tint
      optionSelectedColor: '#003021', // --kr-green-900
      optionSelectedFontWeight: 700,
      controlItemBgActiveHover: '#daf1e7', // --kr-green-100 (selected + hover)
      boxShadowSecondary: '0 12px 32px rgba(20, 32, 43, 0.14)', // --shadow-lg
    },
    Table: {
      borderRadius: 14,
      headerBg: '#f6f6f4',            // --surface-muted
      headerColor: '#7c7c76',         // --text-muted
      headerSplitColor: '#dcdcd6',
      rowHoverBg: '#edf8f3',          // --color-brand-tint (light green)
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
      itemColor: '#7c7c76',           // --text-muted
      titleFontSize: 14,
      horizontalMargin: '0',
    },
    /* Admin shell: white 72px top bar, page canvas #f3f6f5, sidebar paints
       its own brand gradient (.tms-sidebar in adminLayout.css). */
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 72,
      headerPadding: 0,
      bodyBg: '#f3f6f5',
      siderBg: 'transparent',
    },
    /* Sidebar menu sits on the green gradient, so it uses the dark variant. */
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemColor: 'rgba(255, 255, 255, 0.92)',
      darkItemHoverColor: '#ffffff',
      darkItemHoverBg: 'rgba(218, 241, 231, 0.16)',
      darkItemSelectedBg: '#daf1e7',  // --kr-green-100
      darkItemSelectedColor: '#004a31', // --kr-green-800
      darkGroupTitleColor: 'rgba(255, 255, 255, 0.62)',
      itemBorderRadius: 10,
      itemHeight: 38,
      itemMarginBlock: 2,
      itemMarginInline: 0,
      itemPaddingInline: 14,
      iconSize: 19,
      iconMarginInlineEnd: 12,
      groupTitleFontSize: 10.5,
    },
    Pagination: {
      itemSize: 36,
      itemActiveBg: '#00623f',        // filled green current page
      itemActiveColor: '#ffffff',
      itemActiveColorHover: '#ffffff',
    },
    Card: {
      headerFontSize: 16,
      bodyPadding: 18,
      headerPadding: 18,
    },
    Statistic: {
      titleFontSize: 13,
      contentFontSize: 26,
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
      {/* antd <App> gives message / notification / modal hooks the theme above */}
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
};

export default AntdProvider;

