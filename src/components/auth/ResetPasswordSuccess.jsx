import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';

/**
 * ResetPasswordSuccess — Step 4 of Forgot Password
 * Success screen confirming password has been reset.
 */
export const ResetPasswordSuccess = ({
  email = '',
  onLogin,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px', padding: '16px 0' }}>
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-brand-tint, #edf8f3)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--color-brand, #00623f)',
        }}
      >
        <CheckCircle2 size={36} strokeWidth={2.2} />
      </div>

      <div>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '26px',
            color: 'var(--kr-green-900, #003021)',
          }}
        >
          Password reset successful!
        </h2>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--text-muted, #7c7c76)', lineHeight: 1.5, maxWidth: '380px' }}>
          Your password for <strong style={{ color: 'var(--text-heading, #1c1c1a)' }}>{email}</strong> has been updated. You can now log in to the portal using your new password.
        </p>
      </div>

      <Button
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        onClick={onLogin}
        style={{ marginTop: '8px' }}
      >
        Back to Login
      </Button>
    </div>
  );
};

export default ResetPasswordSuccess;

