import React from 'react';
import { Alert, Avatar, Button, Card, Flex, Form, Input, Typography, Upload } from 'antd';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

export const RequestDriver = ({ v }) => (
  <>
    <Flex vertical style={{ flex: 1 }}>
      <Flex vertical gap={16} style={{ padding: 16 }}>
        <Alert type="warning" title={v.reqIntro} />
        {v.reqHasErrors ? (
          <>
            <Alert
              type="error"
              showIcon
              title={
                <span>
                  <strong>{v.reqErrorCount} {v.reqErrorWord} to fix.</strong>
                  {' '}Check the highlighted fields below.
                </span>
              }
            />
          </>
        ) : null}
        <Form layout="vertical" requiredMark={false} component="div">
          <Flex vertical gap={16}>
            <Card
              size="small"
              title={
                <Flex align="center" gap={10}>
                  <Avatar aria-hidden="true" size={26} style={{ background: 'var(--color-brand)', fontWeight: 800, fontSize: 13 }}>1</Avatar>
                  <Typography.Title level={5} style={{ margin: 0, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{v.reqRole} details</Typography.Title>
                </Flex>
              }
            >
              <Form.Item label={`${v.reqRole} name`} validateStatus={v.rerr.name ? 'error' : undefined} help={v.rerr.name || undefined}>
                <Input size="large" placeholder="Full name as on licence" value={v.rf.name ?? ''} onChange={v.setRf.name} />
              </Form.Item>
              <Form.Item label={v.reqHelper ? "Licence number (optional)" : "Licence number"} validateStatus={v.rerr.licence ? 'error' : undefined} help={v.rerr.licence || undefined}>
                <Input size="large" placeholder="TN28 2019 0004521" value={v.rf.licence ?? ''} onChange={v.setRfLicence} />
              </Form.Item>
              <Form.Item label="Mobile number" validateStatus={v.rerr.phone ? 'error' : undefined} help={v.rerr.phone || undefined} style={{ marginBottom: 0 }}>
                <Input size="large" placeholder="90031 55012" prefix="+91" inputMode="numeric" value={v.rf.phone ?? ''} onChange={v.setRfPhone} />
              </Form.Item>
            </Card>
            <Card
              size="small"
              title={
                <Flex align="center" gap={10}>
                  <Avatar aria-hidden="true" size={26} style={{ background: 'var(--color-brand)', fontWeight: 800, fontSize: 13 }}>2</Avatar>
                  <Typography.Title level={5} style={{ margin: 0, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Documents</Typography.Title>
                </Flex>
              }
            >
              <Flex vertical gap={16}>
                {(v.uploads || []).map((u, uIdx) => (
                  <React.Fragment key={uIdx}>
                    <Form.Item
                      label={<Flex gap={12} align="baseline">{u.label} <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>{u.note}</Typography.Text></Flex>}
                      validateStatus={u.err ? 'error' : undefined}
                      help={u.err ? u.errText : undefined}
                      style={{ marginBottom: 0 }}
                    >
                      {u.empty ? (
                        <>
                          <Upload.Dragger
                            accept="image/*"
                            aria-label={u.label}
                            showUploadList={false}
                            fileList={[]}
                            beforeUpload={file => { v.pickUpload({ currentTarget: { dataset: { k: u.key } }, target: { files: [file], value: '' } }); return false; }}
                            style={{ borderColor: u.border }}
                          >
                            <Flex align="center" gap={14} style={{ padding: '0 14px', textAlign: 'left' }}>
                              <Avatar shape="square" size={44} icon={<Camera size={22} />} style={{ flex: 'none', background: 'var(--color-brand-tint)', color: 'var(--color-brand)' }} />
                              <Flex vertical gap={2}>
                                <Typography.Text strong style={{ fontSize: 15 }}>Take photo or upload</Typography.Text>
                                <Typography.Text type="secondary" style={{ fontSize: 13 }}>JPG or PNG · up to 5 MB</Typography.Text>
                              </Flex>
                            </Flex>
                          </Upload.Dragger>
                        </>
                      ) : null}
                      {u.set ? (
                        <>
                          <Card size="small" style={{ borderWidth: 2, borderColor: 'var(--color-brand)', background: 'var(--color-brand-tint)' }} styles={{ body: { padding: 10 } }}>
                            <Flex align="center" gap={12}>
                              <Avatar
                                shape="square"
                                size={52}
                                aria-hidden="true"
                                src={u.url || undefined}
                                icon={u.noPreview ? <ImageIcon size={22} /> : undefined}
                                style={{ flex: 'none', width: 72, background: '#fff', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <Typography.Text strong ellipsis style={{ display: 'block' }}>{u.name}</Typography.Text>
                                <Typography.Text style={{ fontSize: 12, color: 'var(--kr-green-800)' }}>{u.size} · attached</Typography.Text>
                              </div>
                              <Button type="text" danger size="large" icon={<X size={18} strokeWidth={2.5} />} data-k={u.key} onClick={v.clearUpload} aria-label={u.removeLabel} style={{ flex: 'none' }} />
                            </Flex>
                          </Card>
                        </>
                      ) : null}
                    </Form.Item>
                  </React.Fragment>
                ))}
              </Flex>
            </Card>
            <Card
              size="small"
              title={
                <Flex align="center" gap={10}>
                  <Avatar aria-hidden="true" size={26} style={{ background: 'var(--color-brand)', fontWeight: 800, fontSize: 13 }}>3</Avatar>
                  <Typography.Title level={5} style={{ margin: 0, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Bank account</Typography.Title>
                </Flex>
              }
            >
              <Form.Item label="Account holder name" validateStatus={v.rerr.holder ? 'error' : undefined} help={v.rerr.holder || undefined}>
                <Input size="large" placeholder="As in bank passbook" value={v.rf.holder ?? ''} onChange={v.setRf.holder} />
              </Form.Item>
              <Form.Item label="Account number" validateStatus={v.rerr.account ? 'error' : undefined} help={v.rerr.account || undefined}>
                <Input size="large" placeholder="9 to 18 digits" inputMode="numeric" value={v.rf.account ?? ''} onChange={v.setRfAccount} />
              </Form.Item>
              <Form.Item label="IFSC code" validateStatus={v.rerr.ifsc ? 'error' : undefined} help={v.rerr.ifsc || '11 characters, printed on the passbook or cheque leaf.'} style={{ marginBottom: 0 }}>
                <Input size="large" placeholder="SBIN0001234" value={v.rf.ifsc ?? ''} onChange={v.setRfIfsc} />
              </Form.Item>
            </Card>
            <Card
              size="small"
              title={
                <Flex align="center" gap={10}>
                  <Avatar aria-hidden="true" size={26} style={{ background: 'var(--color-brand)', fontWeight: 800, fontSize: 13 }}>4</Avatar>
                  <Typography.Title level={5} style={{ margin: 0, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Family & reference</Typography.Title>
                </Flex>
              }
            >
              <Form.Item label="Family contact number" validateStatus={v.rerr.family ? 'error' : undefined} help={v.rerr.family || undefined}>
                <Input size="large" placeholder="Emergency contact" prefix="+91" inputMode="numeric" value={v.rf.family ?? ''} onChange={v.setRfFamily} />
              </Form.Item>
              <Form.Item label={<Flex gap={12} align="baseline">Reference <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>Optional · {v.refCount}/250</Typography.Text></Flex>} style={{ marginBottom: 0 }}>
                <Input.TextArea value={v.rf.reference} onChange={v.setRfReference} maxLength={250} rows={3} placeholder="Who referred this driver, previous employer, years of experience" style={{ minHeight: 88, fontSize: 16 }} />
              </Form.Item>
            </Card>
          </Flex>
        </Form>
      </Flex>
      <Flex vertical gap={8} style={{ position: 'sticky', bottom: 0, marginTop: 'auto', padding: '12px 16px 40px', background: '#fff', borderTop: '1px solid var(--border-default)' }}>
        <Button type="primary" size="large" block onClick={v.submitDriver} style={v.bigBtn}>Send for approval</Button>
        {v.reqFromOpen ? (
          <>
            <Button type="text" size="large" block onClick={v.back}>Back to Open Trip</Button>
          </>
        ) : null}
      </Flex>
    </Flex>
  </>
);

export default RequestDriver;
