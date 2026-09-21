/* @ds-bundle: {"format":4,"namespace":"KongunaduRoadlinesDesignSystem_369b05","components":[{"name":"ServiceCard","sourcePath":"components/brand/ServiceCard.jsx"},{"name":"Wordmark","sourcePath":"components/brand/Wordmark.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/brand/ServiceCard.jsx":"c13179a37372","components/brand/Wordmark.jsx":"bc70b7033808","components/core/Badge.jsx":"55ab0e318194","components/core/Button.jsx":"36d39d5cd532","components/core/Card.jsx":"7dd38487532b","components/core/IconButton.jsx":"958207ea6065","components/core/Tag.jsx":"1ae5fbd4a31f","components/feedback/Dialog.jsx":"975e44c8ed40","components/feedback/Toast.jsx":"798eb004f6ed","components/feedback/Tooltip.jsx":"d6aae72c7aab","components/forms/Checkbox.jsx":"6b062e444c43","components/forms/Input.jsx":"e007b3170a0d","components/forms/Radio.jsx":"194d7651775a","components/forms/Select.jsx":"864630974c7e","components/forms/Switch.jsx":"0817dc7e33a2","components/navigation/Tabs.jsx":"1349e0522ef2","ui_kits/website/About.jsx":"550674f32f52","ui_kits/website/Footer.jsx":"549b1b98010a","ui_kits/website/Header.jsx":"c4f11302de06","ui_kits/website/Hero.jsx":"bae680e66d3a","ui_kits/website/Services.jsx":"b6844d6e9fa9","ui_kits/website/data.js":"93d4f80f1bb5"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.KongunaduRoadlinesDesignSystem_369b05 = window.KongunaduRoadlinesDesignSystem_369b05 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/ServiceCard.jsx
try { (() => {
function ServiceCard({
  image,
  title,
  tag,
  specs = [],
  description,
  onEnquire,
  onCall,
  style
}) {
  const [hov, setHov] = React.useState(false);
  return /*#__PURE__*/React.createElement("article", {
    onMouseEnter: () => setHov(true),
    onMouseLeave: () => setHov(false),
    style: {
      display: "flex",
      flexDirection: "column",
      background: "#fff",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      boxShadow: hov ? "var(--shadow-md)" : "none",
      transition: "box-shadow var(--dur-base) var(--ease-out)",
      fontFamily: "var(--font-body)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      aspectRatio: "4/3",
      background: "var(--surface-muted)"
    }
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: "",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block"
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "grid",
      placeItems: "center",
      color: "var(--text-muted)",
      fontSize: 13
    }
  }, "Fleet photo"), tag && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 12,
      left: 12,
      background: "var(--color-brand)",
      color: "#fff",
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 11,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      padding: "4px 8px",
      borderRadius: "var(--radius-sm)"
    }
  }, tag)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 18px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 18,
      lineHeight: 1.2,
      color: "var(--text-heading)",
      letterSpacing: "-0.01em"
    }
  }, title), specs.length > 0 && /*#__PURE__*/React.createElement("dl", {
    style: {
      margin: 0,
      display: "grid",
      gridTemplateColumns: "auto 1fr",
      gap: "2px 12px",
      fontSize: 13
    }
  }, specs.map(([k, v]) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: k
  }, /*#__PURE__*/React.createElement("dt", {
    style: {
      color: "var(--text-muted)",
      margin: 0
    }
  }, k), /*#__PURE__*/React.createElement("dd", {
    style: {
      margin: 0,
      color: "var(--text-heading)",
      fontWeight: 600
    }
  }, v)))), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      lineHeight: 1.5,
      color: "var(--text-body)"
    }
  }, description), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: "auto",
      paddingTop: 6
    }
  }, onEnquire && /*#__PURE__*/React.createElement("button", {
    onClick: onEnquire,
    style: {
      flex: 1,
      height: 38,
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 13,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      background: "var(--color-brand)",
      color: "#fff",
      border: 0,
      borderRadius: "var(--radius-md)",
      cursor: "pointer"
    }
  }, "Get best price"), onCall && /*#__PURE__*/React.createElement("button", {
    onClick: onCall,
    style: {
      height: 38,
      padding: "0 14px",
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 13,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      background: "transparent",
      color: "var(--color-accent)",
      border: "2px solid var(--color-accent)",
      borderRadius: "var(--radius-md)",
      cursor: "pointer"
    }
  }, "Call"))));
}
Object.assign(__ds_scope, { ServiceCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/ServiceCard.jsx", error: String((e && e.message) || e) }); }

// components/brand/Wordmark.jsx
try { (() => {
function Wordmark({
  height = 32,
  inverse,
  src,
  style
}) {
  const url = src || (inverse ? "assets/logo-inverse.png" : "assets/logo-1600.png");
  return /*#__PURE__*/React.createElement("img", {
    src: url,
    alt: "Kongunadu Road Lines",
    style: {
      height,
      width: "auto",
      display: "block",
      ...style
    }
  });
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
const T = {
  brand: ["var(--color-brand-soft)", "var(--kr-green-800)"],
  accent: ["var(--color-accent-soft)", "var(--kr-red-800)"],
  warning: ["var(--color-hazard-soft)", "#7A4300"],
  neutral: ["var(--kr-grey-100)", "var(--kr-grey-700)"],
  inverse: ["var(--surface-inverse)", "#fff"],
  solid: ["var(--color-brand)", "#fff"]
};
function Badge({
  tone = "brand",
  children,
  style
}) {
  const [bg, fg] = T[tone] || T.brand;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      height: 22,
      padding: "0 8px",
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 11,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      background: bg,
      color: fg,
      borderRadius: "var(--radius-sm)",
      whiteSpace: "nowrap",
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const S = {
  sm: {
    h: 32,
    px: 12,
    fs: 14
  },
  md: {
    h: 40,
    px: 18,
    fs: 15
  },
  lg: {
    h: 48,
    px: 24,
    fs: 16
  }
};
const V = {
  primary: {
    bg: "var(--color-brand)",
    fg: "var(--text-on-brand)",
    bd: "var(--color-brand)",
    hbg: "var(--color-brand-strong)"
  },
  accent: {
    bg: "var(--color-accent)",
    fg: "#fff",
    bd: "var(--color-accent)",
    hbg: "var(--color-accent-strong)"
  },
  secondary: {
    bg: "transparent",
    fg: "var(--color-brand)",
    bd: "var(--color-brand)",
    hbg: "var(--color-brand-tint)"
  },
  ghost: {
    bg: "transparent",
    fg: "var(--text-heading)",
    bd: "transparent",
    hbg: "var(--surface-muted)"
  },
  inverse: {
    bg: "#fff",
    fg: "var(--color-brand)",
    bd: "#fff",
    hbg: "var(--kr-grey-100)"
  }
};
function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  fullWidth,
  disabled,
  children,
  style,
  ...rest
}) {
  const [hov, setHov] = React.useState(false),
    [act, setAct] = React.useState(false);
  const s = S[size] || S.md,
    v = V[variant] || V.primary;
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled,
    onMouseEnter: () => setHov(true),
    onMouseLeave: () => {
      setHov(false);
      setAct(false);
    },
    onMouseDown: () => setAct(true),
    onMouseUp: () => setAct(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: s.h,
      padding: `0 ${s.px}px`,
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: s.fs,
      letterSpacing: "0.01em",
      textTransform: "uppercase",
      color: v.fg,
      background: hov && !disabled ? v.hbg : v.bg,
      border: `2px solid ${hov && !disabled && variant !== "secondary" ? v.hbg : v.bd}`,
      borderRadius: "var(--radius-md)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? .45 : 1,
      width: fullWidth ? "100%" : undefined,
      transform: act && !disabled ? "translateY(1px)" : "none",
      transition: "background var(--dur-fast) var(--ease-out),border-color var(--dur-fast)",
      whiteSpace: "nowrap",
      ...style
    }
  }, rest), icon, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function Card({
  variant = "outline",
  padding = 24,
  interactive,
  children,
  style,
  onClick
}) {
  const [hov, setHov] = React.useState(false);
  const v = {
    outline: {
      bg: "var(--surface-card)",
      bd: "1px solid var(--border-default)",
      sh: "none"
    },
    raised: {
      bg: "var(--surface-card)",
      bd: "1px solid var(--border-default)",
      sh: "var(--shadow-sm)"
    },
    muted: {
      bg: "var(--surface-muted)",
      bd: "1px solid transparent",
      sh: "none"
    },
    inverse: {
      bg: "var(--surface-inverse)",
      bd: "1px solid transparent",
      sh: "none"
    }
  }[variant];
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setHov(true),
    onMouseLeave: () => setHov(false),
    style: {
      background: v.bg,
      border: v.bd,
      boxShadow: interactive && hov ? "var(--shadow-md)" : v.sh,
      borderRadius: "var(--radius-lg)",
      padding,
      color: variant === "inverse" ? "var(--text-on-inverse)" : "inherit",
      borderTop: variant === "inverse" ? "4px solid var(--color-brand)" : v.bd,
      cursor: onClick ? "pointer" : undefined,
      transition: "box-shadow var(--dur-base) var(--ease-out),transform var(--dur-base)",
      transform: interactive && hov ? "translateY(-2px)" : "none",
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function IconButton({
  variant = "ghost",
  size = "md",
  label,
  children,
  disabled,
  style,
  ...rest
}) {
  const [hov, setHov] = React.useState(false);
  const d = {
    sm: 32,
    md: 40,
    lg: 48
  }[size] || 40;
  const v = {
    ghost: {
      bg: hov ? "var(--surface-muted)" : "transparent",
      fg: "var(--text-heading)",
      bd: "transparent"
    },
    outline: {
      bg: hov ? "var(--color-brand-tint)" : "transparent",
      fg: "var(--color-brand)",
      bd: "var(--border-strong)"
    },
    primary: {
      bg: hov ? "var(--color-brand-strong)" : "var(--color-brand)",
      fg: "#fff",
      bd: "transparent"
    },
    accent: {
      bg: hov ? "var(--color-accent-strong)" : "var(--color-accent)",
      fg: "#fff",
      bd: "transparent"
    }
  }[variant];
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    title: label,
    disabled: disabled,
    onMouseEnter: () => setHov(true),
    onMouseLeave: () => setHov(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: d,
      height: d,
      color: v.fg,
      background: v.bg,
      border: `2px solid ${v.bd}`,
      borderRadius: "var(--radius-md)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? .45 : 1,
      transition: "background var(--dur-fast)",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function Tag({
  selected,
  onRemove,
  onClick,
  children,
  style
}) {
  const [hov, setHov] = React.useState(false);
  return /*#__PURE__*/React.createElement("span", {
    onClick: onClick,
    onMouseEnter: () => setHov(true),
    onMouseLeave: () => setHov(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 30,
      padding: "0 12px",
      fontFamily: "var(--font-body)",
      fontWeight: 600,
      fontSize: 14,
      color: selected ? "#fff" : "var(--text-heading)",
      background: selected ? "var(--color-brand)" : hov && onClick ? "var(--kr-grey-100)" : "var(--surface-muted)",
      border: `1px solid ${selected ? "var(--color-brand)" : "var(--border-default)"}`,
      borderRadius: "var(--radius-pill)",
      cursor: onClick ? "pointer" : "default",
      userSelect: "none",
      ...style
    }
  }, children, onRemove && /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      onRemove();
    },
    "aria-label": "Remove",
    style: {
      all: "unset",
      cursor: "pointer",
      lineHeight: 1,
      fontSize: 14,
      opacity: .7
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function Dialog({
  open,
  title,
  children,
  actions,
  onClose,
  width = 520
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(20,32,43,.6)",
      display: "grid",
      placeItems: "center",
      zIndex: 100,
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxWidth: width,
      background: "#fff",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-lg)",
      borderTop: "6px solid var(--color-brand)",
      fontFamily: "var(--font-body)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "20px 24px 0"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 22,
      letterSpacing: "-0.01em",
      color: "var(--text-heading)"
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close",
    style: {
      all: "unset",
      cursor: "pointer",
      fontSize: 22,
      lineHeight: 1,
      color: "var(--text-muted)",
      padding: 4
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 24px 24px",
      fontSize: 16,
      lineHeight: 1.5,
      color: "var(--text-body)"
    }
  }, children), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 12,
      padding: "16px 24px",
      borderTop: "1px solid var(--border-default)",
      background: "var(--surface-muted)",
      borderRadius: "0 0 var(--radius-lg) var(--radius-lg)"
    }
  }, actions)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function Toast({
  tone = "success",
  title,
  message,
  onDismiss,
  style
}) {
  const c = {
    success: "var(--status-success)",
    danger: "var(--status-danger)",
    warning: "var(--status-warning)",
    info: "var(--status-info)"
  }[tone];
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
      width: 360,
      padding: "12px 14px",
      background: "var(--surface-inverse)",
      color: "var(--text-on-inverse)",
      borderLeft: `4px solid ${c}`,
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-lg)",
      fontFamily: "var(--font-body)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 14,
      letterSpacing: "0.04em",
      textTransform: "uppercase"
    }
  }, title), message && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      opacity: .85,
      marginTop: 2
    }
  }, message)), onDismiss && /*#__PURE__*/React.createElement("button", {
    onClick: onDismiss,
    "aria-label": "Dismiss",
    style: {
      all: "unset",
      cursor: "pointer",
      fontSize: 18,
      lineHeight: 1,
      opacity: .7
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function Tooltip({
  content,
  children,
  placement = "top"
}) {
  const [v, setV] = React.useState(false);
  const pos = placement === "bottom" ? {
    top: "calc(100% + 8px)"
  } : {
    bottom: "calc(100% + 8px)"
  };
  return /*#__PURE__*/React.createElement("span", {
    onMouseEnter: () => setV(true),
    onMouseLeave: () => setV(false),
    style: {
      position: "relative",
      display: "inline-flex"
    }
  }, children, v && /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
      ...pos,
      background: "var(--surface-inverse)",
      color: "#fff",
      fontFamily: "var(--font-body)",
      fontSize: 13,
      fontWeight: 600,
      padding: "6px 10px",
      borderRadius: "var(--radius-sm)",
      whiteSpace: "nowrap",
      zIndex: 50,
      pointerEvents: "none"
    }
  }, content));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  label,
  checked,
  onChange,
  disabled,
  description,
  style
}) {
  const [hov, setHov] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    onMouseEnter: () => setHov(true),
    onMouseLeave: () => setHov(false),
    style: {
      display: "inline-flex",
      alignItems: "flex-start",
      gap: 10,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? .5 : 1,
      fontFamily: "var(--font-body)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "none",
      width: 20,
      height: 20,
      marginTop: 1,
      borderRadius: "var(--radius-sm)",
      border: `2px solid ${checked ? "var(--color-brand)" : hov ? "var(--text-muted)" : "var(--border-strong)"}`,
      background: checked ? "var(--color-brand)" : "#fff",
      display: "grid",
      placeItems: "center",
      transition: "all var(--dur-fast)"
    }
  }, checked && /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#fff",
    strokeWidth: "3.5"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m5 12 5 5L20 7"
  }))), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text-heading)",
      lineHeight: "22px"
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13,
      color: "var(--text-muted)"
    }
  }, description)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  label,
  hint,
  error,
  prefix,
  suffix,
  size = "md",
  disabled,
  style,
  ...rest
}) {
  const [f, setF] = React.useState(false);
  const h = size === "sm" ? 36 : 44;
  const bd = error ? "var(--status-danger)" : f ? "var(--color-brand)" : "var(--border-strong)";
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      fontFamily: "var(--font-body)",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--text-heading)"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      height: h,
      border: `2px solid ${bd}`,
      borderRadius: "var(--radius-md)",
      background: disabled ? "var(--surface-muted)" : "#fff",
      boxShadow: f ? "var(--focus-ring)" : "none",
      transition: "box-shadow var(--dur-fast),border-color var(--dur-fast)"
    }
  }, prefix && /*#__PURE__*/React.createElement("span", {
    style: {
      padding: "0 0 0 12px",
      color: "var(--text-muted)",
      display: "flex"
    }
  }, prefix), /*#__PURE__*/React.createElement("input", _extends({
    disabled: disabled,
    onFocus: () => setF(true),
    onBlur: () => setF(false),
    style: {
      flex: 1,
      minWidth: 0,
      height: "100%",
      border: 0,
      outline: 0,
      background: "transparent",
      padding: "0 12px",
      fontSize: 16,
      fontFamily: "inherit",
      color: "var(--text-heading)"
    }
  }, rest)), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      padding: "0 12px 0 0",
      color: "var(--text-muted)",
      display: "flex"
    }
  }, suffix)), (error || hint) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: error ? "var(--status-danger)" : "var(--text-muted)"
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function Radio({
  label,
  checked,
  onChange,
  disabled,
  description,
  style
}) {
  const [hov, setHov] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    onMouseEnter: () => setHov(true),
    onMouseLeave: () => setHov(false),
    style: {
      display: "inline-flex",
      alignItems: "flex-start",
      gap: 10,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? .5 : 1,
      fontFamily: "var(--font-body)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    checked: !!checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "none",
      width: 20,
      height: 20,
      marginTop: 1,
      borderRadius: "50%",
      border: `2px solid ${checked ? "var(--color-brand)" : hov ? "var(--text-muted)" : "var(--border-strong)"}`,
      background: checked ? "#fff" : "#fff",
      display: "grid",
      placeItems: "center",
      transition: "all var(--dur-fast)"
    }
  }, checked && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: "var(--color-brand)"
    }
  })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text-heading)",
      lineHeight: "22px"
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13,
      color: "var(--text-muted)"
    }
  }, description)));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function Select({
  label,
  options = [],
  placeholder,
  value,
  onChange,
  disabled,
  style
}) {
  const [f, setF] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      fontFamily: "var(--font-body)",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "var(--text-heading)"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "flex"
    }
  }, /*#__PURE__*/React.createElement("select", {
    disabled: disabled,
    value: value,
    onChange: onChange,
    onFocus: () => setF(true),
    onBlur: () => setF(false),
    style: {
      appearance: "none",
      WebkitAppearance: "none",
      width: "100%",
      height: 44,
      padding: "0 40px 0 12px",
      fontSize: 16,
      fontFamily: "inherit",
      color: value ? "var(--text-heading)" : "var(--text-muted)",
      background: disabled ? "var(--surface-muted)" : "#fff",
      border: `2px solid ${f ? "var(--color-brand)" : "var(--border-strong)"}`,
      borderRadius: "var(--radius-md)",
      outline: 0,
      boxShadow: f ? "var(--focus-ring)" : "none",
      cursor: "pointer"
    }
  }, placeholder && /*#__PURE__*/React.createElement("option", {
    value: ""
  }, placeholder), options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label))), /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    style: {
      position: "absolute",
      right: 12,
      top: 14,
      pointerEvents: "none",
      color: "var(--text-heading)"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6 6 6-6"
  }))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  label,
  checked,
  onChange,
  disabled,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? .5 : 1,
      fontFamily: "var(--font-body)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 22,
      borderRadius: 11,
      background: checked ? "var(--color-brand)" : "var(--kr-grey-300)",
      position: "relative",
      transition: "background var(--dur-base)",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 3,
      left: checked ? 21 : 3,
      width: 16,
      height: 16,
      borderRadius: "50%",
      background: "#fff",
      transition: "left var(--dur-base) var(--ease-out)"
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text-heading)"
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  items = [],
  value,
  onChange,
  inverse,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: "flex",
      gap: 4,
      borderBottom: `1px solid ${inverse ? "rgba(255,255,255,.15)" : "var(--border-default)"}`,
      fontFamily: "var(--font-display)",
      ...style
    }
  }, items.map(it => {
    const a = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      role: "tab",
      "aria-selected": a,
      onClick: () => onChange && onChange(it.value),
      style: {
        all: "unset",
        cursor: "pointer",
        padding: "12px 16px",
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: a ? inverse ? "#fff" : "var(--color-brand)" : inverse ? "rgba(255,255,255,.65)" : "var(--text-muted)",
        borderBottom: `3px solid ${a ? inverse ? "var(--kr-green-500)" : "var(--color-brand)" : "transparent"}`,
        marginBottom: -1,
        transition: "color var(--dur-fast)"
      }
    }, it.label, it.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 6,
        opacity: .6
      }
    }, it.count));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/About.jsx
try { (() => {
const {
  Card
} = window['KongunaduRoadlinesDesignSystem_369b05'];
function About() {
  return /*#__PURE__*/React.createElement("section", {
    id: "about",
    style: {
      background: "var(--surface-muted)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "56px var(--gutter)",
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
      gap: 48
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 13,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "var(--text-brand)"
    }
  }, "About us"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "6px 0 16px",
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 36,
      letterSpacing: "-0.02em",
      color: "var(--text-heading)"
    }
  }, "Kongunadu Road Lines"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      lineHeight: 1.6,
      margin: 0
    }
  }, "We started our business in the year 1980 with our headquarters at Chennai, Tamil Nadu, and branch offices at all state capitals. We are engaged in providing an extensive range of gas and hazardous road line services at a competitive rate."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      lineHeight: 1.6,
      margin: "12px 0 0"
    }
  }, "We undertake all hazardous goods transportation as we have all valid licences for the transportation. Our ability to provide flexible solutions specific to each customer's needs has resulted in a recognised on-time performance record.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16,
      alignContent: "start"
    }
  }, [["1980", "Established, Chennai"], ["ISO 9001", "Certified organisation"], ["All states", "Branch offices at capitals"], ["Hazchem", "All valid licences"]].map(([a, b]) => /*#__PURE__*/React.createElement(Card, {
    key: a,
    padding: 20
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 30,
      letterSpacing: "-0.02em",
      color: "var(--text-brand)",
      lineHeight: 1
    }
  }, a), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-muted)",
      marginTop: 6
    }
  }, b))))));
}
window.About = About;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/About.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Footer.jsx
try { (() => {
const {
  Wordmark,
  Button
} = window['KongunaduRoadlinesDesignSystem_369b05'];
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--surface-inverse)",
      color: "var(--text-on-inverse)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "48px var(--gutter) 32px",
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr",
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Wordmark, {
    height: 30,
    inverse: true,
    src: "../../assets/logo-inverse.png"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      opacity: .7,
      margin: "14px 0 0",
      maxWidth: 360,
      lineHeight: 1.5
    }
  }, "Headquarters: Chennai, Tamil Nadu. Operations from Namakkal. Branch offices at all state capitals.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 12,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      opacity: .6,
      marginBottom: 12
    }
  }, "Get in touch"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    size: "sm",
    icon: I("phone", 15)
  }, window.KR_DATA.phone), /*#__PURE__*/React.createElement(Button, {
    variant: "inverse",
    size: "sm",
    icon: I("message-circle", 15)
  }, "WhatsApp"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 12,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      opacity: .6,
      marginBottom: 12
    }
  }, "Pages"), ["Home", "Our products", "Photos", "About us", "Reviews"].map(p => /*#__PURE__*/React.createElement("a", {
    key: p,
    href: "#",
    style: {
      display: "block",
      color: "#fff",
      fontSize: 15,
      marginBottom: 6,
      textDecoration: "none"
    }
  }, p)))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      background: "repeating-linear-gradient(135deg,var(--kr-saffron-500) 0 16px,var(--kr-steel-900) 16px 32px)"
    }
  }));
}
window.Footer = Footer;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Footer.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Header.jsx
try { (() => {
const {
  Wordmark,
  Button,
  IconButton,
  Tabs
} = window['KongunaduRoadlinesDesignSystem_369b05'];
function Header({
  tab,
  setTab
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      background: "#fff",
      borderBottom: "1px solid var(--border-default)",
      position: "sticky",
      top: 0,
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      background: "linear-gradient(90deg,var(--kr-green-700) 0 72%,var(--kr-red-600) 72%)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "14px var(--gutter) 0",
      display: "flex",
      alignItems: "center",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    height: 34,
    src: "../../assets/logo-1600.png"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: "var(--text-muted)",
      marginRight: 8
    }
  }, "Namakkal \xB7 Chennai HQ \xB7 Since 1980"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: I("message-circle", 15)
  }, "WhatsApp"), /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    size: "sm",
    icon: I("phone", 15)
  }, "Call now"))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "0 var(--gutter)"
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    items: [{
      value: "products",
      label: "Products",
      count: 10
    }, {
      value: "categories",
      label: "Categories"
    }, {
      value: "about",
      label: "About"
    }, {
      value: "photos",
      label: "Photos"
    }, {
      value: "reviews",
      label: "Reviews",
      count: 2
    }],
    value: tab,
    onChange: setTab,
    style: {
      borderBottom: 0
    }
  })));
}
window.Header = Header;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Header.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Hero.jsx
try { (() => {
const {
  Button,
  Badge
} = window['KongunaduRoadlinesDesignSystem_369b05'];
function Hero({
  onQuote
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--surface-inverse)",
      color: "var(--text-on-inverse)",
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "64px var(--gutter)",
      display: "grid",
      gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)",
      gap: 48,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "solid"
  }, "ISO 9001:2008"), /*#__PURE__*/React.createElement(Badge, {
    tone: "warning"
  }, "Hazchem licensed"), /*#__PURE__*/React.createElement(Badge, {
    tone: "inverse",
    style: {
      background: "rgba(255,255,255,.12)"
    }
  }, "GST verified")), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 56,
      lineHeight: 1.05,
      letterSpacing: "-0.02em",
      color: "#fff",
      textWrap: "pretty"
    }
  }, "Gas & hazardous goods road transport across India."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-serif)",
      fontSize: 20,
      lineHeight: 1.5,
      color: "rgba(255,255,255,.78)",
      margin: "20px 0 28px",
      maxWidth: 520
    }
  }, "Liquid cryogenic, reefer, CNG/LNG cascades and tankers, bulk LPG and 40-foot trailers \u2014 with every valid licence, since 1980."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    onClick: onQuote
  }, "Get best price"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "inverse",
    icon: I("phone", 16)
  }, "Call now"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/images/fuel-tanker.webp",
    alt: "Kongunadu Road Lines tanker",
    style: {
      width: "100%",
      display: "block",
      borderRadius: "var(--radius-lg)",
      aspectRatio: "4/3",
      objectFit: "cover"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: -1,
      height: 12,
      background: "repeating-linear-gradient(135deg,var(--kr-saffron-500) 0 16px,var(--kr-steel-900) 16px 32px)",
      borderRadius: "0 0 6px 6px"
    }
  }))));
}
window.Hero = Hero;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Services.jsx
try { (() => {
const {
  ServiceCard,
  Tag,
  Input
} = window['KongunaduRoadlinesDesignSystem_369b05'];
function Services({
  onQuote
}) {
  const D = window.KR_DATA;
  const [cat, setCat] = React.useState("All"),
    [q, setQ] = React.useState("");
  const list = D.services.filter(s => (cat === "All" || s.cat === cat) && s.title.toLowerCase().includes(q.toLowerCase()));
  return /*#__PURE__*/React.createElement("section", {
    id: "products",
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      padding: "56px var(--gutter)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 24,
      flexWrap: "wrap",
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: 13,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "var(--text-brand)"
    }
  }, "Transportation services"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "6px 0 0",
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 36,
      letterSpacing: "-0.02em",
      color: "var(--text-heading)"
    }
  }, "Our fleet & services")), /*#__PURE__*/React.createElement(Input, {
    size: "sm",
    placeholder: "Search services",
    prefix: I("search", 16),
    value: q,
    onChange: e => setQ(e.target.value),
    style: {
      width: 260
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      marginBottom: 24
    }
  }, D.cats.map(c => /*#__PURE__*/React.createElement(Tag, {
    key: c,
    selected: cat === c,
    onClick: () => setCat(c)
  }, c))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
      gap: 20
    }
  }, list.map(s => /*#__PURE__*/React.createElement(ServiceCard, {
    key: s.id,
    image: s.img,
    tag: s.cat,
    title: s.title,
    specs: s.specs,
    description: s.desc,
    onEnquire: () => onQuote(s),
    onCall: () => {}
  }))), list.length === 0 && /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--text-muted)"
    }
  }, "No services match."));
}
window.Services = Services;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Services.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/data.js
try { (() => {
window.KR_DATA = {
  services: [{
    id: 1,
    cat: "Reefer",
    title: "Refrigerated Container Transportation Service",
    img: "../../assets/images/refrigerated-container.webp",
    specs: [["Starting location", "Namakkal"], ["Destination", "Depend on customer"]],
    desc: "Being a client-centric firm, we are involved in providing a range of Refrigerated Container Transportation Service to our clients. These services are performed by our expert crew members for smooth operation."
  }, {
    id: 2,
    cat: "Cryogenic",
    title: "Cryogenic Liquids Transportation Service",
    img: "../../assets/images/cryogenic-liquids.webp",
    specs: [["Cargo", "Liquid oxygen / nitrogen / argon"]],
    desc: "This Cryogenic Liquids Transportation Service is highly acclaimed amongst our clients, for rendering efficient and reliable service."
  }, {
    id: 3,
    cat: "Tanker",
    title: "Fuel Transportation Service",
    img: "../../assets/images/fuel-tanker.webp",
    specs: [["Starting location", "Namakkal"]],
    desc: "These Fuel Transportation Services are admired by our clients for their safe and timely delivery."
  }, {
    id: 4,
    cat: "Cryogenic",
    title: "Liquid Oxygen Transportation Service",
    specs: [["Features", "Affordable, timely, reliable"]]
  }, {
    id: 5,
    cat: "Reefer",
    title: "Reefer Trailer Transportation Service",
    specs: [["Destination", "Depend on customer"]],
    desc: "Known to provide best services at the earliest time."
  }, {
    id: 6,
    cat: "Cryogenic",
    title: "Liquid Argon Gas Transportation Service",
    specs: [["Source", "Bilari, Chennai, Bengaluru"], ["Duration", "Depend on distance"], ["Service charges", "Min. ₹50,000 to 5 Lac"]]
  }, {
    id: 7,
    cat: "Medical",
    title: "Emergency Medical Transportation Service",
    img: "../../assets/images/emergency-medical.webp",
    specs: [["Cargo", "Liquid medical oxygen"]]
  }, {
    id: 8,
    cat: "Trailer",
    title: "Semi Low Bed Trailer",
    specs: [["Length", "40 feet"]]
  }, {
    id: 9,
    cat: "Trailer",
    title: "Flat Bed Trailer",
    specs: [["Length", "40 feet"]]
  }, {
    id: 10,
    cat: "Tanker",
    title: "LPG Gas Supply Service",
    specs: [["Cargo", "Bulk LPG / propane"]]
  }],
  cats: ["All", "Cryogenic", "Reefer", "Tanker", "Trailer", "Medical"],
  phone: "+91 80477 97932"
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/data.js", error: String((e && e.message) || e) }); }

__ds_ns.ServiceCard = __ds_scope.ServiceCard;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
