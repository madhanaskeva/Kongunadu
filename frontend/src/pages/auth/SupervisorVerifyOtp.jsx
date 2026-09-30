import React from 'react';
import { Alert, Button, Flex, Input, Progress, Typography } from 'antd';
import logoImg from '@/assets/images/logo-1600.png';

// Input.OTP reports its cells; the screen's digit handler takes one change at a
// time in the old per-box event shape (index + typed text), so it is fed that.
const otpInput = (v, cells) => {
  const prev = (v.otpBoxes || []).map(b => b.v || '');
  const next = prev.map((_, k) => cells[k] || '');
  const changed = next.map((c, k) => (c !== prev[k] ? k : -1)).filter(k => k >= 0);
  if (!changed.length) return;
  const i = changed[0];
  const value = changed.length > 1 ? next.slice(i).join('') : next[i];
  v.setOtpDigit({ target: { dataset: { i: String(i) }, value, closest: () => ({ querySelectorAll: () => [] }) } });
};

export const SupervisorVerifyOtp = ({ v }) => (
  <>
    <Flex vertical style={{ flex: 1, padding: 'calc(40px + env(safe-area-inset-top)) 24px 40px' }}>
      <Flex align="center" gap={12}><img src={logoImg} alt="" style={{ height: 44, width: 'auto' }} /></Flex>
      <Typography.Title level={4} style={{ margin: '10px 0 0' }}>
        Kongunadu Road Lines
      </Typography.Title>
      <Flex align="center" justify="space-between" gap={12} style={{ marginTop: 28 }}>
        <Typography.Text strong style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-brand)' }}>
          Step 2 of 3 · Verify
        </Typography.Text>
        <Progress
          aria-hidden="true"
          steps={(v.obSteps || []).length}
          percent={(v.obSteps || []).length ? ((v.obSteps || []).filter(st => st.bg === 'var(--color-brand)').length / (v.obSteps || []).length) * 100 : 0}
          showInfo={false}
          size={[22, 4]}
          strokeColor="var(--color-brand)"
          railColor="var(--kr-grey-200)"
        />
      </Flex>
      <Typography.Title level={2} style={{ margin: '6px 0 0', lineHeight: 1.1 }}>
        Enter OTP
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ margin: '8px 0 24px', fontSize: 15 }}>Head Office approved +91 {v.obPhoneText}. Enter the 4-digit OTP they shared with you.</Typography.Paragraph>
      {v.obOtpShared ? (
        <>
          <Alert
            type="success"
            showIcon
            style={{ marginBottom: 20 }}
            title={
              <span>
                <strong>OTP received</strong>
                {' '}from Head Office and filled in.
              </span>
            }
          />
        </>
      ) : null}
      <Flex justify="center" role="group" aria-label="4-digit OTP">
        <Input.OTP
          length={4}
          size="large"
          inputMode="numeric"
          autoComplete="one-time-code"
          formatter={str => str.replace(/[^\d ]/g, '')}
          status={v.obOtpErr ? 'error' : undefined}
          value={(v.otpBoxes || []).map(b => b.v || '').join('')}
          onInput={cells => otpInput(v, cells)}
          style={{ columnGap: 12 }}
        />
      </Flex>
      {v.obOtpErr ? (
        <>
          <Typography.Text type="danger" strong role="alert" style={{ display: 'block', marginTop: 12, textAlign: 'center' }}>{v.obOtpErr}</Typography.Text>
        </>
      ) : null}
      <Flex vertical gap={8} style={{ marginTop: 'auto', paddingTop: 28 }}>
        <Button type="primary" size="large" block onClick={v.verifyOtp} style={v.bigBtn}>Verify OTP</Button>
        <Button type="text" size="large" block onClick={v.restartApproval}>Request approval again</Button>
      </Flex>
    </Flex>
  </>
);

export const VerifyOtp = SupervisorVerifyOtp;
export default SupervisorVerifyOtp;
