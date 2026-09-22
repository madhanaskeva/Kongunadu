import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import Button from '../../../components/common/Button';
import FormInput from '../../../components/forms/FormInput';
import { ForgotPasswordFlow } from '../../../components/auth';

export const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }
    const res = await login({ email, password });
    if (res.success) {
      navigate(res.redirect);
    } else {
      setFormError(res.error || 'Incorrect email or password.');
    }
  };

  return (
    <div className="krl-login">
      <style>{`
        .krl-login { display: grid; grid-template-columns: 46% 1fr; height: 100vh; background: #ffffff; }
        .krl-login-image { position: relative; height: 100vh; background: url(/assets/login-hero.png) center 35% / cover no-repeat; }
        .krl-login-form {
          display: flex; align-items: center; justify-content: center; padding: 48px 40px; overflow-y: auto;
          background:
            radial-gradient(circle at 100% 0%, rgba(0, 104, 71, 0.22), transparent 45%),
            radial-gradient(circle at 0% 100%, rgba(218, 37, 29, 0.16), transparent 45%),
            linear-gradient(135deg, #f3f9f6 0%, #ffffff 50%, #fdf3f2 100%);
        }
        .krl-login-card {
          position: relative; width: 100%; max-width: 560px; margin: auto 0; padding: 48px 52px 40px;
          display: flex; flex-direction: column; gap: 24px; box-sizing: border-box;
          background: #ffffff; border-radius: 20px; overflow: hidden;
          box-shadow: 0 24px 60px rgba(0, 60, 40, 0.14), 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .krl-login-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6px;
          background: linear-gradient(90deg, var(--color-brand) 0 65%, var(--kr-red-600) 65% 100%);
        }
        @media (max-width: 900px) {
          .krl-login { grid-template-columns: 1fr; height: auto; min-height: 100vh; }
          .krl-login-image { height: auto; aspect-ratio: 4 / 3; background-position: center 20%; }
          .krl-login-form { padding: 24px 16px 48px; }
          .krl-login-card { padding: 36px 20px 28px; }
        }
      `}</style>

      {/* Image Column */}
      <div className="krl-login-image">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)',
          }}
        />
        <div style={{ position: 'absolute', left: '40px', right: '40px', bottom: '36px', color: '#ffffff' }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
            }}
          >
            Connecting industry. Delivering reliability.
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '15px', opacity: 0.9, maxWidth: '440px', lineHeight: 1.6 }}>
            Reliable bulk transportation solutions supporting India's energy and industrial supply chains.
          </p>
        </div>
      </div>

      {/* Login Form Column */}
      <div className="krl-login-form">
        <div className="krl-login-card">
          <img
            src="/assets/logo-1600.png"
            alt="Kongunadu Road Lines"
            style={{ width: '240px', height: 'auto', alignSelf: 'flex-start' }}
          />
          {isForgotPassword ? (
            <ForgotPasswordFlow
              initialEmail={email}
              onBack={() => {
                setIsForgotPassword(false);
                setFormError('');
              }}
              onSuccess={({ email: resetEmail, newPassword }) => {
                setEmail(resetEmail);
                setPassword(newPassword);
                setSuccessMessage('Password reset successfully! You can now sign in with your new password.');
              }}
            />
          ) : (
            <>
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '34px',
                    color: 'var(--kr-green-900)',
                  }}
                >
                  Welcome Back
                </h2>
                <p style={{ margin: '6px 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
                  Sign in with your account to continue.
                </p>
              </div>

              {/* Success Notification after password reset */}
              {successMessage && (
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: 'var(--color-brand-tint, #edf8f3)',
                    border: '1px solid rgba(0, 98, 63, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-brand, #00623f)',
                    fontSize: '13px',
                    fontWeight: 600,
                    lineHeight: 1.4,
                  }}
                >
                  ✓ {successMessage}
                </div>
              )}

              {formError && (
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: 'var(--kr-red-50)',
                    border: '1px solid var(--kr-red-100)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--kr-red-800)',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <FormInput
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="off"
                  required
                />
                <FormInput
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  style={{ marginTop: '8px' }}
                >
                  Sign in
                </Button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setFormError('');
                  setSuccessMessage('');
                }}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-brand)',
                  alignSelf: 'flex-start',
                }}
              >
                Forgot password?
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
