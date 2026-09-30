import React, { useState } from 'react';
import { Alert, Button, Divider, Flex, Form, Input, Typography } from 'antd';
import { Mail, ArrowLeft } from 'lucide-react';

/**
 * RequestOtpForm — Step 1 of Forgot Password
 * Collects email address and triggers sending of OTP.
 */
export const RequestOtpForm = ({
  initialEmail = '',
  onSubmit,
  onBack,
  loading = false,
  error = '',
  role = 'admin',
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [localError, setLocalError] = useState('');

  // Called from antd Form onFinish (antd prevents the native submission).
  const handleSubmit = () => {
    setLocalError('');

    const trimmed = email.trim();
    if (!trimmed) {
      setLocalError('Please enter your registered email address.');
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    if (onSubmit) {
      onSubmit(trimmed);
    }
  };

  const displayError = error || localError;

  return (
    <Flex vertical gap={20}>
      <div>
        <Button
          color="default"
          variant="link"
          icon={<ArrowLeft size={16} />}
          onClick={onBack}
          style={{ padding: 0, marginBottom: 12 }}
        >
          Back to login
        </Button>

        <Typography.Title level={3} style={{ margin: 0 }}>
          Reset your password
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ margin: '6px 0 0' }}>
          Enter the registered email associated with your account. We will send a 6-digit OTP verification code.
        </Typography.Paragraph>
      </div>

      {displayError && <Alert type="error" showIcon title={displayError} />}

      <Form layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Registered Email Address"
          required
          validateStatus={displayError ? 'error' : undefined}
        >
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setLocalError('');
            }}
            placeholder="e.g. admin@gmail.com"
            prefix={<Mail size={18} />}
            autoFocus
          />
        </Form.Item>

        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
          Send Verification OTP
        </Button>
      </Form>

      <div>
        <Divider style={{ margin: '0 0 8px' }} />
        <Flex justify="center" align="center" wrap>
          <Typography.Text type="secondary">Remember your password?</Typography.Text>
          <Button type="link" size="small" onClick={onBack}>
            Sign in
          </Button>
        </Flex>
      </div>
    </Flex>
  );
};

export default RequestOtpForm;
