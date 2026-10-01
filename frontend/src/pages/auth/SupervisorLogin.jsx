import React from 'react';
import { Alert, Button, Flex, Form, Input, Typography } from 'antd';
import logoImg from '@/assets/images/logo-1600.png';

export const SupervisorLogin = ({ v }) => (
  <>
    <Flex vertical style={{ flex: 1, padding: 'calc(40px + env(safe-area-inset-top)) 24px 40px' }}>
      <img src={logoImg} alt="Kongunadu Road Lines" style={{ height: 44, width: 'auto', alignSelf: 'flex-start' }} />
      <Typography.Text strong style={{ marginTop: 36, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-brand)' }}>
        Transport Management System
      </Typography.Text>
      <Typography.Title level={2} style={{ margin: '6px 0 0', lineHeight: 1.1 }}>
        Supervisor sign in
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ margin: '8px 0 28px', fontSize: 15 }}>Your branch is set from your account. Trips you open are recorded against it.</Typography.Paragraph>
      {v.loginError ? (
        <>
          <Alert type="error" title={v.loginErrText} style={{ marginBottom: 16 }} />
        </>
      ) : null}
      <Form layout="vertical" requiredMark={false} component="div">
        {/* Sign in with either the mobile number or the email set in the Supervisor Master. */}
        <Form.Item label="Mobile number / Email">
          <Input
            size="large"
            value={v.loginPhone ?? ''}
            onChange={v.setLoginPhone}
            prefix={/[a-z@]/i.test(v.loginPhone || '') ? undefined : '+91'}
            placeholder="98410 22314 or name@transport.example"
            autoComplete="username"
          />
        </Form.Item>
        <Form.Item label="Password" style={{ marginBottom: 0 }}>
          <Input.Password size="large" value={v.loginPassword ?? ''} onChange={v.setLoginPassword} autoComplete="current-password" />
        </Form.Item>
      </Form>
      <Flex vertical gap={12} style={{ marginTop: 28 }}>
        {v.loginLoading ? (
          <>
            <Button type="primary" size="large" block loading style={v.bigBtn}>
              Signing in
            </Button>
          </>
        ) : null}
        {v.loginIdle ? (
          <>
            <Button type="primary" size="large" block onClick={v.doLogin} style={v.bigBtn}>Sign in</Button>
          </>
        ) : null}
        <Button type="text" size="large" block onClick={v.loginFail}>Forgot password</Button>
      </Flex>
      <Typography.Text type="secondary" style={{ marginTop: 'auto', paddingTop: 24, fontSize: 13 }}>
        Session expires after 12 hours of inactivity. OTP login is planned for a later phase.
      </Typography.Text>
    </Flex>
  </>
);

export const Login = SupervisorLogin;
export default SupervisorLogin;
