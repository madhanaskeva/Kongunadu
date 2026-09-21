import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, KeyRound, RotateCcw } from 'lucide-react';
import Button from '../common/Button';
import FormInput from '../forms/FormInput';

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

  const handleSubmit = (e) => {
    e.preventDefault();
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
          Enter verification code
        </h2>
        <div style={{ marginTop: '6px', fontSize: '14px', color: 'var(--text-muted, #7c7c76)', lineHeight: 1.5 }}>
          We sent a 6-digit verification OTP to{' '}
          <strong style={{ color: 'var(--text-heading, #1c1c1a)' }}>{email}</strong>
          {onChangeEmail && (
            <button
              type="button"
              onClick={onChangeEmail}
              style={{
                all: 'unset',
                cursor: 'pointer',
                marginLeft: '8px',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-brand, #00623f)',
                textDecoration: 'underline',
              }}
            >
              Change
            </button>
          )}
        </div>
      </div>

      {/* Demo helper pill */}
      {demoOtp && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '10px 14px',
            backgroundColor: 'var(--color-brand-tint, #edf8f3)',
            border: '1px solid var(--kr-green-200, #bfe4d3)',
            borderRadius: 'var(--radius-md, 8px)',
            fontSize: '13px',
            color: 'var(--kr-green-900, #003021)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="var(--color-brand, #00623f)" />
            <span>
              Demo OTP code:{' '}
              <strong style={{ fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.1em', fontSize: '15px' }}>
                {demoOtp}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            style={{
              all: 'unset',
              cursor: 'pointer',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-brand, #00623f)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            Auto-fill
          </button>
        </div>
      )}

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
          label="6-Digit Verification Code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={otp}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
            setOtp(val);
            setLocalError('');
          }}
          placeholder="e.g. 482910"
          icon={KeyRound}
          required
          autoFocus
          style={{ letterSpacing: '0.15em', fontFamily: 'var(--font-mono, monospace)' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-muted, #7c7c76)' }}>Didn't receive the code?</span>
          {countdown > 0 ? (
            <span style={{ color: 'var(--text-muted, #7c7c76)', fontWeight: 600 }}>
              Resend in {countdown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              style={{
                all: 'unset',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 700,
                color: 'var(--text-brand, #00623f)',
              }}
            >
              <RotateCcw size={14} />
              <span>Resend OTP</span>
            </button>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          style={{ marginTop: '8px' }}
        >
          Verify & Continue
        </Button>
      </form>
    </div>
  );
};

export default VerifyOtpForm;

