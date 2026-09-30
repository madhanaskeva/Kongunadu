import React, { useState } from 'react';
import { Alert, Button, Flex, Form, Input, Typography } from 'antd';
import { ArrowLeft, Check, Lock } from 'lucide-react';

/**
 * ResetPasswordForm — Step 3 of Forgot Password
 * Accepts new password and confirmation, validates match & criteria.
 */
export const ResetPasswordForm = ({
  email = '',
  onSubmit,
  onBack,
  loading = false,
  error = '',
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  // Called from antd Form onFinish (antd prevents the native submission).
  const handleSubmit = () => {
    setLocalError('');

    if (!newPassword) {
      setLocalError('Please enter your new password.');
      return;
    }

    if (newPassword.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    if (!confirmPassword) {
      setLocalError('Please confirm your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match. Please re-enter.');
      return;
    }

    if (onSubmit) {
      onSubmit({ newPassword, confirmPassword });
    }
  };

  const displayError = error || localError;
  const isMatch = newPassword && confirmPassword && newPassword === confirmPassword;

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
          Set new password
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ margin: '6px 0 0' }}>
          Your verification was successful for <Typography.Text strong>{email}</Typography.Text>.
          Create a new password below.
        </Typography.Paragraph>
      </div>

      {displayError && <Alert type="error" showIcon title={displayError} />}

      <Form layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="New Password" required validateStatus={displayError ? 'error' : undefined}>
          <Input.Password
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setLocalError('');
            }}
            placeholder="At least 6 characters"
            prefix={<Lock size={18} />}
            autoFocus
          />
        </Form.Item>

        <Form.Item
          label="Confirm New Password"
          required
          validateStatus={displayError ? 'error' : isMatch ? 'success' : undefined}
          help={
            isMatch ? (
              <Flex align="center" gap={4}>
                <Check size={14} />
                <span>Passwords match</span>
              </Flex>
            ) : undefined
          }
          extra="Password must be at least 6 characters. Use letters, numbers, and symbols for better security."
        >
          <Input.Password
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setLocalError('');
            }}
            placeholder="Re-enter your new password"
            prefix={<Lock size={18} />}
          />
        </Form.Item>

        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
          Reset Password
        </Button>
      </Form>
    </Flex>
  );
};

export default ResetPasswordForm;
