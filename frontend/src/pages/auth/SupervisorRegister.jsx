import React from 'react';
import { Button, Flex, Form, Input, Typography } from 'antd';
import logoImg from '@/assets/images/logo-1600.png';

export const SupervisorRegister = ({ v }) => (
  <>
    <Flex vertical style={{ flex: 1, padding: 'calc(40px + env(safe-area-inset-top)) 24px 40px' }}>
      <Flex align="center" gap={12}><img src={logoImg} alt="" style={{ height: 44, width: 'auto' }} /></Flex>
      <Typography.Title level={4} style={{ margin: '10px 0 0' }}>
        Kongunadu Road Lines
      </Typography.Title>
      <Typography.Title level={2} style={{ margin: '28px 0 0', lineHeight: 1.1 }}>
        Register
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ margin: '8px 0 24px', fontSize: 15 }}>Create your supervisor account. You sign in with this mobile number and password.</Typography.Paragraph>
      <Form layout="vertical" requiredMark={false} component="div">
        <Form.Item label="Name" validateStatus={v.regErr.name ? 'error' : undefined} help={v.regErr.name || undefined}>
          <Input size="large" placeholder="Full name" value={v.reg.name ?? ''} onChange={v.setRegName} />
        </Form.Item>
        <Form.Item label="Phone number" help="Approved by Head Office for this device.">
          <Input size="large" value={v.obPhoneText ?? ''} prefix="+91" inputMode="numeric" disabled readOnly />
        </Form.Item>
        <Form.Item label="Password" validateStatus={v.regErr.password ? 'error' : undefined} help={v.regErr.password || v.regPasswordHint} style={{ marginBottom: 0 }}>
          <Input.Password size="large" placeholder="At least 6 characters" value={v.reg.password ?? ''} onChange={v.setRegPassword} />
        </Form.Item>
      </Form>
      <Flex vertical gap={8} style={{ marginTop: 'auto', paddingTop: 28 }}>
        {v.regSaving ? (
          <>
            <Button type="primary" size="large" block loading style={v.bigBtn}>
              Registering
            </Button>
          </>
        ) : null}
        {v.regIdle ? (
          <>
            <Button type="primary" size="large" block onClick={v.doRegister} style={v.bigBtn}>Register</Button>
          </>
        ) : null}
      </Flex>
    </Flex>
  </>
);

export const Register = SupervisorRegister;
export default SupervisorRegister;
