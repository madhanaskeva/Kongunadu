import React from 'react';
import dayjs from 'dayjs';
import { Button, Card, DatePicker, Divider, Flex, Form, Input, Typography } from 'antd';

// Advance Given entries and the carry-forward balance, shared by Open Trip and Close Trip.
// All values and handlers come from SupervisorApp (advanceVals / balance rows); nothing is computed here.

const ISO = 'YYYY-MM-DD';
const toDay = s => (s ? dayjs(s, ISO) : null);
const kicker = { fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' };
const TONE = {
  positive: { bg: 'var(--color-brand-tint)', fg: 'var(--kr-green-900)', note: 'Balance with the vehicle' },
  zero: { bg: 'var(--surface-muted)', fg: 'var(--text-heading)', note: 'Fully settled' },
  negative: { bg: 'var(--kr-red-100)', fg: 'var(--kr-red-800)', note: 'Spent more than given · owed to the crew' },
};

export const AdvanceEntries = ({ a }) => (
  <Card
    size="small"
    title={<Typography.Text type="secondary" strong style={kicker}>{a.title}</Typography.Text>}
    extra={<Typography.Text type="secondary" style={{ fontSize: 12 }}>Amount and date</Typography.Text>}
    style={{ borderColor: a.err ? 'var(--status-danger)' : 'var(--border-default)', marginBottom: 18 }}
  >
    <Flex vertical gap={12}>
      {a.rows.length ? (
        <Card size="small" styles={{ body: { padding: 0 } }} style={{ overflow: 'hidden' }}>
          <Flex style={{ padding: '8px 12px', background: 'var(--surface-muted)', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
            <span style={{ flex: 1 }}>Date</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Amount</span>
            <span style={{ width: 120, textAlign: 'right' }}>Action</span>
          </Flex>
          {a.rows.map(r => (
            <Flex key={r.i} align="center" style={{ padding: '6px 12px', borderTop: '1px solid var(--border-default)', background: r.editing ? 'var(--color-brand-tint)' : '#fff' }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <Typography.Text type="secondary" style={{ display: 'block', fontSize: 11 }}>{r.label}</Typography.Text>
                <Typography.Text strong>{r.date}</Typography.Text>
              </span>
              <Typography.Text strong style={{ flex: 1, textAlign: 'right', fontSize: 15 }}>{r.amount}</Typography.Text>
              <Flex justify="flex-end" style={{ width: 120 }}>
                <Button type="link" size="small" onClick={() => a.edit(r.i)}>Edit</Button>
                <Button type="link" size="small" danger onClick={() => a.remove(r.i)}>Delete</Button>
              </Flex>
            </Flex>
          ))}
        </Card>
      ) : !a.editorOpen ? (
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>{a.emptyText}</Typography.Text>
      ) : null}
      {a.editorOpen ? (
        <Card size="small" style={{ borderStyle: 'dashed', borderWidth: 2, borderColor: 'var(--color-brand)', background: 'var(--color-brand-tint)' }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 10, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--kr-green-900)' }}>
            {a.editorTitle}
          </Typography.Text>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
            <Form.Item label="Advance amount" validateStatus={a.draftErr.amount ? 'error' : undefined} help={a.draftErr.amount || undefined} style={{ marginBottom: 10 }}>
              <Input size="large" prefix="₹" placeholder="0" inputMode="numeric" value={a.draft.amount ?? ''} onChange={e => a.setAmount(e.target.value)} />
            </Form.Item>
            <Form.Item label="Advance given date" validateStatus={a.draftErr.date ? 'error' : undefined} help={a.draftErr.date || undefined} style={{ marginBottom: 10 }}>
              <DatePicker
                size="large"
                inputReadOnly
                format="DD MMM YYYY"
                value={toDay(a.draft.date)}
                onChange={d => a.setDate(d ? d.format(ISO) : '')}
                maxDate={toDay(a.maxDate) || undefined}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>
          <Flex wrap gap={8}>
            <Button type="primary" size="large" onClick={a.save}>{a.saveLabel}</Button>
            <Button type="text" size="large" onClick={a.cancel}>Cancel</Button>
          </Flex>
        </Card>
      ) : (
        <Button size="large" block className="sv-add-btn" onClick={a.openEditor}>+ Add advance</Button>
      )}
      <Card size="small" variant="borderless" style={{ background: 'var(--surface-muted)' }}>
        <Flex justify="space-between" align="center">
          <Typography.Text type="secondary">{a.totalLabel}</Typography.Text>
          <Typography.Text strong style={{ fontSize: 18 }}>{a.total}</Typography.Text>
        </Flex>
      </Card>
      {a.err ? <Typography.Text type="danger" strong style={{ fontSize: 13 }}>{a.err}</Typography.Text> : null}
    </Flex>
  </Card>
);

// Read-only balance brought in from the vehicle's last closed trip.
export const PreviousCarryForward = ({ p }) => {
  const t = TONE[p.tone] || TONE.zero;
  return (
    <Card size="small" variant="borderless" style={{ background: t.bg, marginBottom: 18 }}>
      <Flex justify="space-between" align="center" gap={12}>
        <span style={{ minWidth: 0 }}>
          <Typography.Text strong style={{ display: 'block', ...kicker, color: t.fg }}>Previous carry forward balance</Typography.Text>
          <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{p.source}</Typography.Text>
        </span>
        <Typography.Text strong style={{ fontSize: 22, whiteSpace: 'nowrap', color: t.fg }}>{p.amount}</Typography.Text>
      </Flex>
    </Card>
  );
};

// Previous carry forward + advances − expenses = carry forward, with the sign kept.
export const CarryForwardSummary = ({ b }) => {
  const t = TONE[b.tone] || TONE.zero;
  return (
    <Card size="small" title={<Typography.Text type="secondary" strong style={kicker}>Advance balance</Typography.Text>} style={{ marginBottom: 18 }}>
      <Flex vertical gap={6}>
        {b.rows.map(([k, val, note]) => (
          <Flex key={k} justify="space-between" align="baseline" gap={12}>
            <span>
              <Typography.Text>{k}</Typography.Text>
              {note ? <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{note}</Typography.Text> : null}
            </span>
            <Typography.Text strong style={{ whiteSpace: 'nowrap' }}>{val}</Typography.Text>
          </Flex>
        ))}
        <Divider style={{ margin: '4px 0' }} />
        <Flex justify="space-between" align="center" gap={12} style={{ background: t.bg, margin: '0 -12px -8px', padding: '10px 12px', borderRadius: '0 0 8px 8px' }}>
          <span>
            <Typography.Text strong style={{ display: 'block', ...kicker, color: t.fg }}>Carry forward</Typography.Text>
            <Typography.Text style={{ display: 'block', fontSize: 12, color: t.fg }}>{t.note}</Typography.Text>
          </span>
          <Typography.Text strong style={{ fontSize: 22, whiteSpace: 'nowrap', color: t.fg }}>{b.carryForward}</Typography.Text>
        </Flex>
      </Flex>
    </Card>
  );
};

export default AdvanceEntries;
