import React from 'react';
import { Card, Flex, Progress, Result, Tag, Typography } from 'antd';
import { ENROUTE_LABEL_LOWER } from '../../../utils/tripStatus';

const { Text } = Typography;

export const UnclosedTrips = ({ v }) => (
  <>
    <Flex vertical gap={12} style={{ flex: 1, padding: 16 }}>
      {(v.unclosedList || []).map((t, tIdx) => (
        <React.Fragment key={tIdx}>
          <Card
            size="small"
            hoverable
            role="button"
            tabIndex={0}
            data-id={t.id}
            onClick={v.openTripDetail}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); v.openTripDetail(e); } }}
            className="sv-edge-card"
            style={{ borderLeftColor: t.edge }}
          >
            <Flex justify="space-between" align="center" gap={8}>
              <Text code strong style={{ fontSize: 15 }}>{t.number}</Text>
              <Tag color={t.badgeColor} className="sv-tag">{t.badge}</Tag>
            </Flex>
            <Text strong style={{ display: "block", marginTop: 6, fontSize: 15 }}>{t.crewLine}</Text>
            <Text type="secondary">{t.routeLine}</Text>
            <Progress percent={parseFloat(t.progress) || 0} showInfo={false} size="small" style={{ margin: "8px 0 0" }} />
            <Flex justify="space-between" gap={8}>
              <Text type="secondary" style={{ fontSize: 13 }}>{t.gpsKm} of {t.fixedKm} km by GPS</Text>
              <Text type="secondary" style={{ fontSize: 13 }}>{t.hoursOpen} h open</Text>
            </Flex>
            {t.subStatus && (
              <div style={{ marginTop: 8 }}>
                <Tag color={t.subStatusColor} className="sv-tag">
                  {t.subStatus}
                </Tag>
              </div>
            )}
          </Card>
        </React.Fragment>
      ))}
      {v.unclosedEmpty ? (
        <>
          <Result
            status="success"
            title="All trips closed"
            subTitle={`Nothing is ${ENROUTE_LABEL_LOWER} for ${v.branchName}. Trips you open will appear here until they are closed.`}
          />
        </>
      ) : null}
    </Flex>
  </>
);

export default UnclosedTrips;
