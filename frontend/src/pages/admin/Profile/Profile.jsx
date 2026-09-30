import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, KeyRound, LogOut, Mail, Pencil, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { Avatar, Button, Card, Col, Descriptions, Divider, Flex, Form, Input, Row, Space, Tag, Typography } from 'antd';
import { useAuth } from '../../../hooks/useAuth';
import { useTMSAdmin } from '../../../context/TMSAdminContext';

const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const Profile = () => {
  const navigate = useNavigate();
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { showToast, T, saveMaster } = useTMSAdmin();
  const u = user || {};
  // The signed-in account's row on Users & roles (sign-in checks it)
  const portalRec = (T().users || []).find(x => x.id === u.id);
  const syncPortalUser = changes => portalRec && saveMaster('users', { ...portalRec, ...changes }, false);

  const initialDetails = { name: u.name || '', email: u.email || '', phone: u.phone || '' };
  const [editing, setEditing] = useState(false);
  const [details, setDetails] = useState(initialDetails);
  const [detailErr, setDetailErr] = useState({});

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwErr, setPwErr] = useState({});

  // Same initials as the header avatar
  const shortName = u.role === 'Administrator' ? 'Admin' : u.name || 'Admin';
  const nameWords = shortName.split(' ').filter(Boolean);
  const initials = (nameWords.length > 1 ? nameWords[0][0] + nameWords[1][0] : shortName.slice(0, 2)).toUpperCase();
  const phoneText = u.phone ? '+91 ' + u.phone.replace(/(\d{5})(\d{5})/, '$1 $2') : '';
  const baseText = u.branch === 'All branches' || !u.branch ? 'HO - Chennai' : u.branch;

  const signOut = () => {
    logout();
    navigate('/');
  };

  const saveDetails = () => {
    const phoneDigits = details.phone.replace(/\D/g, '');
    const errs = {
      name: !details.name.trim() ? 'Enter your name.' : undefined,
      email: !emailOk(details.email.trim()) ? 'Enter a valid email address.' : undefined,
      phone: details.phone.trim() && phoneDigits.length !== 10 ? 'Enter a 10-digit mobile number.' : undefined,
    };
    setDetailErr(errs);
    if (Object.values(errs).some(Boolean)) return;
    const emailChanged = details.email.trim().toLowerCase() !== (u.email || '').toLowerCase();
    updateProfile({ name: details.name.trim(), email: details.email.trim(), phone: phoneDigits });
    syncPortalUser({ name: details.name.trim(), email: details.email.trim().toLowerCase(), phone: phoneDigits });
    setEditing(false);
    showToast('success', 'Profile updated', emailChanged ? `Sign in with ${details.email.trim()} from now on.` : 'Your account details are saved.');
  };

  const cancelDetails = () => {
    setDetails(initialDetails);
    setDetailErr({});
    setEditing(false);
  };

  const savePassword = () => {
    const errs = {
      current: !pw.current ? 'Enter your current password.' : undefined,
      next: pw.next.length < 8 ? 'Use at least 8 characters.' : pw.next === pw.current ? 'Choose a password different from the current one.' : undefined,
      confirm: pw.confirm !== pw.next ? 'Passwords do not match.' : undefined,
    };
    setPwErr(errs);
    if (Object.values(errs).some(Boolean)) return;
    if (portalRec && portalRec.password && portalRec.password !== pw.current) {
      setPwErr({ current: 'Current password is incorrect.' });
      return;
    }
    const res = changePassword(pw.current, pw.next);
    if (!res.success) {
      setPwErr({ current: res.error });
      return;
    }
    syncPortalUser({ password: pw.next });
    setPw({ current: '', next: '', confirm: '' });
    setPwErr({});
    showToast('success', 'Password changed', 'Use the new password next time you sign in.');
  };

  // Card heading: brand icon + title + one-line description
  const cardTitle = (Icon, title, sub) => (
    <Flex align="center" gap={12} style={{ paddingBlock: 12 }}>
      <Icon size={18} color="var(--color-brand)" style={{ flex: 'none' }} />
      <div style={{ minWidth: 0 }}>
        <Typography.Title level={5} style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          {title}
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontWeight: 400, whiteSpace: 'normal' }}>
          {sub}
        </Typography.Text>
      </div>
    </Flex>
  );

  const readLabel = (Icon, label) => (
    <Space size={6}>
      <Icon size={16} color="var(--color-brand)" />
      {label}
    </Space>
  );

  const readValue = value =>
    value ? (
      <Typography.Text strong style={{ overflowWrap: 'anywhere' }}>{value}</Typography.Text>
    ) : (
      <Typography.Text type="secondary">Not added</Typography.Text>
    );

  const pwIcon = visible => (visible ? <EyeOff size={18} /> : <Eye size={18} />);

  return (
    <div className="tms-profile">
      {/* Summary */}
      <Card className="tms-profile-aside" style={{ borderTop: '4px solid var(--color-brand)' }}>
        <Flex vertical align="center" gap={10} style={{ textAlign: 'center', marginBottom: 16 }}>
          <Avatar size={84} style={{ background: 'var(--color-brand)', fontWeight: 800, fontSize: 28, boxShadow: '0 0 0 4px var(--color-brand-soft)' }}>
            {initials}
          </Avatar>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>{u.name || 'Admin'}</Typography.Title>
            <Typography.Text type="secondary" style={{ overflowWrap: 'anywhere' }}>{u.email}</Typography.Text>
          </div>
          <Tag color="success" icon={<ShieldCheck size={14} />} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginInlineEnd: 0 }}>
            {u.role || 'Administrator'}
          </Tag>
        </Flex>
        <Descriptions
          size="small"
          column={1}
          items={[
            ['Branch access', u.branch || 'All branches'],
            ['Base', baseText],
            ['User ID', u.id],
          ].map(([label, value]) => ({ key: label, label, children: <Typography.Text strong>{value || '—'}</Typography.Text> }))}
        />
        <Button danger block icon={<LogOut size={16} />} onClick={signOut} style={{ marginTop: 12 }}>
          Sign out
        </Button>
      </Card>

      <Flex vertical gap={20} style={{ minWidth: 0 }}>
        {/* Account details */}
        <Card
          title={cardTitle(UserRound, 'Account details', 'Your name, sign-in email and mobile number.')}
          extra={
            !editing && (
              <Button icon={<Pencil size={14} />} onClick={() => { setDetails(initialDetails); setEditing(true); }}>
                Edit
              </Button>
            )
          }
        >
          {!editing ? (
            <Descriptions
              bordered
              size="small"
              layout="vertical"
              column={{ xs: 1, sm: 2 }}
              items={[
                ['full', readLabel(UserRound, 'Full name'), u.name],
                ['email', readLabel(Mail, 'Email · sign-in'), u.email],
                ['phone', readLabel(Phone, 'Mobile number'), phoneText],
                ['branch', readLabel(Building2, 'Branch access'), u.branch],
              ].map(([key, label, value]) => ({ key, label, children: readValue(value) }))}
            />
          ) : (
            <Form layout="vertical" component="div">
              <Row gutter={16}>
                <Col xs={24} md={12} xl={8}>
                  <Form.Item label="Full name" validateStatus={detailErr.name ? 'error' : undefined} help={detailErr.name}>
                    <Input value={details.name} onChange={e => setDetails({ ...details, name: e.target.value })} autoComplete="name" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                  <Form.Item label="Email · sign-in" validateStatus={detailErr.email ? 'error' : undefined} help={detailErr.email || 'You sign in with this email.'}>
                    <Input
                      type="email"
                      prefix={<Mail size={16} color="var(--text-muted)" />}
                      value={details.email}
                      onChange={e => setDetails({ ...details, email: e.target.value })}
                      autoComplete="email"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12} xl={8}>
                  <Form.Item label="Mobile number" validateStatus={detailErr.phone ? 'error' : undefined} help={detailErr.phone || 'Optional · 10 digits'}>
                    <Input
                      inputMode="numeric"
                      value={details.phone}
                      onChange={e => setDetails({ ...details, phone: e.target.value.replace(/[^\d ]/g, '').slice(0, 11) })}
                      placeholder="90031 55012"
                      autoComplete="tel"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Divider style={{ margin: '0 0 14px' }} />
              <Flex gap={8} justify="flex-end">
                <Button onClick={cancelDetails}>Cancel</Button>
                <Button type="primary" onClick={saveDetails}>Save changes</Button>
              </Flex>
            </Form>
          )}
        </Card>

        {/* Password */}
        <Card title={cardTitle(KeyRound, 'Change password', 'Use at least 8 characters. You stay signed in on this device.')}>
          <Form layout="vertical" onFinish={() => savePassword()}>
            <Row gutter={16}>
              <Col xs={24} md={12} xl={8}>
                <Form.Item label="Current password" validateStatus={pwErr.current ? 'error' : undefined} help={pwErr.current}>
                  <Input.Password value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" iconRender={pwIcon} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12} xl={8}>
                <Form.Item label="New password" validateStatus={pwErr.next ? 'error' : undefined} help={pwErr.next}>
                  <Input.Password value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" iconRender={pwIcon} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12} xl={8}>
                <Form.Item label="Confirm new password" validateStatus={pwErr.confirm ? 'error' : undefined} help={pwErr.confirm}>
                  <Input.Password value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" iconRender={pwIcon} />
                </Form.Item>
              </Col>
            </Row>
            <Divider style={{ margin: '0 0 14px' }} />
            <Flex justify="flex-end">
              <Button type="primary" htmlType="submit">Update password</Button>
            </Flex>
          </Form>
        </Card>
      </Flex>
    </div>
  );
};

export default Profile;
