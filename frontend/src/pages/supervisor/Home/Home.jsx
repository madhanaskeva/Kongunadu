import React from 'react';
import { Avatar, Card, Flex, Typography } from 'antd';
import { ArrowRight, Bell, CalendarCheck, Check, History } from 'lucide-react';
import { ENROUTE_LABEL_LOWER } from '../../../utils/tripStatus';

const { Text } = Typography;

// Enter / Space activate a tile, as the old <button> tiles did.
const tileKey = (fn) => (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); } };

export const Home = ({ v }) => (
  <>
    <Flex vertical gap={16} style={{ flex: 1, padding: "20px 16px 32px" }}>
      <Flex justify="space-between" align="baseline" gap={8} wrap>
        <Text type="secondary">{v.todayLong}</Text>
        <Text strong>{v.activeCount} {v.tripWord} {ENROUTE_LABEL_LOWER}</Text>
      </Flex>
      <Card hoverable role="button" tabIndex={0} onClick={v.goAttMark} onKeyDown={tileKey(v.goAttMark)} className="sv-home-tile sv-home-tile--tint">
        <Flex align="center" gap={14}>
          <Avatar shape="square" size={44} className="sv-home-tile-icon" icon={<CalendarCheck size={24} strokeWidth={2.2} />} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sv-home-tile-title sv-home-tile-title--sm">Attendance</div>
            <Text className="sv-home-tile-sub">{v.attendanceMarked} of {v.attendanceTotal} drivers marked today</Text>
          </div>
          <ArrowRight size={24} strokeWidth={2.5} color="var(--color-brand)" />
        </Flex>
      </Card>
      <Card hoverable role="button" tabIndex={0} onClick={v.goOpen} onKeyDown={tileKey(v.goOpen)} className="sv-home-tile sv-home-tile--solid">
        <Flex align="center" justify="space-between" gap={16}>
          <div>
            <div className="sv-home-tile-title">Open Trip</div>
            <Text className="sv-home-tile-sub">Truck loaded. Start a new trip.</Text>
          </div>
          <ArrowRight size={28} strokeWidth={2.5} />
        </Flex>
      </Card>
      <Card hoverable role="button" tabIndex={0} onClick={v.goCloseList} onKeyDown={tileKey(v.goCloseList)} className="sv-home-tile sv-home-tile--tint">
        <Flex align="center" justify="space-between" gap={16}>
          <div>
            <div className="sv-home-tile-title">Close Trip</div>
            <Text className="sv-home-tile-sub">Unloading done. Record closing details.</Text>
          </div>
          <Check size={28} strokeWidth={2.5} />
        </Flex>
      </Card>
      <Card hoverable role="button" tabIndex={0} onClick={v.goUnclosed} onKeyDown={tileKey(v.goUnclosed)} className="sv-home-tile sv-home-tile--solid">
        <Flex align="center" justify="space-between" gap={16}>
          <div>
            <div className="sv-home-tile-title">Unclosed Trips</div>
            <Text className="sv-home-tile-sub">{v.unclosedHint}</Text>
          </div>
          <span className="sv-home-tile-title sv-home-tile-count">{v.activeCount}</span>
        </Flex>
      </Card>
      <Card hoverable role="button" tabIndex={0} onClick={v.goHistory} onKeyDown={tileKey(v.goHistory)} className="sv-home-tile sv-home-tile--tint">
        <Flex align="center" justify="space-between" gap={16}>
          <div>
            <div className="sv-home-tile-title">Trip History</div>
            <Text className="sv-home-tile-sub">{v.histHomeHint}</Text>
          </div>
          <History size={30} strokeWidth={2.4} color="var(--color-brand)" aria-hidden="true" />
        </Flex>
      </Card>
      <Card hoverable role="button" tabIndex={0} onClick={v.goNotifications} onKeyDown={tileKey(v.goNotifications)} className="sv-home-tile sv-home-tile--solid">
        <Flex align="center" justify="space-between" gap={16}>
          <div>
            <div className="sv-home-tile-title">Notifications</div>
            <Text className="sv-home-tile-sub">{v.notifHomeHint}</Text>
          </div>
          <Bell size={28} strokeWidth={2.4} aria-hidden="true" />
        </Flex>
      </Card>
    </Flex>
  </>
);

export default Home;
