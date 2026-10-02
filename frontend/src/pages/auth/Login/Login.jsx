import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Form, Input, Typography } from 'antd';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { ForgotPasswordFlow } from '../ForgotPassword';
import logoImg from '@/assets/images/logo-1600.png';
import loginHero from '@/assets/images/login-hero.png';

export const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Called from antd Form onFinish (submit button click or Enter in a field);
  // antd already prevents the native form submission.
  const handleSubmit = async () => {
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
        .krl-login { display: grid; grid-template-columns: 42% 1fr; height: 100vh; background: #ffffff; }
        .krl-login-image { position: relative; height: 100vh; background: #0f2f4a url(${loginHero}) center 48% / cover no-repeat; }
        .krl-login-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(4,20,38,0) 72%, rgba(4,20,38,0.35) 86%, rgba(4,20,38,0.7) 100%); }
        .krl-login-caption { position: absolute; left: 40px; right: 40px; bottom: 36px; color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.45); }
        .krl-login-caption > div { font-family: var(--font-display); font-size: 12px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; }
        .krl-login-caption > p { margin: 8px 0 0; font-size: 15px; opacity: 0.9; max-width: 440px; line-height: 1.6; }
        .krl-login-form {
          display: flex; align-items: center; justify-content: center; padding: 48px 40px; overflow-y: auto;
          background:
            radial-gradient(circle at 100% 0%, rgba(39, 94, 116, 0.20), transparent 45%),
            radial-gradient(circle at 0% 100%, rgba(33, 79, 99, 0.14), transparent 45%),
            linear-gradient(135deg, #eef5f7 0%, #f8faff 50%, #e8f0ff 100%);
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
        .krl-login-logo { width: 240px; max-width: 100%; height: auto; align-self: flex-start; }
        @media (max-width: 900px) {
          .krl-login { grid-template-columns: 1fr; height: auto; min-height: 100vh; }
          .krl-login-image { width: 100%; height: 380px; max-height: 48vh; background-position: center top; background-size: cover; }
          .krl-login-caption { left: 16px; right: 16px; bottom: 14px; }
          .krl-login-caption > div { font-size: 10px; letter-spacing: 0.16em; }
          .krl-login-caption > p { font-size: 12.5px; line-height: 1.45; margin-top: 4px; }
          .krl-login-form { padding: 24px 16px 48px; }
          .krl-login-card { padding: 36px 20px 28px; }
        }
        @media (max-width: 480px) {
          .krl-login-image { height: 280px; max-height: 38vh; background-position: center top; }
          .krl-login-form { padding: 16px 12px 36px; }
          .krl-login-card { padding: 26px 16px 20px; border-radius: 16px; gap: 18px; }
          .krl-login-logo { width: 190px; }
        }
      `}</style>

      {/* Image Column */}
      <div className="krl-login-image">
        <div className="krl-login-shade" />
        <div className="krl-login-caption">
          <div>Connecting industry. Delivering reliability.</div>
          <p>Reliable bulk transportation solutions supporting India's energy and industrial supply chains.</p>
        </div>
      </div>

      {/* Login Form Column */}
      <div className="krl-login-form">
        <div className="krl-login-card">
          <img src={logoImg} alt="Kongunadu Road Lines" className="krl-login-logo" />
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
                <Typography.Title level={2} style={{ margin: 0 }}>
                  Welcome Back
                </Typography.Title>
                <Typography.Text type="secondary">Sign in with your account to continue.</Typography.Text>
              </div>

              {/* Success Notification after password reset */}
              {successMessage && <Alert type="success" showIcon title={successMessage} />}

              {formError && <Alert type="error" showIcon title={formError} />}

              <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
                <Form.Item label="Email Address" required validateStatus={formError ? 'error' : undefined}>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    autoComplete="off"
                    prefix={<Mail size={18} />}
                  />
                </Form.Item>
                <Form.Item label="Password" required validateStatus={formError ? 'error' : undefined}>
                  <Input.Password
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    prefix={<Lock size={18} />}
                  />
                </Form.Item>
                <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                  Sign in
                </Button>
              </Form>

              <div>
                <Button
                  type="link"
                  style={{ padding: 0 }}
                  onClick={() => {
                    setIsForgotPassword(true);
                    setFormError('');
                    setSuccessMessage('');
                  }}
                >
                  Forgot password?
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
