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
    colorPrimary: '#275e74',          // --kr-green-700 / --color-brand
    colorPrimaryHover: '#1c4b5f',     // --kr-green-800
    colorPrimaryActive: '#133a4a',    // --kr-green-900
    colorPrimaryBg: '#f0f6f8',        // --kr-green-50 / --color-brand-tint
    colorPrimaryBgHover: '#dbe9ef',   // --kr-green-100 / --color-brand-soft
    colorPrimaryBorder: '#3a768d',    // --kr-green-600
    colorPrimaryText: '#275e74',      // --text-brand

    colorError: '#d91619',            // --kr-red-600 / --color-accent
    colorErrorHover: '#b31114',       // --kr-red-700
    colorErrorBg: '#fbe0e0',          // --kr-red-100
    colorErrorBorder: '#d91619',

    colorWarning: '#f29a1f',          // --kr-saffron-500
    colorWarningBg: '#fdebd3',        // --kr-saffron-100

    colorSuccess: '#3a768d',          // --status-success
    // Explicit tints: antd's derived ones from #3a768d come out grey-green and
    // make "Active" / "Approved" tags look disabled.
    colorSuccessBg: '#dff5e9',
    colorSuccessBgHover: '#c8ecd9',
    colorSuccessBorder: '#86d1ab',
    colorSuccessBorderHover: '#5fbf8f',
    colorSuccessText: '#275e74',

    colorLink: '#275e74',             // --link
    colorLinkHover: '#1c4b5f',        // --link-hover
    colorLinkActive: '#133a4a',

    /* ── Neutral / surface ── */
    colorTextBase: '#4a4a46',         // --text-body / --kr-grey-700
    colorText: '#4a4a46',
    colorTextSecondary: '#4f514b',    // --text-muted (darkened for contrast)
    // Typography type="secondary", hints, table S.No and helper lines use these; antd's defaults are 45% / 25% grey.
    colorTextTertiary: '#55574f',
    colorTextDescription: '#55574f',
    colorTextQuaternary: '#7c7c76',
    colorTextDisabled: '#7c7c76',
    colorTextPlaceholder: '#5f615b',  // readable placeholders (antd default is 25% grey)
    colorTextHeading: '#1c1c1a',      // --text-heading / --kr-grey-900
    colorBgBase: '#ffffff',
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f3f7f8',         // --surface-muted (light-blue page)
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
      // Every primary / brand button in the logo's deep teal (the sidebar colour),
      // lifting to a brighter teal on hover.
      colorPrimary: '#214f63',
      colorPrimaryHover: '#2e6a82',
      colorPrimaryActive: '#173d4d',
      colorPrimaryBorder: '#214f63',
      primaryShadow: '0 2px 6px rgba(33, 79, 99, 0.25)',
    },
    Input: {
      controlHeight: 42,
      borderRadius: 8,
      colorBorder: '#c2c2bb',         // --border-strong
      colorBgContainer: '#ffffff',
      activeBorderColor: '#275e74',   // --color-brand
      activeShadow: '0 0 0 3px rgba(39, 94, 116, 0.35)', // --focus-ring
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
      hoverBorderColor: '#275e74',    // --color-brand
      activeBorderColor: '#275e74',
      activeOutlineColor: 'rgba(39, 94, 116, 0.35)', // --focus-ring
      controlOutlineWidth: 3,
      colorTextPlaceholder: '#5f615b',
      colorText: '#1c1c1a',           // --text-heading
      optionHeight: 40,
      optionPadding: '9px 12px',
      optionFontSize: 14,
      optionActiveBg: '#f0f6f8',      // --color-brand-tint (hover / keyboard)
      optionSelectedBg: '#f0f6f8',    // --color-brand-tint
      optionSelectedColor: '#133a4a', // --kr-green-900
      optionSelectedFontWeight: 700,
      controlItemBgActiveHover: '#dbe9ef', // --kr-green-100 (selected + hover)
      boxShadowSecondary: '0 12px 32px rgba(20, 32, 43, 0.14)', // --shadow-lg
    },
    Table: {
      borderRadius: 14,
      headerBg: '#f6f6f4',            // --surface-muted
      headerColor: '#4f514b',         // --text-muted
      headerSplitColor: '#dcdcd6',
      rowHoverBg: '#f0f6f8',          // --color-brand-tint (light green)
      cellPaddingBlock: 14,
      cellPaddingInline: 16,
      headerCellSplitColor: '#dcdcd6',
      fontSize: 14,
      // Body text a step darker than the page's body grey so table rows read clearly.
      colorText: '#262824',
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
      inkBarColor: '#275e74',
      itemActiveColor: '#275e74',
      itemSelectedColor: '#275e74',
      itemHoverColor: '#1c4b5f',
      itemColor: '#4f514b',           // --text-muted
      titleFontSize: 14,
      horizontalMargin: '0',
    },
    /* Admin shell: white 72px top bar, page canvas #f3f6f5, sidebar paints
       its own brand gradient (.tms-sidebar in adminLayout.css). */
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 72,
      headerPadding: 0,
      bodyBg: '#f3f7f8',
      siderBg: 'transparent',
    },
    /* Sidebar menu sits on the green gradient, so it uses the dark variant. */
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemColor: 'rgba(255, 255, 255, 0.92)',
      darkItemHoverColor: '#ffffff',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.10)',
      darkItemSelectedBg: '#b8733a',  // Copper pill on the teal sidebar (the logo's road stripe)
      darkItemSelectedColor: '#ffffff',
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
      itemActiveBg: '#275e74',        // filled green current page
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
      colorPrimary: '#275e74',
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

