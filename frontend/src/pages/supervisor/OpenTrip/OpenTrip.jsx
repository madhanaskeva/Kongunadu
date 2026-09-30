import React from 'react';
import { Alert, Avatar, Badge, Button, Card, Checkbox, Flex, Form, Input, Select, Tag, Typography } from 'antd';
import { Check, X } from 'lucide-react';
import { ENROUTE_LABEL } from '../../../utils/tripStatus';

// The screen handlers read e.target.value (a string, as the old select gave);
// antd Select hands over the bare value, so it is passed on in that shape.
const asEvent = value => ({ target: { value: value == null ? '' : String(value) } });
// A value that is not one of the options shows the placeholder, as before.
const pick = (options, value) => ((options || []).some(o => String(o.value) === String(value)) ? value : undefined);

export const OpenTrip = ({ v }) => (
  <>
    <Flex vertical style={{ flex: 1 }}>
      <Flex vertical gap={18} style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
          <Card size="small" variant="borderless" style={{ background: 'var(--surface-muted)' }}>
            <Typography.Text type="secondary" strong style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Trip number
            </Typography.Text>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: v.tripNumberColor, marginTop: 4, whiteSpace: 'nowrap' }}>{v.tripNumberPreview}</div>
            <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, lineHeight: 1.35 }}>{v.tripNumberNote}</Typography.Text>
          </Card>
          <Card size="small" variant="borderless" style={{ background: 'var(--surface-muted)' }}>
            <Typography.Text type="secondary" strong style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Branch</Typography.Text>
            <Typography.Text strong style={{ display: 'block', fontSize: 15, marginTop: 4 }}>{v.branchName}</Typography.Text>
            <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>From your login</Typography.Text>
          </Card>
        </div>
        {v.openHasErrors ? (
          <>
            <Alert type="error" title={`${v.openErrorCount} required fields are missing. Complete the highlighted fields to save this trip.`} />
          </>
        ) : null}
        <Form layout="vertical" requiredMark={false} component="div">
          <Form.Item label="Trip type" extra={v.typeHint}>
            <div role="radiogroup" aria-label="Trip type" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
              {(v.tripTypeTabs || []).map((tt, ttIdx) => (
                <React.Fragment key={ttIdx}>
                  <Button role="radio" aria-checked={tt.on} data-v={tt.value} onClick={v.setType} type={tt.on === 'true' ? 'primary' : 'default'} size="large" block>
                    {tt.label}
                  </Button>
                </React.Fragment>
              ))}
            </div>
          </Form.Item>
          {v.isBusiness ? (
            <>
              <Form.Item
                label="Client name"
                extra={v.clientHint}
                validateStatus={v.err.client ? 'error' : undefined}
                help={v.err.client ? 'Select the client this load belongs to.' : undefined}
              >
                <Select
                  size="large"
                  placeholder={(v.clientOptionsShown || []).length ? v.clientPlaceholder : 'None available'}
                  disabled={!(v.clientOptionsShown || []).length}
                  options={v.clientOptionsShown}
                  value={pick(v.clientOptionsShown, v.form.client)}
                  onChange={val => v.setClient(asEvent(val))}
                />
              </Form.Item>
              <Form.Item
                label="Vehicle number"
                extra={<span style={{ color: v.vehicleHintTone }}>{v.vehicleHint}</span>}
                validateStatus={v.err.vehicle ? 'error' : undefined}
                help={v.err.vehicle ? 'Select a vehicle.' : undefined}
              >
                <Select
                  size="large"
                  placeholder={(v.vehicleOptions || []).length ? 'Select available vehicle' : v.vehicleEmptyLabel || 'None available'}
                  disabled={!(v.vehicleOptions || []).length}
                  options={v.vehicleOptions}
                  value={pick(v.vehicleOptions, v.form.vehicle)}
                  onChange={val => v.setVehicle(asEvent(val))}
                />
              </Form.Item>
              <Form.Item
                label={<Flex gap={12} align="baseline">Driver name <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>{v.dc.tag}</Typography.Text></Flex>}
                extra={v.dc.hint}
                validateStatus={v.err.driver ? 'error' : undefined}
                help={v.err.driver ? v.driverErrText : undefined}
              >
                {v.dc.none ? (
                  <>
                    <Card size="small" style={{ borderStyle: 'dashed', borderWidth: 2, borderColor: v.dc.border }}>
                      <Typography.Text type="secondary">Select a vehicle first. Its mapped driver appears here to confirm.</Typography.Text>
                    </Card>
                  </>
                ) : null}
                {v.dc.has ? (
                  <Flex vertical gap={10}>
                    {(v.driverCards && v.driverCards.length > 0 ? v.driverCards : [v.dc]).map((card, cIdx) => (
                      <Card key={card.id || cIdx} size="small" style={{ borderWidth: 2, borderColor: card.border, background: card.bg }}>
                        <Flex align="center" gap={12}>
                          <Avatar aria-hidden="true" size={44} style={{ flex: 'none', background: card.avatarBg, color: card.avatarFg, fontWeight: 800 }}>
                            {card.initials}
                          </Avatar>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Typography.Text strong style={{ display: 'block', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: card.statusFg }}>
                              {card.status}
                            </Typography.Text>
                            <Typography.Text strong ellipsis style={{ display: 'block', marginTop: 2, fontSize: 17, lineHeight: 1.2 }}>
                              {card.name}
                            </Typography.Text>
                            <Typography.Text type="secondary" ellipsis style={{ display: 'block', fontSize: 13 }}>{card.sub}</Typography.Text>
                          </div>
                          {card.ask ? (
                            <Flex gap={8} style={{ flex: 'none' }}>
                              <Button size="large" danger icon={<X size={20} strokeWidth={3} />} onClick={() => v.rejectDriver(card.id)} aria-label="Not this driver, choose another" title="Choose another driver" />
                              <Button size="large" type="primary" icon={<Check size={22} strokeWidth={3} />} onClick={() => v.acceptDriver(card.id)} aria-label="Confirm this driver" title="Confirm driver" />
                            </Flex>
                          ) : null}
                          {card.ok ? (
                            <Button type="link" size="large" onClick={() => (v.driverCards || []).length > 1 ? v.removeDriver(card.id) : v.openDrvPick(card.id)} style={{ flex: 'none' }}>
                              {(v.driverCards || []).length > 1 ? 'Remove' : 'Change'}
                            </Button>
                          ) : null}
                        </Flex>
                      </Card>
                    ))}
                    {v.dc.ok ? (
                      <Flex justify="flex-end">
                        <Button type="dashed" size="small" onClick={() => v.openDrvPick('__add')}>
                          + Add another driver
                        </Button>
                      </Flex>
                    ) : null}
                  </Flex>
                ) : null}
                {v.dc.empty ? (
                  <>
                    <Alert
                      type="warning"
                      title={
                        <Flex vertical gap={12}>
                          <span>{v.dc.emptyText}</span>
                          <Button size="large" block onClick={() => v.openDrvPick()}>Choose driver</Button>
                        </Flex>
                      }
                    />
                  </>
                ) : null}
              </Form.Item>
              <Form.Item
                label="Loading location"
                extra={v.loadingHint}
                validateStatus={v.err.loading ? 'error' : undefined}
                help={v.err.loading ? 'Select the loading location.' : undefined}
              >
                <Select
                  size="large"
                  placeholder={(v.locationOptions || []).length ? 'Select predefined location' : v.locationEmptyLabel || 'None available'}
                  disabled={!(v.locationOptions || []).length}
                  options={v.locationOptions}
                  value={pick(v.locationOptions, v.form.loading)}
                  onChange={val => v.setLoading(asEvent(val))}
                />
              </Form.Item>
              {v.addLocOpen ? (
                <>
                  <Card size="small" style={{ marginTop: -8, marginBottom: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: 'var(--color-brand)', background: 'var(--color-brand-tint)' }}>
                    <Flex vertical gap={12}>
                      <Badge status="processing" color="green" text={<Typography.Text strong style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--kr-green-900)' }}>New loading point · GPS captured</Typography.Text>} />
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-heading)' }}>13.0827° N, 80.2707° E</div>
                        <Typography.Text style={{ fontSize: 13 }}>Accuracy 8 m · taken at {v.nowHM} from where you are standing.</Typography.Text>
                      </div>
                      <Form.Item label="Location name" validateStatus={v.newLocErr ? 'error' : undefined} help={v.newLocErr || undefined} style={{ marginBottom: 0 }}>
                        <Input size="large" placeholder="e.g. Oragadam Plant Gate 3" value={v.newLoc.name ?? ''} onChange={v.setNewLocName} />
                      </Form.Item>
                      <Typography.Text type="secondary" style={{ fontSize: 13 }}>Saved to {v.branchName} with a 100 m safe radius. Head Office can correct it later.</Typography.Text>
                      <Flex wrap gap={8}>
                        <Button type="primary" size="large" onClick={v.saveNewLoc}>Use this point</Button>
                        <Button type="text" size="large" onClick={v.cancelNewLoc}>Cancel</Button>
                      </Flex>
                    </Flex>
                  </Card>
                </>
              ) : null}
              <Form.Item
                label={<Flex gap={12} align="baseline">Unloading location <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>{v.unloadCountLabel}</Typography.Text></Flex>}
                validateStatus={v.err.unloading ? 'error' : undefined}
                help={v.err.unloading ? v.unloadErrText : undefined}
              >
                <Flex vertical gap={10}>
                  {v.hasCustomers ? (
                    <>
                      <div role="radiogroup" aria-label="Unloading drops" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
                        {(v.unloadModeTabs || []).map((um, umIdx) => (
                          <React.Fragment key={umIdx}>
                            <Button role="radio" aria-checked={um.on} data-v={um.value} onClick={v.setUnloadMode} type={um.on === 'true' ? 'primary' : 'default'} block style={{ height: 'auto', minHeight: 48, padding: '6px 10px' }}>
                              <Flex vertical align="center" gap={1}>
                                <span>{um.label}</span>
                                <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.85 }}>{um.sub}</span>
                              </Flex>
                            </Button>
                          </React.Fragment>
                        ))}
                      </div>
                    </>
                  ) : null}
                  {v.unloadSingle ? (
                    <>
                      <Form.Item label="Customer" extra={v.singleCustInfo || undefined} style={{ marginBottom: 0 }}>
                        <Select
                          size="large"
                          placeholder={(v.singleCustOptions || []).length ? 'Select unloading customer' : 'None available'}
                          disabled={!(v.singleCustOptions || []).length}
                          options={v.singleCustOptions}
                          value={pick(v.singleCustOptions, v.singleCust)}
                          onChange={val => v.setSingleCust(asEvent(val))}
                        />
                      </Form.Item>
                    </>
                  ) : null}
                  {v.unloadMulti ? (
                    <>
                      <Card size="small" styles={{ body: { padding: 0 } }} style={{ overflow: 'hidden' }}>
                        {(v.customerOptions || []).map((c, cIdx) => (
                          <React.Fragment key={cIdx}>
                            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${c.divider}`, background: c.bg }}>
                              <Checkbox checked={!!c.on} onChange={c.toggle} style={v.fullRow}>
                                <Typography.Text strong>{c.name}</Typography.Text>
                                {c.sub ? <Typography.Text type="secondary" style={{ display: 'block', fontSize: 13 }}>{c.sub}</Typography.Text> : null}
                              </Checkbox>
                            </div>
                          </React.Fragment>
                        ))}
                      </Card>
                    </>
                  ) : null}
                  {v.noCustomers ? (
                    <>
                      <Card size="small" style={{ borderStyle: 'dashed', borderWidth: 2 }}>
                        <Typography.Text type="secondary">{v.unloadEmptyText}</Typography.Text>
                      </Card>
                    </>
                  ) : null}
                </Flex>
              </Form.Item>
              {v.routeKnown ? (
                <>
                  <Alert
                    type="warning"
                    style={{ marginTop: -8, marginBottom: 24 }}
                    title={
                      <span>
                        <strong>Route diversion alert is on.</strong>
                        {' '}{v.routeSummary} GPS raises an exception to Head Office if the vehicle leaves this corridor by more than 10 km.
                      </span>
                    }
                  />
                </>
              ) : null}
              <Form.Item
                label="Start KM"
                extra={v.startKmHint}
                validateStatus={v.err.startKm ? 'error' : undefined}
                help={v.err.startKm ? 'Enter the odometer reading. This is the vehicle’s first recorded trip.' : undefined}
              >
                <Input size="large" value={v.form.startKm ?? ''} onChange={v.setStartKm} inputMode="numeric" disabled={v.startKmLocked} suffix="km" />
              </Form.Item>
              <Form.Item label={<Flex gap={12} align="baseline">Remarks <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>Optional · {v.remarksCount}/250</Typography.Text></Flex>}>
                <Input.TextArea value={v.form.remarks} onChange={v.setRemarks} maxLength={250} rows={3} placeholder="Anything the admin should know about this trip" style={{ minHeight: 88, fontSize: 16 }} />
              </Form.Item>
            </>
          ) : null}
          {v.isNonBusiness ? (
            <>
              <Form.Item label="From" validateStatus={v.err.from ? 'error' : undefined} help={v.err.from ? 'Enter where the vehicle starts from.' : undefined}>
                <Input size="large" placeholder="e.g. Sriperumbudur hub" value={v.form.from ?? ''} onChange={v.setFrom} />
              </Form.Item>
              <Form.Item label="To" validateStatus={v.err.to ? 'error' : undefined} help={v.err.to ? 'Enter where the vehicle is going.' : undefined}>
                <Input size="large" placeholder="e.g. Ambattur service centre" value={v.form.to ?? ''} onChange={v.setTo} />
              </Form.Item>
              <Form.Item label="KM" extra="Distance from From to To." validateStatus={v.err.km ? 'error' : undefined} help={v.err.km ? 'Enter the distance in km.' : undefined}>
                <Input size="large" placeholder="0" value={v.form.km ?? ''} onChange={v.setKm} inputMode="numeric" suffix="km" />
              </Form.Item>
              <Form.Item
                label="Purpose"
                extra="Purposes are set by Head Office in the Admin Portal."
                validateStatus={v.err.reason ? 'error' : undefined}
                help={v.err.reason ? 'Select the purpose of this movement.' : undefined}
              >
                <Select
                  size="large"
                  placeholder={(v.reasonOptions || []).length ? 'Select purpose' : 'None available'}
                  disabled={!(v.reasonOptions || []).length}
                  options={v.reasonOptions}
                  value={pick(v.reasonOptions, v.form.reason)}
                  onChange={val => v.setReason(asEvent(val))}
                />
              </Form.Item>
              <Form.Item
                label="Vehicle number"
                extra={v.nbVehicleHint}
                validateStatus={v.err.vehicle ? 'error' : undefined}
                help={v.err.vehicle ? 'Select a vehicle.' : undefined}
              >
                <Select
                  size="large"
                  placeholder={(v.vehicleOptions || []).length ? 'Select vehicle' : 'None available'}
                  disabled={!(v.vehicleOptions || []).length}
                  options={v.vehicleOptions}
                  value={pick(v.vehicleOptions, v.form.vehicle)}
                  onChange={val => v.setVehicle(asEvent(val))}
                />
              </Form.Item>
              <Form.Item
                label={<Flex gap={12} align="baseline">Driver name <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>{v.dc.tag}</Typography.Text></Flex>}
                extra={v.dc.hint}
                validateStatus={v.err.driver ? 'error' : undefined}
                help={v.err.driver ? v.driverErrText : undefined}
              >
                {v.dc.none ? (
                  <>
                    <Card size="small" style={{ borderStyle: 'dashed', borderWidth: 2, borderColor: v.dc.border }}>
                      <Typography.Text type="secondary">Select a vehicle first. Its mapped driver appears here to confirm.</Typography.Text>
                    </Card>
                  </>
                ) : null}
                {v.dc.has ? (
                  <Flex vertical gap={10}>
                    {(v.driverCards && v.driverCards.length > 0 ? v.driverCards : [v.dc]).map((card, cIdx) => (
                      <Card key={card.id || cIdx} size="small" style={{ borderWidth: 2, borderColor: card.border, background: card.bg }}>
                        <Flex align="center" gap={12}>
                          <Avatar aria-hidden="true" size={44} style={{ flex: 'none', background: card.avatarBg, color: card.avatarFg, fontWeight: 800 }}>
                            {card.initials}
                          </Avatar>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Typography.Text strong style={{ display: 'block', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: card.statusFg }}>
                              {card.status}
                            </Typography.Text>
                            <Typography.Text strong ellipsis style={{ display: 'block', marginTop: 2, fontSize: 17, lineHeight: 1.2 }}>
                              {card.name}
                            </Typography.Text>
                            <Typography.Text type="secondary" ellipsis style={{ display: 'block', fontSize: 13 }}>{card.sub}</Typography.Text>
                          </div>
                          {card.ask ? (
                            <Flex gap={8} style={{ flex: 'none' }}>
                              <Button size="large" danger icon={<X size={20} strokeWidth={3} />} onClick={() => v.rejectDriver(card.id)} aria-label="Not this driver, choose another" title="Choose another driver" />
                              <Button size="large" type="primary" icon={<Check size={22} strokeWidth={3} />} onClick={() => v.acceptDriver(card.id)} aria-label="Confirm this driver" title="Confirm driver" />
                            </Flex>
                          ) : null}
                          {card.ok ? (
                            <Button type="link" size="large" onClick={() => (v.driverCards || []).length > 1 ? v.removeDriver(card.id) : v.openDrvPick(card.id)} style={{ flex: 'none' }}>
                              {(v.driverCards || []).length > 1 ? 'Remove' : 'Change'}
                            </Button>
                          ) : null}
                        </Flex>
                      </Card>
                    ))}
                    {v.dc.ok ? (
                      <Flex justify="flex-end">
                        <Button type="dashed" size="small" onClick={() => v.openDrvPick('__add')}>
                          + Add another driver
                        </Button>
                      </Flex>
                    ) : null}
                  </Flex>
                ) : null}
                {v.dc.empty ? (
                  <>
                    <Alert
                      type="warning"
                      title={
                        <Flex vertical gap={12}>
                          <span>{v.dc.emptyText}</span>
                          <Button size="large" block onClick={() => v.openDrvPick()}>Choose driver</Button>
                        </Flex>
                      }
                    />
                  </>
                ) : null}
              </Form.Item>
            </>
          ) : null}
        </Form>
        <Card size="small" variant="borderless" style={{ background: 'var(--surface-muted)' }}>
          <Flex justify="space-between" align="center">
            <Typography.Text type="secondary">Status on save</Typography.Text>
            <Tag color="processing" variant="filled">{ENROUTE_LABEL}</Tag>
          </Flex>
        </Card>
      </Flex>
      <Flex vertical gap={8} style={{ position: 'sticky', bottom: 0, marginTop: 'auto', padding: '12px 16px 40px', background: '#fff', borderTop: '1px solid var(--border-default)' }}>
        <Button type="primary" size="large" block onClick={v.reviewOpen} style={v.bigBtn}>Save trip</Button>
        <Button type="text" size="large" block onClick={v.askDiscard}>Discard</Button>
      </Flex>
    </Flex>
  </>
);

export default OpenTrip;
