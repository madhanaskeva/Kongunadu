import React, { useState } from 'react';
import { ArrowLeft, Check, Lock, ShieldCheck } from 'lucide-react';
import Button from '../common/Button';
import FormInput from '../forms/FormInput';

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

  const handleSubmit = (e) => {
    e.preventDefault();
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <button
          type="button"
          onClick={onBack}
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-muted, #7c7c76)',
            marginBottom: '12px',
            transition: 'color var(--dur-fast, 0.15s)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-brand, #00623f)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted, #7c7c76)')}
        >
          <ArrowLeft size={16} />
          <span>Back to login</span>
        </button>

        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '28px',
            color: 'var(--kr-green-900, #003021)',
          }}
        >
          Set new password
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--text-muted, #7c7c76)', lineHeight: 1.5 }}>
          Your verification was successful for <strong style={{ color: 'var(--text-heading, #1c1c1a)' }}>{email}</strong>.
          Create a new password below.
        </p>
      </div>

      {displayError && (
        <div
          role="alert"
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--kr-red-50, #fdf3f2)',
            border: '1px solid var(--kr-red-100, #fbe0e0)',
            borderRadius: 'var(--radius-md, 8px)',
            color: 'var(--kr-red-800, #b31114)',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormInput
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setLocalError('');
          }}
          placeholder="At least 6 characters"
          icon={Lock}
          required
          autoFocus
        />

        <div>
          <FormInput
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setLocalError('');
            }}
            placeholder="Re-enter your new password"
            icon={Lock}
            required
          />
          {isMatch && (
            <div
              style={{
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--status-success, #0b7e52)',
              }}
            >
              <Check size={14} />
              <span>Passwords match</span>
            </div>
          )}
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted, #7c7c76)', lineHeight: 1.5 }}>
          Password must be at least 6 characters. Use letters, numbers, and symbols for better security.
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          style={{ marginTop: '8px' }}
        >
          Reset Password
        </Button>
      </form>
    </div>
  );
};

export default ResetPasswordForm;

