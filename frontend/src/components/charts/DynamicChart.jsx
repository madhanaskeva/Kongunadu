import React from 'react';
import { BarChart } from './BarChart';
import { PieChart } from './PieChart';
import { LineChart } from './LineChart';
import { DonutChart } from './DonutChart';

export const DynamicChart = ({ chart = {} }) => {
  const chartType = chart.chartType || 'bar';

  // 1. Grouped Charts (Custom Modules with multiple headings)
  if (chart.isGroups && chart.groups) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {chart.groups.map((gr, gri) => (
          <div key={gri} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--text-heading)',
                }}
              >
                {gr.h}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {gr.sub}
              </span>
            </div>

            {gr.hasNote && gr.note ? (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '8px 0' }}>
                {gr.note}
              </div>
            ) : chartType === 'pie' ? (
              <PieChart data={gr.chartData} height={180} />
            ) : chartType === 'donut' ? (
              <DonutChart
                data={gr.chartData}
                centerValue={gr.total != null ? gr.total : undefined}
                centerLabel={gr.h}
                height={180}
              />
            ) : chartType === 'line' ? (
              <LineChart data={gr.chartData} height={180} />
            ) : (
              /* Bar view: default custom horizontal bars */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {gr.rows && gr.rows.map((b, bi) => (
                  <div
                    key={bi}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(90px, 150px) 1fr minmax(56px, auto)',
                      gap: '12px',
                      alignItems: 'center',
                      fontSize: '14px',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color: 'var(--text-heading)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {b.name}
                    </span>
                    <span
                      style={{
                        height: '14px',
                        background: 'var(--kr-grey-100)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        display: 'flex',
                      }}
                    >
                      {b.segs.map((g, gi) => (
                        <span key={gi} style={{ width: g.w, background: g.color }} />
                      ))}
                    </span>
                    <span style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                      {b.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // 2. Non-Bar views for standard / single data charts
  if (chartType === 'pie') {
    return (
      <PieChart
        data={chart.chartData}
        height={210}
        valueSuffix={chart.valueSuffix || ''}
      />
    );
  }

  if (chartType === 'donut') {
    return (
      <DonutChart
        data={chart.chartData}
        centerValue={chart.centerValue}
        centerLabel={chart.centerLabel || 'Total'}
        height={210}
        valueSuffix={chart.valueSuffix || ''}
      />
    );
  }

  if (chartType === 'line') {
    return (
      <LineChart
        data={chart.chartData}
        height={200}
        valueSuffix={chart.valueSuffix || ''}
      />
    );
  }

  // 3. Bar View (Default)
  // If native horizontal bars layout exists
  if (chart.isHbar && chart.rows) {
    return (
      <>
        {chart.rows.map((b, bi) => (
          <div
            key={bi}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(90px, 150px) 1fr minmax(56px, auto)',
              gap: '12px',
              alignItems: 'center',
              fontSize: '14px',
            }}
          >
            <span
              style={{
                fontWeight: 600,
                color: 'var(--text-heading)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {b.name}
            </span>
            <span
              style={{
                height: '14px',
                background: 'var(--kr-grey-100)',
                borderRadius: '2px',
                overflow: 'hidden',
                display: 'flex',
              }}
            >
              {b.segs.map((g, gi) => (
                <span key={gi} style={{ width: g.w, background: g.color }} />
              ))}
            </span>
            <span style={{ textAlign: 'right', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              <strong style={{ color: 'var(--text-heading)' }}>{b.value}</strong>
              {b.rest}
            </span>
          </div>
        ))}
        {chart.legend && chart.legend.length > 0 && (
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', paddingTop: '4px' }}>
            {chart.legend.map((l, li) => (
              <span key={li} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        )}
      </>
    );
  }

  // If native vertical columns layout exists
  if (chart.isColumn && chart.bars) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '160px', borderBottom: '1px solid var(--border-default)' }}>
          {chart.bars.map((b, bi) => (
            <div
              key={bi}
              title={b.title}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'stretch',
                height: '100%',
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', textAlign: 'center' }}>
                {b.val}
              </span>
              <div style={{ height: b.h, background: b.color, borderRadius: '2px 2px 0 0' }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>{chart.axisStart}</span>
          <span>{chart.axisEnd}</span>
        </div>
      </>
    );
  }

  // If native stat layout exists
  if (chart.isStat && chart.stats) {
    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {chart.stats.map((x, xi) => (
            <div key={xi}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '30px', lineHeight: 1, color: x.color }}>
                {x.value}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{x.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', height: '10px', borderRadius: '2px', overflow: 'hidden', gap: '2px' }}>
          {chart.stats.map((x, xi) => (
            <span key={xi} title={x.label} style={{ width: x.w, background: x.color }} />
          ))}
        </div>
        {chart.note && <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>{chart.note}</p>}
      </>
    );
  }

  // Fallback to BarChart component if chartData is available
  if (chart.chartData && chart.chartData.length > 0) {
    return <BarChart data={chart.chartData} height={180} valueSuffix={chart.valueSuffix || ''} />;
  }

  return (
    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
      No chart data available
    </div>
  );
};

export default DynamicChart;
