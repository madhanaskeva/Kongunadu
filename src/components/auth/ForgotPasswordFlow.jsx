import React, { useState } from 'react';
import { RequestOtpForm } from './RequestOtpForm';
import { VerifyOtpForm } from './VerifyOtpForm';
import { ResetPasswordForm } from './ResetPasswordForm';
import { ResetPasswordSuccess } from './ResetPasswordSuccess';

/**
 * ForgotPasswordFlow
 * Orchestrates the complete end-to-end forgot password flow:
 * 1. Request OTP via email (RequestOtpForm)
 * 2. Enter & verify 6-digit OTP (VerifyOtpForm)
 * 3. Enter & confirm new password (ResetPasswordForm)
 * 4. Password reset success confirmation (ResetPasswordSuccess)
 */
export const ForgotPasswordFlow = ({
  initialEmail = '',
  role = 'admin',
  onBack,
  onSuccess,
}) => {
  const [step, setStep] = useState('request_otp'); // 'request_otp' | 'verify_otp' | 'reset_password' | 'success'
  const [email, setEmail] = useState(initialEmail);
  const [demoOtp, setDemoOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper to generate a random 6-digit OTP
  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Step 1: Submit email to request OTP
  const handleRequestOtp = async (submittedEmail) => {
    setLoading(true);
    setError('');
    setEmail(submittedEmail);

    try {
      // Simulate network request to send OTP email
      await new Promise((resolve) => setTimeout(resolve, 650));
      const code = generateOtp();
      setDemoOtp(code);
      setStep('verify_otp');
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    setLoading(true);
    setError('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newCode = generateOtp();
      setDemoOtp(newCode);
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (enteredOtp) => {
    setLoading(true);
    setError('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 550));
      if (enteredOtp !== demoOtp) {
        setError('Incorrect verification code. Please check the code and try again.');
        return;
      }
      // OTP verified successfully
      setStep('reset_password');
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async ({ newPassword }) => {
    setLoading(true);
    setError('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 700));

      // Persist new password to localStorage for local testing & real login
      try {
        const raw = localStorage.getItem('krl_custom_passwords');
        const customPasswords = raw ? JSON.parse(raw) : {};
        customPasswords[email.toLowerCase().trim()] = newPassword;
        localStorage.setItem('krl_custom_passwords', JSON.stringify(customPasswords));
      } catch (storageErr) {
        console.warn('Could not persist updated password to localStorage:', storageErr);
      }

      setStep('success');
      if (onSuccess) {
        onSuccess({ email, newPassword });
      }
    } catch (err) {
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepNumbers = {
    request_otp: 1,
    verify_otp: 2,
    reset_password: 3,
    success: 3,
  };

  const currentStepNum = stepNumbers[step] || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Step Indicator (when not on success) */}
      {step !== 'success' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '14px',
            borderBottom: '1px solid var(--border-subtle, #f0f0ee)',
          }}
        >
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {[1, 2, 3].map((num) => {
              const isCompleted = num < currentStepNum;
              const isCurrent = num === currentStepNum;
              return (
                <div
                  key={num}
                  style={{
                    width: num === currentStepNum ? '28px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: isCurrent
                      ? 'var(--color-brand, #00623f)'
                      : isCompleted
                      ? 'var(--color-brand-tint, #edf8f3)'
                      : 'var(--border-subtle, #e5e5e3)',
                    transition: 'all 0.25s ease',
                  }}
                  title={`Step ${num}`}
                />
              );
            })}
          </div>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text-muted, #7c7c76)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Step {currentStepNum} of 3
          </span>
        </div>
      )}

      {/* Step Views */}
      {step === 'request_otp' && (
        <RequestOtpForm
          initialEmail={email}
          onSubmit={handleRequestOtp}
          onBack={onBack}
          loading={loading}
          error={error}
          role={role}
        />
      )}

      {step === 'verify_otp' && (
        <VerifyOtpForm
          email={email}
          demoOtp={demoOtp}
          onSubmit={handleVerifyOtp}
          onResend={handleResendOtp}
          onChangeEmail={() => {
            setError('');
            setStep('request_otp');
          }}
          onBack={() => {
            setError('');
            setStep('request_otp');
          }}
          loading={loading}
          error={error}
        />
      )}

      {step === 'reset_password' && (
        <ResetPasswordForm
          email={email}
          onSubmit={handleResetPassword}
          onBack={() => {
            setError('');
            setStep('verify_otp');
          }}
          loading={loading}
          error={error}
        />
      )}

      {step === 'success' && (
        <ResetPasswordSuccess
          email={email}
          onLogin={onBack}
        />
      )}
    </div>
  );
};

export default ForgotPasswordFlow;

