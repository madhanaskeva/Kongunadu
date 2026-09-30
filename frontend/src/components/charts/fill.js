/**
 * Gradient fills for chart bars, derived from the bar's own colour so every
 * series keeps its meaning: a lighter tint at the start, the full colour in the
 * middle, a deeper shade at the end (same feel as the dark table header).
 *
 *   barFill(color)            → horizontal bar (left → right)
 *   barFill(color, 'column')  → vertical column (top light → bottom deep)
 */
export const barFill = (color, dir = 'row') => {
  const angle = dir === 'column' ? '180deg' : '90deg';
  return `linear-gradient(${angle}, color-mix(in srgb, ${color} 72%, #ffffff) 0%, ${color} 55%, color-mix(in srgb, ${color} 78%, #000000) 100%)`;
};
