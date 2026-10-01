import React from 'react';
import { Alert, Button, Card, Descriptions, Flex, Form, Input, Spin, Typography } from 'antd';
import logoImg from '@/assets/images/logo-1600.png';

// DEV-ONLY: double-click / double-tap the logo to jump straight to Sign In.

export const SupervisorDeviceApproval = ({ v }) => (
  <>
    <Flex vertical style={{ flex: 1, padding: 'calc(40px + env(safe-area-inset-top)) 24px 40px' }}>
      <Flex align="center" gap={12}><img src={logoImg} alt="" onDoubleClick={v.goLogin} style={{ height: 44, width: 'auto', WebkitTapHighlightColor: 'transparent' }} /></Flex>
      <Typography.Title level={4} style={{ margin: '10px 0 0' }}>
        Kongunadu Road Lines
      </Typography.Title>
      <Typography.Title level={2} style={{ margin: '28px 0 0', lineHeight: 1.1 }}>
        Request approval
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ margin: '8px 0 24px', fontSize: 15 }}>Enter your name and mobile number. Head Office approves this phone, assigns your branch and shares a 4-digit OTP with you.</Typography.Paragraph>
      {v.obRejected ? (
        <>
          <Alert type="error" style={{ marginBottom: 16 }} title={`Head Office rejected the request for +91 ${v.obPhoneText}. Check the number and request again.`} />
        </>
      ) : null}
      {v.obEditable ? (
        <>
          <Form layout="vertical" requiredMark={false} component="div">
            <Form.Item label="Full name" validateStatus={v.obNameErr ? 'error' : undefined} help={v.obNameErr || undefined}>
              <Input size="large" placeholder="As on your ID" value={v.ob.name ?? ''} onChange={v.setObName} autoComplete="name" />
            </Form.Item>
            <Form.Item label="Mobile number" validateStatus={v.obPhoneErr ? 'error' : undefined} help={v.obPhoneErr || undefined} style={{ marginBottom: 0 }}>
              <Input size="large" placeholder="98410 22314" value={v.ob.phone ?? ''} onChange={v.setObPhone} prefix="+91" inputMode="numeric" />
            </Form.Item>
          </Form>
        </>
      ) : null}
      {v.obWaiting ? (
        <>
          <Card size="small" style={{ borderTop: '4px solid var(--color-hazard)', overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
            <Flex align="center" gap={12} style={{ padding: 16 }}>
              <Spin />
              <div>
                <Typography.Text strong style={{ display: 'block', fontSize: 16 }}>Waiting for Head Office approval</Typography.Text>
                <Typography.Text type="secondary" style={{ display: 'block', fontSize: 13 }}>You move to OTP entry as soon as it is approved.</Typography.Text>
              </div>
            </Flex>
            <Descriptions
              bordered
              column={1}
              size="small"
              items={[
                { key: 'name', label: 'Name', children: <Typography.Text strong>{v.ob.name}</Typography.Text> },
                { key: 'phone', label: 'Mobile number', children: <Typography.Text strong>+91 {v.obPhoneText}</Typography.Text> },
                { key: 'at', label: 'Requested', children: <Typography.Text strong>{v.obRequestedAt}</Typography.Text> },
              ]}
            />
          </Card>
        </>
      ) : null}
      <Flex vertical gap={8} style={{ marginTop: 'auto', paddingTop: 28 }}>
        {v.obSending ? (
          <>
            <Button type="primary" size="large" block loading style={v.bigBtn}>
              Sending request
            </Button>
          </>
        ) : null}
        {v.obEditable ? (
          <>
            <Button type="primary" size="large" block onClick={v.requestApproval} style={v.bigBtn}>Request approval</Button>
          </>
        ) : null}
        {v.obWaiting ? (
          <>
            <Button size="large" block onClick={v.cancelApproval}>Change mobile number</Button>
          </>
        ) : null}

      </Flex>
    </Flex>
  </>
);

export const DeviceApproval = SupervisorDeviceApproval;
export default SupervisorDeviceApproval;
