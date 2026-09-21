import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import Button from '../common/Button';
import FormInput from '../forms/FormInput';

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

  const handleSubmit = (e) => {
    e.preventDefault();
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
          Reset your password
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--text-muted, #7c7c76)', lineHeight: 1.5 }}>
          Enter the registered email associated with your account. We will send a 6-digit OTP verification code.
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
          label="Registered Email Address"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setLocalError('');
          }}
          placeholder="e.g. admin@transport.example"
          icon={Mail}
          required
          autoFocus
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          style={{ marginTop: '8px' }}
        >
          Send Verification OTP
        </Button>
      </form>

      <div style={{ textAlign: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-default, #d5dfda)' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted, #7c7c76)' }}>
          Remember your password?{' '}
          <button
            type="button"
            onClick={onBack}
            style={{
              all: 'unset',
              cursor: 'pointer',
              fontWeight: 700,
              color: 'var(--text-brand, #00623f)',
            }}
          >
            Sign in
          </button>
        </span>
      </div>
    </div>
  );
};

export default RequestOtpForm;

