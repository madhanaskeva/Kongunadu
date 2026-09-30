import React from 'react';
import { Button, Result, Typography } from 'antd';

/**
 * ResetPasswordSuccess — Step 4 of Forgot Password
 * Success screen confirming password has been reset.
 */
export const ResetPasswordSuccess = ({
  email = '',
  onLogin,
}) => {
  return (
    <Result
      status="success"
      style={{ padding: '16px 0' }}
      title="Password reset successful!"
      subTitle={
        <>
          Your password for <Typography.Text strong>{email}</Typography.Text> has been updated. You can now log in to the portal using your new password.
        </>
      }
      extra={
        <Button type="primary" size="large" block onClick={onLogin}>
          Back to Login
        </Button>
      }
    />
  );
};

export default ResetPasswordSuccess;
