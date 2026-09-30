import React from 'react';
import { Empty, Flex, Tooltip, Typography } from 'antd';

// Categorical series colours, in fixed order (validated for colour-blind
// separation on the white card surface). Colour follows the entity's position
// in the selection; a 9th series is never given a generated colour.
export const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
export const MAX_SERIES = SERIES_COLORS.length;

// Round the axis top up to 1 / 2 / 2.5 / 5 × 10ⁿ so tick labels stay tidy.
const niceMax = (v) => {
  if (!v || v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const f = v / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
};
const compact = (v) => (v >= 1000 ? `${Math.round((v / 1000) * 10) / 10}k` : String(Math.round(v * 10) / 10));

export const Legend = ({ series }) => (
  <Flex gap={14} wrap>
    {series.map(s => (
      <Flex key={s.key} align="center" gap={6} style={{ minWidth: 0 }}>
        <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flex: 'none' }} />
        <Typography.Text type="secondary" ellipsis style={{ fontSize: 12, maxWidth: 160 }}>{s.label}</Typography.Text>
      </Flex>
    ))}
  </Flex>
);

// Vertical bars on one axis: a group per category (period), a bar per series.
// Recessive gridlines, 4px rounded tops on the baseline, 2px gaps, a tooltip per bar.
export const BarChart = ({ categories, series, format, height = 190, showLegend = true, integer = false }) => {
  const max = Math.max(0, ...series.flatMap(s => s.values.map(v => v || 0)));
  if (!max) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nothing recorded in this range." style={{ margin: '28px 0' }} />;
  }
  // Counts get whole-number ticks: the top is kept even so the midline is too.
  const top = integer ? Math.max(2, Math.ceil(niceMax(max) / 2) * 2) : niceMax(max);
  const ticks = [top, top / 2, 0];
  const labelEvery = Math.ceil(categories.length / 10);
  const barMax = series.length > 1 ? 18 : 40;

  return (
    <Flex vertical gap={10}>
      {showLegend && series.length > 1 && <Legend series={series} />}
      <div style={{ overflowX: 'auto' }}>
        <Flex style={{ minWidth: Math.max(300, 44 + categories.length * Math.max(34, series.length * 10 + 14)) }}>
          {/* Y axis */}
          <Flex vertical justify="space-between" style={{ width: 40, height, flex: 'none', paddingRight: 6 }}>
            {ticks.map(t => (
              <Typography.Text key={t} type="secondary" style={{ fontSize: 10.5, lineHeight: '10px', textAlign: 'right' }}>
                {compact(t)}
              </Typography.Text>
            ))}
          </Flex>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Plot */}
            <div style={{ position: 'relative', height }}>
              {ticks.map((t, i) => (
                <div
                  key={t}
                  aria-hidden
                  style={{
                    position: 'absolute', left: 0, right: 0, top: `${(i / (ticks.length - 1)) * 100}%`,
                    borderTop: `1px ${i === ticks.length - 1 ? 'solid' : 'dashed'} var(--border-default)`,
                  }}
                />
              ))}
              <Flex align="flex-end" style={{ position: 'absolute', inset: 0 }}>
                {categories.map((c, ci) => (
                  <Flex key={c.key} align="flex-end" justify="center" gap={2} style={{ flex: 1, height: '100%', padding: '0 4px' }}>
                    {series.map(s => {
                      const v = s.values[ci];
                      return (
                        <Tooltip
                          key={s.key}
                          title={<><div style={{ opacity: 0.8 }}>{c.label}{series.length > 1 ? ` · ${s.label}` : ''}</div><strong>{format(v)}</strong></>}
                        >
                          {/* The hit area spans the full column height; the bar sits inside it. */}
                          <Flex align="flex-end" style={{ flex: 1, maxWidth: barMax, height: '100%', cursor: 'default' }}>
                            <div
                              style={{
                                width: '100%',
                                height: `${v ? Math.max(1.5, (v / top) * 100) : 0}%`,
                                background: s.color,
                                borderRadius: '4px 4px 0 0',
                                transition: 'height 0.3s ease-out',
                              }}
                            />
                          </Flex>
                        </Tooltip>
                      );
                    })}
                  </Flex>
                ))}
              </Flex>
            </div>

            {/* X axis */}
            <Flex style={{ marginTop: 6 }}>
              {categories.map((c, i) => (
                <Typography.Text
                  key={c.key}
                  type="secondary"
                  style={{ flex: 1, minWidth: 0, fontSize: 11, textAlign: 'center', whiteSpace: 'nowrap', visibility: i % labelEvery ? 'hidden' : 'visible' }}
                >
                  {c.label}
                </Typography.Text>
              ))}
            </Flex>
          </div>
        </Flex>
      </div>
    </Flex>
  );
};

// Horizontal bars: one per entity, largest first, value at the end.
export const RankBars = ({ items, format }) => {
  const sorted = [...items].sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
  const max = Math.max(0, ...sorted.map(x => x.value || 0));
  if (!max) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nothing recorded in this range." style={{ margin: '28px 0' }} />;
  }
  return (
    <Flex vertical gap={10} style={{ maxHeight: 232, overflowY: 'auto', paddingRight: 4 }}>
      {sorted.map(x => (
        <Tooltip key={x.key} title={`${x.label}: ${format(x.value)}`}>
          <Flex align="center" gap={10}>
            <Typography.Text ellipsis style={{ width: 128, flex: 'none', fontSize: 12 }}>{x.label}</Typography.Text>
            <div style={{ flex: 1, height: 14 }}>
              <div style={{ width: `${x.value ? Math.max(1, (x.value / max) * 100) : 0}%`, height: '100%', background: x.color, borderRadius: '0 4px 4px 0' }} />
            </div>
            <Typography.Text strong style={{ width: 86, flex: 'none', textAlign: 'right', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
              {format(x.value)}
            </Typography.Text>
          </Flex>
        </Tooltip>
      ))}
    </Flex>
  );
};

export default BarChart;
