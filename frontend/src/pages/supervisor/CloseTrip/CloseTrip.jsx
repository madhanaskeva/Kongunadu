import React from 'react';
import { Alert, Avatar, Button, Card, Flex, Form, Input, Select, Typography, Upload } from 'antd';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

// The screen handlers read e.target.value (a string, as the old select gave);
// antd Select hands over the bare value, so it is passed on in that shape.
const asEvent = value => ({ target: { value: value == null ? '' : String(value) } });
// A value that is not one of the options shows the placeholder, as before.
const pick = (options, value) => ((options || []).some(o => String(o.value) === String(value)) ? value : undefined);

export const CloseTrip = ({ v }) => (
  <>
    <Flex vertical style={{ flex: 1 }}>
      <Flex vertical gap={18} style={{ padding: 16 }}>
        {v.resumeHere ? (
          <>
            <Alert
              type="warning"
              showIcon
              role="status"
              title={
                <span>
                  <strong>Close this trip first.</strong>
                  {' '}You go back to Open Trip for {v.resumeVehicle} as soon as it is closed.
                </span>
              }
            />
          </>
        ) : null}
        {/* Trip summary on the brand colour */}
        <Card size="small" variant="borderless" style={{ background: 'var(--color-brand)', color: '#fff' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700 }}>{v.sel.number}</div>
          <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>{v.sel.crewLine} · {v.sel.partyName}</div>
          <Flex wrap gap={20} style={{ marginTop: 12, fontSize: 13 }}>
            <span>
              <span style={{ opacity: 0.6 }}>Start KM</span>
              <br />
              <strong style={{ fontSize: 16 }}>{v.sel.startKm}</strong>
            </span>
            <span>
              <span style={{ opacity: 0.6 }}>Fixed route</span>
              <br />
              <strong style={{ fontSize: 16 }}>{v.sel.fixedKm} km</strong>
            </span>
            <span>
              <span style={{ opacity: 0.6 }}>GPS so far</span>
              <br />
              <strong style={{ fontSize: 16 }}>{v.sel.gpsKm} km</strong>
            </span>
            <span>
              <span style={{ opacity: 0.6 }}>Tank</span>
              <br />
              <strong style={{ fontSize: 16 }}>{v.tankLabel}</strong>
            </span>
          </Flex>
        </Card>
        {v.closeHasErrors ? (
          <>
            <Alert type="error" title="The trip cannot close until the required fields are filled." />
          </>
        ) : null}
        <Form layout="vertical" requiredMark={false} component="div">
          <Form.Item label="Loading invoice number" validateStatus={v.cerr.invoice ? 'error' : undefined} help={v.cerr.invoice || undefined}>
            <Input size="large" placeholder="e.g. SP/INV/22890" value={v.cf.invoice ?? ''} onChange={v.setCf.invoice} />
          </Form.Item>
          <Form.Item label="LR number (optional)">
            <Input size="large" placeholder="Lorry receipt" value={v.cf.lr ?? ''} onChange={v.setCf.lr} />
          </Form.Item>
          {/* ODOMETER · point-to-point readings with photos */}
          <Card
            size="small"
            title={<Typography.Text type="secondary" strong style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Odometer readings</Typography.Text>}
            extra={<Typography.Text type="secondary" style={{ fontSize: 12 }}>From → to, with photo</Typography.Text>}
            style={{ borderColor: v.legBox.border, marginBottom: 18 }}
          >
            <Flex vertical gap={12}>
              {(v.legCards || []).map((l, lIdx) => (
                <React.Fragment key={lIdx}>
                  <Card size="small" style={{ background: l.bg }}>
                    <Flex gap={12} align="center">
                      <Avatar shape="square" size={48} aria-hidden="true" src={l.url || undefined} icon={l.noPhoto ? <ImageIcon size={18} /> : undefined} style={{ flex: 'none', background: '#fff', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Typography.Text type="secondary" strong style={{ display: 'block', fontSize: 12 }}>{l.title}</Typography.Text>
                        <Typography.Text strong style={{ display: 'block', lineHeight: 1.3 }}>{l.route}</Typography.Text>
                        <Typography.Text style={{ fontSize: 13 }}>
                          {l.reading} ·{' '}
                          <strong style={{ color: 'var(--text-brand)' }}>{l.km}</strong>
                        </Typography.Text>
                      </div>
                      <Flex vertical gap={2} style={{ flex: 'none' }}>
                        <Button type="link" size="small" data-i={l.i} onClick={v.editLeg}>Edit</Button>
                        <Button type="link" size="small" danger data-i={l.i} onClick={v.removeLeg}>Remove</Button>
                      </Flex>
                    </Flex>
                  </Card>
                </React.Fragment>
              ))}
              {v.legSummary ? (
                <>
                  <Card size="small" variant="borderless" style={{ background: 'var(--surface-muted)' }}>
                    <Flex justify="space-between" align="center">
                      <Typography.Text type="secondary">Closing odometer</Typography.Text>
                      <span style={{ textAlign: 'right' }}>
                        <Typography.Text strong style={{ fontSize: 17 }}>{v.legSummary.close}</Typography.Text>
                        <br />
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{v.legSummary.dist}</Typography.Text>
                      </span>
                    </Flex>
                  </Card>
                </>
              ) : null}
              {v.legEditorOpen ? (
                <>
                  <Card size="small" style={{ borderStyle: 'dashed', borderWidth: 2, borderColor: 'var(--color-brand)', background: 'var(--color-brand-tint)' }}>
                    <Typography.Text strong style={{ display: 'block', marginBottom: 10, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--kr-green-900)' }}>
                      {v.legEditorTitle}
                    </Typography.Text>
                    <Form.Item label="From" style={{ marginBottom: 10 }}>
                      <Select
                        size="large"
                        placeholder={(v.pointOptions || []).length ? 'Select point' : 'None available'}
                        disabled={!(v.pointOptions || []).length}
                        options={v.pointOptions}
                        value={pick(v.pointOptions, v.cf.legDraft.from)}
                        onChange={val => v.setLegFrom(asEvent(val))}
                      />
                    </Form.Item>
                    <Form.Item label="To" validateStatus={v.legErr.route ? 'error' : undefined} help={v.legErr.route || undefined} style={{ marginBottom: 10 }}>
                      <Select
                        size="large"
                        placeholder={(v.pointOptions || []).length ? 'Select point' : 'None available'}
                        disabled={!(v.pointOptions || []).length}
                        options={v.pointOptions}
                        value={pick(v.pointOptions, v.cf.legDraft.to)}
                        onChange={val => v.setLegTo(asEvent(val))}
                      />
                    </Form.Item>
                    <Form.Item label="Odometer End KM" validateStatus={v.legErr.reading ? 'error' : undefined} help={v.legErr.reading || v.legReadingHint} style={{ marginBottom: 10 }}>
                      <Input size="large" placeholder={v.legPrevText} value={v.cf.legDraft.reading ?? ''} onChange={v.setLegReading} inputMode="numeric" suffix="km" />
                    </Form.Item>
                    <Form.Item label="Odometer photo" validateStatus={v.legErr.photo ? 'error' : undefined} help={v.legErr.photo || undefined} style={{ marginBottom: 12 }}>
                      {v.legPhotoEmpty ? (
                        <>
                          <Upload.Dragger
                            accept="image/*"
                            aria-label="Odometer photo"
                            showUploadList={false}
                            fileList={[]}
                            beforeUpload={file => { v.pickLegPhoto({ target: { files: [file], value: '' } }); return false; }}
                            style={{ borderColor: v.legPhotoBorder, background: '#fff' }}
                          >
                            <Flex align="center" gap={12} style={{ padding: '0 12px', textAlign: 'left' }}>
                              <Avatar shape="square" size={40} icon={<Camera size={20} />} style={{ flex: 'none', background: 'var(--color-brand-tint)', color: 'var(--color-brand)' }} />
                              <Flex vertical gap={2}>
                                <Typography.Text strong>Take photo of the odometer</Typography.Text>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>Reading must be clearly visible</Typography.Text>
                              </Flex>
                            </Flex>
                          </Upload.Dragger>
                        </>
                      ) : null}
                      {v.legPhotoSet ? (
                        <>
                          <Card size="small" style={{ borderWidth: 2, borderColor: 'var(--color-brand)' }} styles={{ body: { padding: 8 } }}>
                            <Flex align="center" gap={12}>
                              <Avatar shape="square" size={48} aria-hidden="true" src={v.legPhoto.url || undefined} style={{ flex: 'none', width: 64, background: 'var(--surface-muted)', border: '1px solid var(--border-default)' }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <Typography.Text strong ellipsis style={{ display: 'block', fontSize: 13 }}>
                                  {v.legPhoto.name}
                                </Typography.Text>
                                <Typography.Text style={{ fontSize: 12, color: 'var(--kr-green-800)' }}>{v.legPhoto.size} · attached</Typography.Text>
                              </div>
                              <Button type="text" danger size="large" icon={<X size={18} strokeWidth={2.5} />} onClick={v.clearLegPhoto} aria-label="Remove odometer photo" style={{ flex: 'none' }} />
                            </Flex>
                          </Card>
                        </>
                      ) : null}
                    </Form.Item>
                    <Flex wrap gap={8}>
                      <Button type="primary" size="large" onClick={v.saveLeg}>{v.legSaveLabel}</Button>
                      {v.legCanCancel ? (
                        <>
                          <Button type="text" size="large" onClick={v.cancelLeg}>Cancel</Button>
                        </>
                      ) : null}
                    </Flex>
                  </Card>
                </>
              ) : null}
              {v.legAddShown ? (
                <>
                  <Button size="large" block onClick={v.openLegEditor}>+ Add reading</Button>
                </>
              ) : null}
              {v.cerr.legs ? (
                <>
                  <Typography.Text type="danger" strong style={{ fontSize: 13 }}>{v.cerr.legs}</Typography.Text>
                </>
              ) : null}
            </Flex>
          </Card>
          {/* DIESEL · one entry per bunk */}
          <Card
            size="small"
            title={<Typography.Text type="secondary" strong style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Diesel given</Typography.Text>}
            extra={<Typography.Text type="secondary" style={{ fontSize: 12 }}>Bunk, quantity and rate</Typography.Text>}
            style={{ borderColor: v.fillBox.border, marginBottom: 18 }}
          >
            <Flex vertical gap={12}>
              {(v.fillCards || []).map((d, dIdx) => (
                <React.Fragment key={dIdx}>
                  <Card size="small" style={{ background: d.bg }}>
                    <Flex gap={12} align="center">
                      <Avatar aria-hidden="true" size={36} style={{ flex: 'none', background: 'var(--color-brand-tint)', color: 'var(--color-brand)', fontWeight: 800 }}>
                        {d.n}
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Typography.Text strong style={{ display: 'block', lineHeight: 1.3 }}>{d.bunk}</Typography.Text>
                        <div style={{ fontSize: 13, color: d.lineColor }}>{d.line}</div>
                      </div>
                      <Flex vertical gap={2} style={{ flex: 'none' }}>
                        <Button type="link" size="small" data-i={d.i} onClick={v.editFill}>Edit</Button>
                        <Button type="link" size="small" danger data-i={d.i} onClick={v.removeFill}>Remove</Button>
                      </Flex>
                    </Flex>
                  </Card>
                </React.Fragment>
              ))}
              {v.fillEditorOpen ? (
                <>
                  <Card size="small" style={{ borderStyle: 'dashed', borderWidth: 2, borderColor: 'var(--color-brand)', background: 'var(--color-brand-tint)' }}>
                    <Typography.Text strong style={{ display: 'block', marginBottom: 10, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--kr-green-900)' }}>
                      {v.fillEditorTitle}
                    </Typography.Text>
                    {v.authorizedBunkOptions ? (
                      <>
                        <Form.Item label="Authorized Fuel Bunk" validateStatus={v.fillErr.bunk ? 'error' : undefined} help={v.fillErr.bunk || v.fillBunkHint} style={{ marginBottom: 10 }}>
                          <Select
                            size="large"
                            placeholder={v.authorizedBunkOptions.length ? 'Select authorized bunk for route' : 'None available'}
                            disabled={!v.authorizedBunkOptions.length}
                            options={v.authorizedBunkOptions}
                            value={pick(v.authorizedBunkOptions, v.selectedBunkChoice || '')}
                            onChange={val => v.selectBunkChoice(asEvent(val))}
                          />
                        </Form.Item>
                        {(v.selectedBunkChoice === 'NEW_BUNK' || (!v.authorizedBunkOptions.some(o => o.value === v.selectedBunkChoice) && v.selectedBunkChoice)) && (
                          <Flex vertical gap={8} style={{ marginBottom: 10 }}>
                            <Form.Item label="New fuel bunk name" validateStatus={v.fillErr.bunk ? 'error' : undefined} help={v.fillErr.bunk || undefined} style={{ marginBottom: 0 }}>
                              <Input
                                size="large"
                                placeholder="e.g. Sri Krishna Bunk – Salem Bypass"
                                value={v.cf.fillDraft.customBunk || v.cf.fillDraft.bunk || ''}
                                onChange={v.setCustomBunkName}
                              />
                            </Form.Item>
                            <Alert
                              type="warning"
                              title={
                                <span style={{ fontSize: 12, lineHeight: 1.4 }}>
                                  <strong>Note:</strong> This bunk is not listed as authorized for this route. Entering it will submit a request to Head Office Admin for approval. Once approved, it will automatically become authorized for this route.
                                </span>
                              }
                            />
                          </Flex>
                        )}
                      </>
                    ) : (
                      <Form.Item label="Bunk name" validateStatus={v.fillErr.bunk ? 'error' : undefined} help={v.fillErr.bunk || v.fillBunkHint} style={{ marginBottom: 10 }}>
                        <Input size="large" placeholder="e.g. IOC – Sriperumbudur Highway" value={v.cf.fillDraft.bunk ?? ''} onChange={v.setFillBunk} />
                      </Form.Item>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
                      <Form.Item label="Quantity" validateStatus={v.fillErr.litres ? 'error' : undefined} help={v.fillErr.litres || v.qtyHint} style={{ marginBottom: 10 }}>
                        <Input size="large" suffix="L" value={v.cf.fillDraft.litres ?? ''} onChange={v.setFillLitres} inputMode="decimal" />
                      </Form.Item>
                      <Form.Item label="Rate" validateStatus={v.fillErr.rate ? 'error' : undefined} help={v.fillErr.rate || undefined} style={{ marginBottom: 10 }}>
                        <Input size="large" prefix="₹" suffix="/L" value={v.cf.fillDraft.rate ?? ''} onChange={v.setFillRate} inputMode="decimal" />
                      </Form.Item>
                    </div>
                    <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
                      <Typography.Text type="secondary">Amount</Typography.Text>
                      <Typography.Text strong>{v.fillDraftAmount}</Typography.Text>
                    </Flex>
                    <Flex wrap gap={8}>
                      <Button type="primary" size="large" onClick={v.saveFill}>{v.fillSaveLabel}</Button>
                      {v.fillCanCancel ? (
                        <>
                          <Button type="text" size="large" onClick={v.cancelFill}>Cancel</Button>
                        </>
                      ) : null}
                    </Flex>
                  </Card>
                </>
              ) : null}
              {v.fillAddShown ? (
                <>
                  <Button size="large" block onClick={v.openFillEditor}>+ Add bunk</Button>
                </>
              ) : null}
              <Card size="small" variant="borderless" style={{ background: 'var(--surface-muted)' }}>
                <Flex justify="space-between" align="center">
                  <Typography.Text type="secondary">{v.dieselTotalLabel}</Typography.Text>
                  <Typography.Text strong style={{ fontSize: 18 }}>{v.dieselAmount}</Typography.Text>
                </Flex>
              </Card>
              {v.cerr.fills ? (
                <>
                  <Typography.Text type="danger" strong style={{ fontSize: 13 }}>{v.cerr.fills}</Typography.Text>
                </>
              ) : null}
            </Flex>
          </Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
            <Form.Item label="Loading qty" validateStatus={v.cerr.qtyLoad ? 'error' : undefined} help={v.cerr.qtyLoad || undefined}>
              <Input size="large" value={v.cf.qtyLoad ?? ''} onChange={v.setCf.qtyLoad} />
            </Form.Item>
            <Form.Item label="Unloading qty" validateStatus={v.cerr.qtyUnload ? 'error' : undefined} help={v.cerr.qtyUnload || undefined}>
              <Input size="large" value={v.cf.qtyUnload ?? ''} onChange={v.setCf.qtyUnload} />
            </Form.Item>
          </div>
          {/* Expense breakdown — every box feeds the total, so nothing is typed twice */}
          <Card size="small" title="Trip expenses" style={{ marginBottom: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', columnGap: 12 }}>
              <Form.Item label="1. FASTag">
                <Input size="large" prefix="₹" placeholder="0" inputMode="numeric" value={v.expBreakdown.fastag ?? ''} onChange={e => v.setExpBreakdown('fastag', e.target.value)} />
              </Form.Item>
              {(v.closeDrivers && v.closeDrivers.length > 0 ? v.closeDrivers : [{ id: 'default', name: 'Driver' }]).map((d, dIdx) => {
                const label = (v.closeDrivers || []).length > 1
                  ? `${2 + dIdx}. Driver bata (${d.name})`
                  : '2. Driver bata';
                const val = v.expBreakdown.driverBatas?.[d.id] ?? (dIdx === 0 ? (v.expBreakdown.driverBata ?? '') : '');
                return (
                  <Form.Item key={d.id || dIdx} label={label}>
                    <Input size="large" prefix="₹" placeholder="0" inputMode="numeric" value={val} onChange={e => v.setDriverBata(d.id, e.target.value)} />
                  </Form.Item>
                );
              })}
              <Form.Item label={`${((v.closeDrivers && v.closeDrivers.length) || 1) + 2}. Cleaner bata`}>
                <Input size="large" prefix="₹" placeholder="0" inputMode="numeric" value={v.expBreakdown.cleanerBata ?? ''} onChange={e => v.setExpBreakdown('cleanerBata', e.target.value)} />
              </Form.Item>
              <Form.Item label={`${((v.closeDrivers && v.closeDrivers.length) || 1) + 3}. R.T.O. & P.C. exp`}>
                <Input size="large" prefix="₹" placeholder="0" inputMode="numeric" value={v.expBreakdown.rto ?? ''} onChange={e => v.setExpBreakdown('rto', e.target.value)} />
              </Form.Item>
              <Form.Item label={`${((v.closeDrivers && v.closeDrivers.length) || 1) + 4}. Toll cash exp`}>
                <Input size="large" prefix="₹" placeholder="0" inputMode="numeric" value={v.expBreakdown.toll ?? ''} onChange={e => v.setExpBreakdown('toll', e.target.value)} />
              </Form.Item>
              <Form.Item label={`${((v.closeDrivers && v.closeDrivers.length) || 1) + 5}. Weighment exp`}>
                <Input size="large" prefix="₹" placeholder="0" inputMode="numeric" value={v.expBreakdown.weighment ?? ''} onChange={e => v.setExpBreakdown('weighment', e.target.value)} />
              </Form.Item>
            </div>

            <Form.Item label={`${((v.closeDrivers && v.closeDrivers.length) || 1) + 6}. Other expenses`} style={{ marginBottom: 0 }}>
              <Flex vertical gap={8}>
                {v.otherExpenses.map((row, i) => {
                  const opts = (v.otherExpenseOptions || []).some(o => o.value === row.name)
                    ? v.otherExpenseOptions
                    : (row.name ? [...(v.otherExpenseOptions || []), { value: row.name, label: row.name }] : (v.otherExpenseOptions || []));
                  return (
                    <Flex key={i} gap={8} align="center">
                      <Select
                        size="large"
                        style={{ flex: '1 1 auto', minWidth: 0 }}
                        placeholder="Select expense"
                        options={opts}
                        value={row.name || undefined}
                        onChange={val => v.setOtherExpense(i, 'name', val)}
                      />
                      <Input size="large" style={{ flex: '0 0 128px', width: 128 }} prefix="₹" placeholder="0" inputMode="numeric" value={row.amount ?? ''} onChange={e => v.setOtherExpense(i, 'amount', e.target.value)} />
                      <Button type="text" danger icon={<X size={20} strokeWidth={3} />} onClick={() => v.removeOtherExpense(i)} aria-label={`Remove other expense ${i + 1}`} style={{ flex: 'none' }} />
                    </Flex>
                  );
                })}
                <div>
                  <Button onClick={v.addOtherExpense}>Add more expenses</Button>
                </div>
              </Flex>
            </Form.Item>
          </Card>

          {/* Total is the sum of the boxes above — it is shown, never typed */}
          <Card size="small" variant="borderless" style={{ background: 'var(--color-brand-tint)', marginBottom: v.cerr.totalExpense ? 4 : 18 }}>
            <Flex justify="space-between" align="center" gap={12}>
              <span>
                <Typography.Text strong style={{ display: 'block', fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Total expense</Typography.Text>
                <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{v.totalExpenseHint}</Typography.Text>
              </span>
              <Typography.Text strong style={{ fontSize: 22, whiteSpace: 'nowrap' }}>{v.totalExpenseDisplay}</Typography.Text>
            </Flex>
          </Card>
          {v.cerr.totalExpense ? (
            <Typography.Text type="danger" strong style={{ display: 'block', marginBottom: 18, fontSize: 13 }}>{v.cerr.totalExpense}</Typography.Text>
          ) : null}
          <Form.Item label={<Flex gap={12} align="baseline">Remarks <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>Optional · {v.closeRemarksCount}/250</Typography.Text></Flex>}>
            <Input.TextArea value={v.cf.remarks} onChange={v.setCloseRemarks} maxLength={250} rows={3} placeholder="Delays, short delivery, extra stops or anything Head Office should know" style={{ minHeight: 88, fontSize: 16 }} />
          </Form.Item>
        </Form>
        {v.closeManualException ? (
          <>
            <Alert
              type="warning"
              title={
                <span>
                  <strong>Manual exception.</strong>
                  {' '}GPS and odometer both unavailable for this trip. Admin will receive an exception report; enter the closing reading from the dashboard photo.
                </span>
              }
            />
          </>
        ) : null}
      </Flex>
      <Flex vertical gap={8} style={{ position: 'sticky', bottom: 0, marginTop: 'auto', padding: '12px 16px 40px', background: '#fff', borderTop: '1px solid var(--border-default)' }}>
        <Button type="primary" size="large" block onClick={v.submitClose} style={v.bigBtn}>Close trip</Button>
        <Button type="text" size="large" block onClick={v.back}>Back</Button>
      </Flex>
    </Flex>
  </>
);

export default CloseTrip;
