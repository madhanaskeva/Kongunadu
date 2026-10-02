import React from 'react';
import markImg from '@/assets/images/logo-mark.png';

// Kongunadu Road Lines logo: the hexagon mark as an image, the name as live text,
// so the wordmark stays sharp and readable at any size (styles: .krl-brand in global.css).
// `size` is the height of the mark in px and the text scales with it; leave it out to
// size the logo from CSS (--krl-brand-size, 48px by default).
export const BrandLogo = ({ size, className = '', style, ...rest }) => (
  <span
    className={`krl-brand ${className}`.trim()}
    style={size ? { '--krl-brand-size': `${size}px`, ...style } : style}
    role="img"
    aria-label="Kongunadu Road Lines"
    {...rest}
  >
    <img src={markImg} alt="" className="krl-brand-mark" draggable={false} />
    <span className="krl-brand-text" aria-hidden="true">
      <span className="krl-brand-name">KONGUNADU</span>
      <span className="krl-brand-sub">ROAD LINES</span>
    </span>
  </span>
);

export default BrandLogo;
