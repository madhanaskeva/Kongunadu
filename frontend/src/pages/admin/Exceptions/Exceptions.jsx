// import React, { useEffect, useState } from 'react';
// import { Eye } from 'lucide-react';
// import { Button, Card, Col, Empty, Flex, Row, Statistic, Table, Tabs, Tag, Tooltip, Typography } from 'antd';
// import { useTMSAdmin } from '../../../context/TMSAdminContext';
//
// export const Exceptions = () => {
//   const {
//     T,
//     excType,
//     setExcType,
//     excStatus,
//     setExcStatus,
//     setExcSel,
//     setExcAssignees,
//     setExcNote,
//     setDrawer,
//     excOverrides,
//   } = useTMSAdmin();
//
//   const tms = T();
//
//   const exceptions = (tms.exceptions || []).map(x => {
//     const o = excOverrides[x.id] || {};
//     const xx = { ...x, ...o };
//     const v = tms.V[xx.vehicle];
//     const tr = tms.T[xx.trip];
//     return {
//       ...xx,
//       vehicleNumber: v ? v.number : '—',
//       tripNumber: tr ? tr.number : '—',
//       branchName: (tms.B[xx.branch] || {}).name || '—',
//     };
//   });
//
//   // Severity → antd Tag preset (red / amber / grey as before).
//   const sevTag = { High: 'error', Medium: 'warning', Low: 'default' };
//
//   const openExc = exceptions.filter(x => x.status !== 'Resolved');
//   const types = ['Hidden kilometres', 'Distance variance', 'Route diversion', 'GPS failure', 'Both sources failed', 'Long open trip', 'Radius breach', 'Missing attendance', 'Idle vehicles'];
//
//   const excTiles = [
//     { type: '', label: 'All open', count: openExc.length },
//     ...types.map(t => ({ type: t, label: t, count: openExc.filter(x => x.type === t).length }))
//   ];
//
//   const statusMap = { open: 'Open', review: 'Under review', resolved: 'Resolved' };
//   const excRows = exceptions.filter(x =>
//     (!excType || x.type === excType) &&
//     (excStatus === 'all' || x.status === statusMap[excStatus])
//   );
//
//   // Back to page 1 whenever the type or status filter changes.
//   const [excPage, setExcPage] = useState(1);
//   const [excPageSize, setExcPageSize] = useState(10);
//   useEffect(() => { setExcPage(1); }, [excType, excStatus, excPageSize]);
//
//   const excTabs = [
//     { value: 'open', label: 'Open', count: exceptions.filter(x => x.status === 'Open').length },
//     { value: 'review', label: 'Under review', count: exceptions.filter(x => x.status === 'Under review').length },
//     { value: 'resolved', label: 'Resolved', count: exceptions.filter(x => x.status === 'Resolved').length },
//     { value: 'all', label: 'All' },
//   ];
//
//   const openException = (x) => {
//     setExcSel(x.id);
//     setExcAssignees(x.assigneeIds || []);
//     setExcNote('');
//     setDrawer({ isException: true, kicker: 'Exception ' + x.id, title: x.type });
//   };
//
//   const nowrap = { whiteSpace: 'nowrap' };
//   const excColumns = [
//     {
//       title: 'Severity',
//       dataIndex: 'severity',
//       key: 'severity',
//       render: v => <Tag color={sevTag[v] || 'default'} style={{ textTransform: 'uppercase', fontWeight: 700 }}>{v}</Tag>,
//     },
//     { title: 'Type', dataIndex: 'type', key: 'type', onCell: () => ({ style: nowrap }), render: v => <Typography.Text strong>{v}</Typography.Text> },
//     {
//       title: 'Vehicle / trip',
//       key: 'vehicle',
//       onCell: () => ({ style: nowrap }),
//       render: (_, x) => (
//         <>
//           <Typography.Text strong style={{ display: 'block' }}>{x.vehicleNumber}</Typography.Text>
//           <Typography.Text type="secondary" style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{x.tripNumber}</Typography.Text>
//         </>
//       ),
//     },
//     { title: 'Detail', dataIndex: 'detail', key: 'detail', onCell: () => ({ style: { minWidth: 240, maxWidth: 340 } }) },
//     { title: 'Branch', dataIndex: 'branchName', key: 'branch', onCell: () => ({ style: nowrap }) },
//     { title: 'Raised', dataIndex: 'raised', key: 'raised', onCell: () => ({ style: nowrap }), render: v => <Typography.Text type="secondary">{v}</Typography.Text> },
//     { title: 'Assignee', dataIndex: 'assignee', key: 'assignee', onCell: () => ({ style: nowrap }) },
//     {
//       title: 'Actions',
//       key: 'actions',
//       align: 'center',
//       render: (_, x) => (
//         <Tooltip title={`View details for ${x.type}`}>
//           <Button type="text" size="small" aria-label={`View details for ${x.type}`} icon={<Eye size={16} />} onClick={() => openException(x)} />
//         </Tooltip>
//       ),
//     },
//   ];
//
//   return (
//     <Flex vertical gap={20}>
//       {/* 10 Exception Category Tiles Grid */}
//       <Row gutter={[12, 12]}>
//         {excTiles.map((k, i) => {
//           const a = excType === k.type;
//           return (
//             <Col key={i} xs={12} md={8} lg={{ flex: '20%' }}>
//               <Card
//                 hoverable
//                 size="small"
//                 role="button"
//                 tabIndex={0}
//                 onClick={() => setExcType(k.type)}
//                 onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExcType(k.type); } }}
//                 style={{ height: '100%', ...(a ? { background: 'var(--color-brand)', borderColor: 'var(--color-brand)' } : {}) }}
//               >
//                 <Statistic
//                   title={k.label}
//                   value={k.count}
//                   groupSeparator=""
//                   styles={{
//                     title: { fontSize: 12, fontWeight: 600, color: a ? 'rgba(255,255,255,.85)' : undefined },
//                     content: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, lineHeight: 1.1, color: a ? '#fff' : 'var(--text-heading)' },
//                   }}
//                 />
//               </Card>
//             </Col>
//           );
//         })}
//       </Row>
//
//       {/* Exceptions Table Card */}
//       <Card styles={{ body: { padding: 0 } }}>
//         {/* Status Tabs */}
//         <Tabs
//           activeKey={excStatus}
//           onChange={setExcStatus}
//           tabBarStyle={{ padding: '0 18px', margin: 0 }}
//           items={excTabs.map(t => ({
//             key: t.value,
//             label: (
//               <>
//                 {t.label}
//                 {t.count !== undefined && <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>({t.count})</Typography.Text>}
//               </>
//             ),
//           }))}
//         />
//
//         <Table
//           columns={excColumns}
//           dataSource={excRows}
//           rowKey="id"
//           tableLayout="auto"
//           scroll={{ x: 820 }}
//           locale={{
//             emptyText: (
//               <Empty
//                 image={Empty.PRESENTED_IMAGE_SIMPLE}
//                 description={
//                   <>
//                     <Typography.Title level={4} style={{ margin: 0 }}>
//                       No {excStatus === 'all' ? '' : statusMap[excStatus]?.toLowerCase()} exceptions
//                     </Typography.Title>
//                     <Typography.Text type="secondary">Nothing of this type needs attention.</Typography.Text>
//                   </>
//                 }
//               />
//             ),
//           }}
//           pagination={
//             excRows.length > 0 && {
//               current: excPage,
//               pageSize: excPageSize,
//               onChange: (p, size) => { setExcPage(p); setExcPageSize(size); },
//               showSizeChanger: true,
//               pageSizeOptions: [10, 20, 50, 100],
//               showTotal: (t, [a, b]) => `Showing ${a} to ${b} of ${t} exceptions`,
//             }
//           }
//         />
//       </Card>
//     </Flex>
//   );
// };
//
// export default Exceptions;
