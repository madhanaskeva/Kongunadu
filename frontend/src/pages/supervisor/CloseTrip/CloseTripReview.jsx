import React from 'react';
import { Alert, Button, Card, Descriptions, Flex, Typography } from 'antd';

export const CloseTripReview = ({ v }) => (
  <>
    <Flex vertical style={{ flex: 1 }}>
      <Flex vertical gap={16} style={{ padding: 16 }}>
        <Typography.Paragraph style={{ margin: 0, fontSize: 15 }}>Check the details before closing. Once closed, the trip is locked and the vehicle is free for the next assignment.</Typography.Paragraph>
        {(v.closeSummary || []).map((sec, secIdx) => (
          <React.Fragment key={secIdx}>
            <Descriptions
              title={<Typography.Text type="secondary" strong style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{sec.title}</Typography.Text>}
              bordered
              column={1}
              size="small"
              items={(sec.rows || []).map((r, rIdx) => ({
                key: rIdx,
                label: r.k,
                children: <Typography.Text strong style={{ overflowWrap: 'anywhere' }}>{r.v}</Typography.Text>,
                styles: r.bg ? { label: { background: r.bg }, content: { background: r.bg } } : undefined,
              }))}
            />
          </React.Fragment>
        ))}
        {v.hasClosePhotos ? (
          <>
            <div>
              <Typography.Text type="secondary" strong style={{ display: 'block', marginBottom: 6, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Odometer photos
              </Typography.Text>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
                {(v.closePhotos || []).map((ph, phIdx) => (
                  <React.Fragment key={phIdx}>
                    <Card
                      size="small"
                      styles={{ body: { padding: '6px 8px' } }}
                      cover={
                        <div aria-hidden="true" style={{ height: 96, background: 'var(--surface-muted)', overflow: 'hidden' }}>
                          {ph.url ? (
                            <>
                              <img src={ph.url} alt="" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
                            </>
                          ) : null}
                        </div>
                      }
                    >
                      <Typography.Text style={{ fontSize: 12 }}>{ph.caption}</Typography.Text>
                    </Card>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </>
        ) : null}
        <Alert
          type={v.verify.bg === 'var(--color-hazard-soft)' ? 'warning' : 'success'}
          title={
            <span>
              <strong>{v.closeReviewHead}</strong>
              {' '}{v.closeReviewNote}
            </span>
          }
        />
      </Flex>
      <Flex vertical gap={8} style={{ position: 'sticky', bottom: 0, marginTop: 'auto', padding: '12px 16px 40px', background: '#fff', borderTop: '1px solid var(--border-default)' }}>
        <Button type="primary" size="large" block onClick={v.confirmClose} style={v.bigBtn}>Confirm and close trip</Button>
        <Button type="text" size="large" block onClick={v.back}>Edit details</Button>
      </Flex>
    </Flex>
  </>
);

export default CloseTripReview;
