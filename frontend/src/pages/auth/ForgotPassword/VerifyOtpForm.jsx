import React, { useEffect, useState } from 'react';
import { Alert, Button, Flex, Form, Input, Typography } from 'antd';
import { ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';

/**
 * VerifyOtpForm — Step 2 of Forgot Password
 * Accepts 6-digit OTP code with resend timer and demo helper.
 */
export const VerifyOtpForm = ({
  email = '',
  demoOtp = '',
  onSubmit,
  onResend,
  onChangeEmail,
  onBack,
  loading = false,
  error = '',
}) => {
  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState('');
  const [countdown, setCountdown] = useState(30);

  // 30 second resend timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = () => {
    if (countdown > 0) return;
    setCountdown(30);
    setOtp('');
    setLocalError('');
    if (onResend) {
      onResend();
    }
  };

  // Called from antd Form onFinish (antd prevents the native submission).
  const handleSubmit = () => {
    setLocalError('');

    const clean = otp.trim();
    if (!clean) {
      setLocalError('Please enter the 6-digit verification code.');
      return;
    }

    if (clean.length !== 6 || !/^\d{6}$/.test(clean)) {
      setLocalError('Verification code must be exactly 6 digits.');
      return;
    }

    if (onSubmit) {
      onSubmit(clean);
    }
  };

  const handleFillDemo = () => {
    if (demoOtp) {
      setOtp(demoOtp);
      setLocalError('');
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
          Enter verification code
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ margin: '6px 0 0' }}>
          We sent a 6-digit verification OTP to{' '}
          <Typography.Text strong>{email}</Typography.Text>
          {onChangeEmail && (
            <Button type="link" size="small" onClick={onChangeEmail}>
              Change
            </Button>
          )}
        </Typography.Paragraph>
      </div>

      {/* Demo helper pill */}
      {demoOtp && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircle2 size={16} />}
          title={
            <span>
              Demo OTP code: <Typography.Text strong code>{demoOtp}</Typography.Text>
            </span>
          }
          action={
            <Button type="primary" size="small" onClick={handleFillDemo}>
              Auto-fill
            </Button>
          }
        />
      )}

      {displayError && <Alert type="error" showIcon title={displayError} />}

      <Form layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="6-Digit Verification Code"
          required
          validateStatus={displayError ? 'error' : undefined}
        >
          {/* Input.OTP: one box per digit; the cells are joined back into the same
              6-digit string in `otp`. Non-digits are dropped by the formatter
              (spaces are antd's empty-cell placeholders, so they are kept). */}
          <Input.OTP
            length={6}
            value={otp}
            inputMode="numeric"
            formatter={(val) => val.replace(/[^\d ]/g, '')}
            onInput={(cells) => {
              const val = cells.join('').replace(/\D/g, '').slice(0, 6);
              setOtp(val);
              setLocalError('');
            }}
            autoFocus
          />
        </Form.Item>

        <Flex justify="space-between" align="center" wrap gap={8} style={{ marginBottom: 24 }}>
          <Typography.Text type="secondary">Didn't receive the code?</Typography.Text>
          {countdown > 0 ? (
            <Typography.Text type="secondary" strong>
              Resend in {countdown}s
            </Typography.Text>
          ) : (
            <Button type="link" size="small" icon={<RotateCcw size={14} />} onClick={handleResend}>
              Resend OTP
            </Button>
          )}
        </Flex>

        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
          Verify & Continue
        </Button>
      </Form>
    </Flex>
  );
};

export default VerifyOtpForm;
