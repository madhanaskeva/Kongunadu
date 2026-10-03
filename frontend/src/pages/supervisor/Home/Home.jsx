import React from 'react';
import { Avatar, Card, Col, Flex, Row, Statistic, Typography } from 'antd';
import { ArrowRight, Bell, CalendarCheck, CalendarDays, Check, CircleCheck, History, Navigation, PlusCircle } from 'lucide-react';
import { ENROUTE_LABEL_LOWER } from '../../../utils/tripStatus';

const { Text } = Typography;

// Enter / Space activate a card, as the old <button> tiles did.
const tileKey = (fn) => (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); } };

// Supervisor dashboard, laid out like the Admin Portal dashboard: page head, KPI cards, then the
// quick-action tiles. Every card opens the same screen the original Home tiles did.
export const Home = ({ v }) => {
  const kpis = [
    { label: `Trips ${ENROUTE_LABEL_LOWER}`, value: v.activeCount, sub: v.unclosedHint, icon: Navigation, onClick: v.goUnclosed },
    { label: 'Attendance', value: `${v.attendanceMarked} / ${v.attendanceTotal}`, sub: `${v.attendancePct} of drivers marked today`, icon: CalendarCheck, onClick: v.goAttMark },
    { label: 'Closed trips', value: v.histCount, sub: 'Filter by vehicle or date', icon: CircleCheck, onClick: v.goHistory },
    { label: 'Unread notifications', value: v.notifUnread, sub: `${v.notifTotal} updates and alerts`, icon: Bell, onClick: v.goNotifications },
  ];
  const actions = [
    { title: 'Open Trip', sub: 'Truck loaded. Start a new trip.', icon: <PlusCircle size={26} strokeWidth={2.4} />, onClick: v.goOpen, solid: true },
    { title: 'Close Trip', sub: 'Unloading done. Record closing details.', icon: <Check size={26} strokeWidth={2.5} />, onClick: v.goCloseList },
    { title: 'Unclosed Trips', sub: v.unclosedHint, icon: <span className="sv-home-tile-title sv-home-tile-count">{v.activeCount}</span>, onClick: v.goUnclosed, solid: true },
    { title: 'Attendance', sub: `${v.attendanceMarked} of ${v.attendanceTotal} drivers marked today`, icon: <CalendarCheck size={26} strokeWidth={2.2} />, onClick: v.goAttMark },
    { title: 'Trip History', sub: v.histHomeHint, icon: <History size={26} strokeWidth={2.4} />, onClick: v.goHistory },
    { title: 'Notifications', sub: v.notifHomeHint, icon: <Bell size={26} strokeWidth={2.4} />, onClick: v.goNotifications, solid: true },
  ];

  return (
    <Flex vertical gap={24} className="sv-dash tms-shell">
      <div className="tms-pagehead">
        <div style={{ minWidth: 0 }}>
          <h1>Welcome, {v.supName}</h1>
          <p>{v.branchName} branch · {v.activeCount} {v.tripWord} {ENROUTE_LABEL_LOWER}</p>
        </div>
        <div className="tms-pagehead-date">
          <CalendarDays size={20} color="var(--kr-grey-700)" />
          <span>
            <strong>Today</strong>
            <small>{v.todayLong}</small>
          </span>
        </div>
      </div>

      {/* KPI CARDS */}
      <Row gutter={[16, 16]}>
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <Col key={i} xs={24} sm={12} xl={6}>
              <Card
                hoverable
                role="button"
                tabIndex={0}
                onClick={k.onClick}
                onKeyDown={tileKey(k.onClick)}
                className="tms-kpi tms-kpi--link"
                style={{ height: '100%', '--kpi': 'var(--color-brand)' }}
                styles={{ body: { padding: '14px 16px', height: '100%', display: 'flex', flexDirection: 'column' } }}
              >
                <Statistic
                  title={
                    <Flex justify="space-between" align="flex-start" gap={8}>
                      <Text strong style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--kpi)', lineHeight: 1.35 }}>{k.label}</Text>
                      <Avatar size={30} style={{ flex: 'none' }} icon={<Icon size={16} strokeWidth={2.2} />} />
                    </Flex>
                  }
                  value={k.value}
                  formatter={x => x}
                />
                <Text type="secondary" style={{ fontSize: 12.5, marginTop: 'auto', paddingTop: 8 }}>{k.sub}</Text>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* QUICK ACTIONS · same screens as the original Home tiles */}
      <div>
        <Text strong className="sv-dash-kicker">Quick actions</Text>
        <Row gutter={[16, 16]}>
          {actions.map((a, i) => (
            <Col key={i} xs={24} md={12} xxl={8}>
              <Card
                hoverable
                role="button"
                tabIndex={0}
                onClick={a.onClick}
                onKeyDown={tileKey(a.onClick)}
                className={`sv-home-tile ${a.solid ? 'sv-home-tile--solid' : 'sv-home-tile--tint'}`}
                style={{ height: '100%' }}
              >
                <Flex align="center" justify="space-between" gap={16}>
                  <div style={{ minWidth: 0 }}>
                    <div className="sv-home-tile-title sv-home-tile-title--sm">{a.title}</div>
                    <Text className="sv-home-tile-sub">{a.sub}</Text>
                  </div>
                  <Flex align="center" gap={10} style={{ flex: 'none' }}>
                    {a.icon}
                    <ArrowRight size={22} strokeWidth={2.5} />
                  </Flex>
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

    </Flex>
  );
};

export default Home;
