// import React, { useEffect, useState } from 'react';
// import { useTMSAdmin } from '../../../context/TMSAdminContext';
// import { Button, Card, Col, Empty, Flex, Input, Progress, Row, Space, Statistic, Table, Tag, Tooltip, Typography } from 'antd';
// import { CircleCheck, Eye, SearchCheck, Search } from 'lucide-react';
// import { matchesSearch } from '../../../utils/search';
// import { useDebounce } from '../../../utils/debounce';

// export const DistanceVariation = () => {
//   const { T, st, distQ, setDistQ, distReview, setDistReview, navTo, showToast } = useTMSAdmin();
//   const debouncedDistQ = useDebounce(distQ, 300);
//   const setReview = (r, status) => {
//     setDistReview(prev => ({ ...prev, [r.id]: status }));
//     showToast(status === 'Reviewed' ? 'success' : 'info', status === 'Reviewed' ? 'Marked reviewed' : 'Marked under review', `${r.vehicleNumber} · ${r.number || r.route || ''}`.trim());
//   };
//   const tms = T();

//   const distThr = Number(st.variance) || 5;
//   const kmTxt = n => n == null ? '—' : n.toLocaleString('en-IN') + ' km';

//   const distAll = (tms.distanceChecks || []).map(d => {
//     const delta = km => km == null ? null : Math.round((km - d.fixedKm) / d.fixedKm * 1000) / 10;
//     const g = delta(d.gpsKm);
//     const o = delta(d.odoKm);
//     const pct = Math.max(Math.abs(g || 0), Math.abs(o || 0));
//     const flagged = pct > distThr;
//     const review = flagged ? (distReview[d.id] || d.review || 'Open') : 'Within ' + distThr + '%';
//     const [statusBg, statusFg, edge] = review === 'Open'
//       ? ['var(--kr-red-100)', 'var(--kr-red-800)', 'var(--kr-red-600)']
//       : review === 'Under review'
//       ? ['var(--color-hazard-soft)', '#7A4300', 'var(--kr-saffron-500)']
//       : review === 'Reviewed'
//       ? ['var(--kr-grey-100)', 'var(--kr-grey-700)', 'var(--kr-grey-300)']
//       : ['var(--color-brand-tint)', 'var(--kr-green-800)', 'var(--color-brand)'];
//     const sign = x => x == null ? 'No reading' : (x > 0 ? '+' : '') + x.toFixed(1) + '%';
//     const dColor = x => x == null || Math.abs(x) > distThr ? 'var(--kr-red-700)' : 'var(--text-muted)';
//     const mx = Math.max(d.fixedKm, d.gpsKm || 0, d.odoKm || 0);
//     const bars = [
//       ['Fixed · Maps', d.fixedKm, 'var(--kr-grey-700)'],
//       ['GPS', d.gpsKm, 'var(--color-brand)'],
//       ['Odometer', d.odoKm, 'var(--kr-saffron-500)'],
//     ].map(([label, km, color]) => ({
//       label,
//       value: kmTxt(km),
//       w: km == null ? '0%' : Math.round(km / mx * 100) + '%',
//       color,
//     }));
//     const [srcName, srcKm] = Math.abs(o || 0) >= Math.abs(g || 0) ? ['Odometer', d.odoKm] : ['GPS', d.gpsKm];
//     const diff = (srcKm || 0) - d.fixedKm;
//     const v = tms.V[d.vehicle];
//     const hasTrip = !!(d.trip && tms.T[d.trip]);

//     return {
//       ...d,
//       vehicleNumber: v ? v.number : '—',
//       branchName: (tms.B[d.branch] || {}).name,
//       fixedText: kmTxt(d.fixedKm),
//       gpsText: kmTxt(d.gpsKm),
//       odoText: kmTxt(d.odoKm),
//       gpsDelta: sign(g),
//       odoDelta: sign(o),
//       gpsDeltaColor: dColor(g),
//       odoDeltaColor: dColor(o),
//       pct,
//       pctText: pct.toFixed(1) + '%',
//       pctColor: flagged ? 'var(--kr-red-700)' : 'var(--text-heading)',
//       pctW: Math.min(100, Math.round(pct / (distThr * 3) * 100)) + '%',
//       barColor: flagged ? 'var(--kr-red-600)' : 'var(--color-brand)',
//       flagged,
//       review,
//       statusBg,
//       statusFg,
//       edge,
//       bars,
//       diffText: srcName + ' ' + (diff > 0 ? '+' : '') + diff + ' km vs fixed',
//       canClose: review === 'Open' || review === 'Under review',
//       hasTrip,
//       trip: hasTrip ? d.trip : '',
//       cursor: hasTrip ? 'pointer' : 'default',
//     };
//   });

//   const distFlagged = distAll.filter(d => d.flagged).length;
//   const distRows = distAll
//     .filter(d => matchesSearch(debouncedDistQ, d.vehicleNumber, d.number, d.route, d.branchName))
//     .sort((a, b) => b.pct - a.pct);
//   // Back to page 1 whenever the search changes (as the old usePagination did).
//   const [distPage, setDistPage] = useState(1);
//   const [distPageSize, setDistPageSize] = useState(10);
//   useEffect(() => { setDistPage(1); }, [debouncedDistQ, distPageSize]);
//   const distAlerts = distAll.filter(d => d.canClose).sort((a, b) => b.pct - a.pct);
//   const distAvg = distAll.reduce((t, d) => t + d.pct, 0) / (distAll.length || 1);

//   const distTiles = [
//     { label: 'Trips compared', value: distAll.length, sub: 'Closed trips · last 7 days', edge: 'var(--color-brand)', color: 'var(--text-heading)' },
//     { label: `Within ${distThr}%`, value: distAll.length - distFlagged, sub: Math.round((distAll.length - distFlagged) / (distAll.length || 1) * 100) + '% of trips', edge: 'var(--color-brand)', color: 'var(--text-heading)' },
//     { label: `Over ${distThr}%`, value: distFlagged, sub: 'Flagged for review', edge: 'var(--kr-red-600)', color: 'var(--kr-red-700)' },
//     { label: 'Average variance', value: distAvg.toFixed(1) + '%', sub: 'Furthest source vs fixed KM', edge: 'var(--kr-grey-300)', color: 'var(--text-heading)' },
//   ];

//   // Review status → antd Tag preset (red / amber / grey / green as before).
//   const reviewTag = review =>
//     review === 'Open' ? 'error' : review === 'Under review' ? 'warning' : review === 'Reviewed' ? 'default' : 'success';

//   const nowrap = { whiteSpace: 'nowrap' };
//   const distColumns = [
//     {
//       title: 'Trip',
//       key: 'trip',
//       onCell: () => ({ style: nowrap }),
//       render: (_, r) => (
//         <>
//           <Typography.Text strong style={{ display: 'block', color: 'var(--text-heading)' }}>{r.vehicleNumber}</Typography.Text>
//           <Typography.Text type="secondary" style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.number}</Typography.Text>
//         </>
//       ),
//     },
//     {
//       title: 'Route',
//       key: 'route',
//       render: (_, r) => (
//         <>
//           <Typography.Text style={{ display: 'block', color: 'var(--text-heading)' }}>{r.route}</Typography.Text>
//           <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{r.branchName} · closed {r.closed}</Typography.Text>
//         </>
//       ),
//     },
//     {
//       title: 'Fixed KM · Google Maps',
//       dataIndex: 'fixedText',
//       key: 'fixed',
//       onCell: () => ({ style: nowrap }),
//       render: v => <Typography.Text strong style={{ color: 'var(--text-heading)' }}>{v}</Typography.Text>,
//     },
//     {
//       title: 'GPS KM',
//       key: 'gps',
//       onCell: () => ({ style: nowrap }),
//       render: (_, r) => (
//         <>
//           <Typography.Text style={{ display: 'block', color: 'var(--text-heading)' }}>{r.gpsText}</Typography.Text>
//           <Typography.Text style={{ display: 'block', fontSize: 12, color: r.gpsDeltaColor }}>{r.gpsDelta}</Typography.Text>
//         </>
//       ),
//     },
//     {
//       title: 'Odometer KM',
//       key: 'odo',
//       onCell: () => ({ style: nowrap }),
//       render: (_, r) => (
//         <>
//           <Typography.Text style={{ display: 'block', color: 'var(--text-heading)' }}>{r.odoText}</Typography.Text>
//           <Typography.Text style={{ display: 'block', fontSize: 12, color: r.odoDeltaColor }}>{r.odoDelta}</Typography.Text>
//         </>
//       ),
//     },
//     {
//       title: 'Variance',
//       key: 'variance',
//       onCell: () => ({ style: nowrap }),
//       render: (_, r) => (
//         <Space size={10}>
//           {/* Custom mini-meter: the tick marks the threshold, so it stays hand-drawn. */}
//           <Tooltip title={`Tick marks the ${distThr}% threshold`}>
//             <span style={{ position: 'relative', display: 'inline-block', width: '90px', height: '8px', background: 'var(--kr-grey-100)', borderRadius: '2px' }}>
//               <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: r.pctW, background: r.barColor, borderRadius: '2px' }}></span>
//               <span style={{ position: 'absolute', left: '33.3%', top: '-3px', bottom: '-3px', width: '2px', background: 'var(--kr-grey-700)' }}></span>
//             </span>
//           </Tooltip>
//           <Typography.Text strong style={{ color: r.pctColor }}>{r.pctText}</Typography.Text>
//         </Space>
//       ),
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       align: 'center',
//       onCell: () => ({ style: nowrap }),
//       render: (_, r) =>
//         r.hasTrip || r.canClose ? (
//           <Space size={4} role="group" aria-label={`Actions for trip ${r.number}`} onClick={e => e.stopPropagation()}>
//             {r.hasTrip && (
//               <Tooltip title={`View trip ${r.number}`}>
//                 <Button type="text" size="small" aria-label={`View trip ${r.number}`} icon={<Eye size={16} />} onClick={() => navTo('trip', { selectedTrip: r.trip })} />
//               </Tooltip>
//             )}
//             {r.review === 'Open' && (
//               <Tooltip title="Mark under review">
//                 <Button type="text" size="small" aria-label="Mark under review" icon={<SearchCheck size={16} />} onClick={() => setReview(r, 'Under review')} />
//               </Tooltip>
//             )}
//             {r.canClose && (
//               <Tooltip title="Mark reviewed">
//                 <Button type="text" size="small" aria-label="Mark reviewed" icon={<CircleCheck size={16} />} onClick={() => setReview(r, 'Reviewed')} />
//               </Tooltip>
//             )}
//           </Space>
//         ) : (
//           <Typography.Text type="secondary">—</Typography.Text>
//         ),
//     },
//   ];

//   // Colour swatch + label heading used by the three source explanation cards.
//   const sourceCards = [
//     { swatch: 'var(--kr-grey-700)', title: 'Fixed route KM', kicker: 'Google Maps reference', body: 'Set once per route in Route Master. This is the billing baseline.' },
//     { swatch: 'var(--color-brand)', title: 'GPS KM', kicker: 'Device track', body: 'Distance summed from GPS fixes between trip open and close.' },
//     { swatch: 'var(--kr-saffron-500)', title: 'Odometer KM', kicker: 'Closing − opening', body: 'Readings entered by the supervisor when the trip opens and closes.' },
//     { title: 'Distance comparison', kicker: `Flag above ${distThr}%`, body: 'The source furthest from the fixed KM sets the trip variance. Flagged trips go to review.', tint: true },
//   ];

//   const sectionTitle = { margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, letterSpacing: '0.02em', textTransform: 'uppercase' };

//   return (
//     <Flex vertical gap={20}>
//       {/* Top Description & Settings link */}
//       <Flex justify="flex-end" wrap>
//         <Button type="link" onClick={() => navTo('settings')} style={{ paddingInline: 0 }}>
//           Threshold {distThr}% · change in Settings &rarr;
//         </Button>
//       </Flex>

//       {/* 4 KPI Tiles */}
//       <Row gutter={[12, 12]}>
//         {distTiles.map((k, idx) => (
//           <Col key={idx} xs={24} sm={12} lg={6}>
//             <Card size="small" className="tms-kpi" style={{ height: '100%', '--kpi': k.edge }}>
//               <Statistic groupSeparator=""
//                 title={<span className="tms-kpi-label">{k.label}</span>}
//                 value={k.value}
//                 styles={{ content: { color: k.color } }}
//               />
//               <Typography.Text type="secondary" style={{ fontSize: 12 }}>{k.sub}</Typography.Text>
//             </Card>
//           </Col>
//         ))}
//       </Row>

//       {/* 4 Explanation Cards */}
//       <Row gutter={[12, 12]}>
//         {sourceCards.map(c => (
//           <Col key={c.title} xs={24} sm={12} lg={6}>
//             <Card size="small" style={{ height: '100%', ...(c.tint ? { background: 'var(--color-brand-tint)' } : {}) }}>
//               <Space size={8}>
//                 {c.swatch && <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: c.swatch }}></span>}
//                 <Typography.Text strong style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-heading)' }}>{c.title}</Typography.Text>
//               </Space>
//               <Typography.Text type="secondary" strong style={{ display: 'block', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 4 }}>
//                 {c.kicker}
//               </Typography.Text>
//               <Typography.Paragraph style={{ fontSize: 13, margin: '6px 0 0' }}>{c.body}</Typography.Paragraph>
//             </Card>
//           </Col>
//         ))}
//       </Row>

//       {/* Review Alerts Section */}
//       <Flex vertical gap={12} component="section">
//         <Flex justify="space-between" align="baseline" gap={12} wrap>
//           <Typography.Title level={2} style={sectionTitle}>Review alerts</Typography.Title>
//           <Typography.Text type="secondary" style={{ fontSize: 13 }}>
//             {distAlerts.length} trips with variance over {distThr}% of fixed route KM
//           </Typography.Text>
//         </Flex>

//         {distAlerts.length === 0 && (
//           <Card>
//             <Empty
//               image={Empty.PRESENTED_IMAGE_SIMPLE}
//               description={
//                 <>
//                   <Typography.Title level={4} style={{ margin: 0 }}>No distance alerts to review</Typography.Title>
//                   <Typography.Text type="secondary">All flagged trips have been reviewed.</Typography.Text>
//                 </>
//               }
//             />
//           </Card>
//         )}

//         <Row gutter={[16, 16]}>
//           {distAlerts.map(a => (
//             <Col key={a.id} xs={24} md={12} xl={8}>
//               <Card size="small" style={{ height: '100%', borderLeft: `4px solid ${a.edge}` }} styles={{ body: { padding: 16 } }}>
//                 <Flex vertical gap={12}>
//                   <Flex justify="space-between" align="center" gap={8}>
//                     <Typography.Text strong style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--text-heading)' }}>
//                       {a.vehicleNumber}
//                     </Typography.Text>
//                     <Tag color={reviewTag(a.review)} style={{ marginInlineEnd: 0, textTransform: 'uppercase', fontWeight: 700 }}>{a.review}</Tag>
//                   </Flex>
//                   <div>
//                     <Typography.Text strong style={{ display: 'block', fontSize: 15, color: 'var(--text-heading)' }}>{a.route}</Typography.Text>
//                     <Typography.Text type="secondary" style={{ fontSize: 13 }}>
//                       <span style={{ fontFamily: 'var(--font-mono)' }}>{a.number}</span> · {a.branchName} · closed {a.closed}
//                     </Typography.Text>
//                   </div>
//                   <Card size="small" variant="borderless" style={{ background: 'var(--surface-muted)' }}>
//                     <Flex vertical gap={4}>
//                       {a.bars.map((b, bIdx) => (
//                         <Flex key={bIdx} align="center" gap={10} style={{ fontSize: 13 }}>
//                           <Typography.Text type="secondary" style={{ flex: '0 0 96px', fontSize: 13 }}>{b.label}</Typography.Text>
//                           <Progress
//                             percent={parseFloat(b.w)}
//                             showInfo={false}
//                             strokeColor={b.color}
//                             railColor="#fff"
//                             size={{ height: 10 }}
//                             style={{ flex: 1, minWidth: 0, margin: 0 }}
//                           />
//                           <Typography.Text strong style={{ flex: '0 0 72px', textAlign: 'right', whiteSpace: 'nowrap', fontSize: 13, color: 'var(--text-heading)' }}>
//                             {b.value}
//                           </Typography.Text>
//                         </Flex>
//                       ))}
//                     </Flex>
//                   </Card>
//                   <Flex justify="space-between" align="center" gap={12} wrap style={{ paddingTop: 10, borderTop: '1px solid var(--border-default)' }}>
//                     <span>
//                       <Typography.Text style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--kr-red-700)' }}>
//                         {a.pctText}
//                       </Typography.Text>{' '}
//                       <Typography.Text type="secondary" style={{ fontSize: 13 }}>{a.diffText}</Typography.Text>
//                     </span>
//                     {a.hasTrip && (
//                       <Button type="link" size="small" onClick={() => navTo('trip', { selectedTrip: a.trip })} style={{ paddingInline: 0 }}>
//                         View trip &rarr;
//                       </Button>
//                     )}
//                   </Flex>
//                 </Flex>
//               </Card>
//             </Col>
//           ))}
//         </Row>
//       </Flex>

//       {/* Closed Trips Comparison Table */}
//       <Card
//         title={<Typography.Title level={2} style={sectionTitle}>Distance comparison · closed trips</Typography.Title>}
//         extra={
//           <Input
//             className="tms-search"
//             prefix={<Search size={16} strokeWidth={2} />}
//             allowClear
//             placeholder="Search vehicle, trip, route or branch"
//             value={distQ}
//             onChange={(e) => setDistQ(e.target.value)}
//             style={{ width: 320, maxWidth: '100%' }}
//           />
//         }
//         styles={{ header: { flexWrap: 'wrap', gap: 12, paddingBlock: 12 }, body: { padding: 0 } }}
//       >
//         <Table
//           columns={distColumns}
//           dataSource={distRows}
//           rowKey="id"
//           tableLayout="auto"
//           scroll={{ x: 960 }}
//           locale={{ emptyText: <Typography.Text type="secondary">No trips match this search.</Typography.Text> }}
//           pagination={
//             distRows.length > 0 && {
//               current: distPage,
//               pageSize: distPageSize,
//               onChange: (p, size) => { setDistPage(p); setDistPageSize(size); },
//               showSizeChanger: true,
//               pageSizeOptions: [10, 20, 50, 100],
//               showTotal: (t, [a, b]) => `Showing ${a} to ${b} of ${t} trips`,
//             }
//           }
//         />
//       </Card>
//     </Flex>
//   );
// };

// export default DistanceVariation;
