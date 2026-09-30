import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  ConfigProvider,
  Descriptions,
  Divider,
  Flex,
  Form,
  Image,
  Input,
  Modal,
  Row,
  Col,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
} from 'antd';
import { Fuel, MapPin, Plus, Upload as UploadIcon } from 'lucide-react';
import { useTMSAdmin } from '../../context/TMSAdminContext';

/* Small uppercase label used for the drawer kicker and the review panels' block titles. */
const kickerStyle = { fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' };

const SEVERITY_COLOR = { High: 'error', Medium: 'warning' };
const DRIVER_STATUS_COLOR = { Approved: 'success', Rejected: 'error', Pending: 'warning', 'Pending approval': 'warning' };

/* ── Multi-select helpers ────────────────────────────────────────────
   Same value contract the old checkbox dropdown had: the stored value is an
   array of string values (it may also arrive as a comma-separated string of
   ids or names), and an option counts as picked when a stored entry matches
   its value, its label, or the start of its label. On change the picked
   options are emitted as their values; stored entries that match no option
   are kept, as before. */
const normalizeCheckOptions = (options) =>
  (options || []).map((opt) =>
    typeof opt === 'string'
      ? { value: opt, label: opt }
      : { value: String(opt.value ?? opt.id ?? opt.name ?? ''), label: String(opt.label ?? opt.name ?? opt.value ?? '') }
  );

const toValueList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
  return [String(value)];
};

const entryMatches = (opt, v) => {
  const lv = v.toLowerCase();
  const ll = opt.label.toLowerCase();
  return (
    v === opt.value ||
    v === opt.label ||
    lv === ll ||
    lv === opt.value.toLowerCase() ||
    ll.startsWith(lv + ' ') ||
    ll.startsWith(lv + ' (') ||
    ll.startsWith(lv + ' ·')
  );
};

/* Props for an antd multiple Select that keeps the contract above.
   onPick(values, labelString) receives the next stored array and the joined labels. */
const multiSelectProps = ({ value, options, placeholder, noun, onPick }) => {
  const opts = normalizeCheckOptions(options);
  const selectedValues = toValueList(value);
  const picked = opts.filter((o) => selectedValues.some((v) => entryMatches(o, v))).map((o) => o.value);
  const unmatched = selectedValues.filter((v) => !opts.some((o) => entryMatches(o, v)));
  const nounPlural = noun === 'supervisor' ? 'supervisors' : noun === 'client' ? 'clients' : `${noun}s`;
  const emit = (nextPicked) => {
    const next = [...unmatched, ...nextPicked];
    const labels = opts.filter((o) => next.includes(o.value) || next.includes(o.label)).map((o) => o.label);
    onPick(next, labels.join(', '));
  };
  return {
    mode: 'multiple',
    value: picked,
    options: opts,
    placeholder,
    allowClear: true,
    maxTagCount: 'responsive',
    showSearch: {
      filterOption: (input, opt) => {
        const q = input.trim().toLowerCase();
        return !q || String(opt.label).toLowerCase().includes(q) || String(opt.value).toLowerCase().includes(q);
      },
    },
    notFoundContent: `No matching ${nounPlural} found`,
    onChange: (vals) => emit(vals || []),
    popupRender: (menu) => (
      <>
        <Flex justify="space-between" align="center" style={{ padding: '2px 8px' }}>
          <Typography.Text type="secondary">{opts.length} available</Typography.Text>
          <Space size={0} separator={<Typography.Text type="secondary">|</Typography.Text>}>
            <Button type="link" size="small" onClick={() => emit(opts.map((o) => o.value))}>
              Select all
            </Button>
            <Button type="link" size="small" onClick={() => emit([])}>
              Clear
            </Button>
          </Space>
        </Flex>
        <Divider style={{ margin: '4px 0' }} />
        {menu}
      </>
    ),
  };
};

export const AdminDrawer = () => {
  const {
    drawer,
    setDrawer,
    form,
    setForm,
    formError,
    setFormError,
    excOverrides,
    setExcOverrides,
    excSel,
    excAssignees,
    setExcAssignees,
    excNote,
    setExcNote,
    drvReqs,
    rejectReason,
    setRejectReason,
    decideDriver,
    saveMaster,
    setVehTank,
    normalizeRecord,
    pushNotice,
    showToast,
    shrinkImage,
    navTo,
    T,
  } = useTMSAdmin();

  const [fieldErrors, setFieldErrors] = useState({});
  // Text typed into the "add bunk / add location" boxes, keyed by field.
  const [listDrafts, setListDrafts] = useState({});
  // Dropdowns render inside the modal's scrolling body, so a list opened near
  // the bottom flips upward instead of spilling past the modal to the screen edge.
  const popupHostRef = useRef(null);
  const popupContainer = () => popupHostRef.current || document.body;

  useEffect(() => {
    setFieldErrors({});
    setListDrafts({});
  }, [drawer]);

  if (!drawer) return null;

  const tms = T();
  const closeDrawer = () => setDrawer(null);

  // Exception drawer handling
  const exc = (tms.exceptions || []).map(x => ({ ...x, ...(excOverrides[x.id] || {}) })).find(x => x.id === excSel) || {};
  const v = tms.V[exc.vehicle];
  const tr = tms.T[exc.trip];
  const excDetail = {
    ...exc,
    vehicleNumber: v ? v.number : '—',
    tripNumber: tr ? tr.number : '—',
    branchName: (tms.B[exc.branch] || {}).name,
    sevColor: SEVERITY_COLOR[exc.severity] || 'default',
    rows: [
      ['Type', exc.type],
      ['Vehicle', v ? v.number : '—'],
      ['Trip', tr ? tr.number : '—'],
      ['Branch', (tms.B[exc.branch] || {}).name],
      ['Raised', exc.raised],
      ['Assignee', exc.assignee],
    ],
  };

  // Supervisors are listed branch-first: the ones who own this vehicle's branch
  // are the people who can actually act on the exception.
  const supervisorOptions = [...(tms.supervisors || [])]
    .sort((a, bb) => (a.branch === exc.branch ? 0 : 1) - (bb.branch === exc.branch ? 0 : 1))
    .map(sup => ({
      value: sup.id,
      label: `${sup.name} · ${(tms.B[sup.branch] || {}).name || 'No branch'}`,
    }));

  const assigneeNames = excAssignees.map(id => (tms.S[id] || {}).name).filter(Boolean);

  // Submit dispatches the exception: it is assigned to everyone ticked and each
  // of them gets it as an alert in their Supervisor app.
  const handleExcSubmit = () => {
    if (!excAssignees.length) {
      showToast('warning', 'Pick at least one supervisor', 'Tick who should be alerted before sending.');
      return;
    }
    const assignee = assigneeNames.length > 1
      ? `${assigneeNames[0]} +${assigneeNames.length - 1}`
      : assigneeNames[0];
    const note = excNote.trim();

    setExcOverrides(prev => ({
      ...prev,
      [exc.id]: {
        ...(prev[exc.id] || {}),
        status: 'Under review',
        assignee,
        assigneeIds: excAssignees,
        note,
        alertedAt: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      },
    }));
    closeDrawer();
    showToast(
      'success',
      `Alert sent to ${excAssignees.length} supervisor${excAssignees.length > 1 ? 's' : ''}`,
      `${exc.type} on ${excDetail.vehicleNumber} · ${assigneeNames.join(', ')}`
    );

    // One notice per supervisor, addressed by id, so it reaches only them.
    excAssignees.forEach(supId => {
      const sup = tms.S[supId] || {};
      pushNotice({
        kind: 'action',
        priority: exc.severity === 'High' ? 'Urgent' : 'Normal',
        to: [supId],
        branch: sup.branch || exc.branch,
        title: `${exc.type} · action needed`,
        body: exc.detail,
        note,
        rows: [
          ['Exception', `${exc.id} · ${exc.severity} severity`],
          ['Vehicle', excDetail.vehicleNumber],
          ['Trip', excDetail.tripNumber],
          ['Raised', exc.raised],
          ['Assigned to', assigneeNames.join(', ')],
          ...(note ? [['Message', note]] : []),
        ],
        link: exc.trip ? { trip: exc.trip } : null,
        linkLabel: 'View trip',
      });
    });
  };

  // Driver Request drawer handling
  const drvReq = drawer.isDriverReq ? (drvReqs.find(r => r.id === drawer.reqId) || (tms.drivers || []).find(x => x.id === drawer.reqId)) : null;
  const isReq = drvReq && !!drvReq.supervisorName;
  const drvStatus = drvReq ? (isReq ? (drvReq.status === 'Pending' ? 'Pending approval' : drvReq.status) : drvReq.approval) : '';
  const isPendingDrv = drvStatus === 'Pending approval' || drvStatus === 'Pending';
  const mask = a => a ? '•••• ' + String(a).slice(-4) + ` (${String(a).length} digits)` : '—';

  // A form whose shape depends on its own answers resolves these per render.
  const saveLabelOf = (f) => (typeof drawer.saveLabel === 'function' ? drawer.saveLabel(f) : drawer.saveLabel);
  const requiredOf = (f) => (typeof drawer.required === 'function' ? drawer.required(f) : drawer.required) || [];

  // Save form handling
  const handleSaveForm = () => {
    const reqList = requiredOf(form);
    const isValMissing = (k) => {
      const val = form[k];
      if (val === undefined || val === null) return true;
      if (typeof val === 'string') return !val.trim();
      if (Array.isArray(val)) return val.length === 0;
      if (typeof val === 'object') return false;
      return false;
    };
    const missing = reqList.filter(isValMissing);
    if (missing.length) {
      const missingErrs = {};
      missing.forEach(k => {
        missingErrs[k] = 'This field is required.';
      });
      setFieldErrors(missingErrs);
      setFormError(`${missing.length} required ${missing.length > 1 ? 'fields are' : 'field is'} missing.`);
      return;
    }

    if (drawer.validate) {
      const errs = drawer.validate(form) || {};
      const badKeys = Object.keys(errs).filter(k => !!errs[k]);
      if (badKeys.length > 0) {
        setFieldErrors(errs);
        setFormError(errs[badKeys[0]]);
        return;
      }
    }

    setFieldErrors({});
    setFormError('');

    if (drawer.onSave) {
      drawer.onSave(form);
      closeDrawer();
      return;
    }

    if (drawer.isNotice) {
      const to = form.branch === 'all' ? 'All branches' : ((tms.B[form.branch] || {}).name || '') + ' supervisors';
      pushNotice({
        kind: 'message',
        branch: form.branch,
        priority: form.priority || 'Normal',
        title: form.title.trim(),
        body: form.body.trim(),
        rows: [
          ['Sent to', to],
          ['Priority', form.priority || 'Normal'],
          ['Sent by', 'Head Office Admin'],
        ],
      });
      closeDrawer();
      showToast('success', 'Notice sent', `${form.title.trim()} · ${to}`);
      return;
    }

    if (drawer.isMaster && drawer.masterKey) {
      const isNew = !form.id;
      const rec = normalizeRecord(drawer.masterKey, form, isNew);
      saveMaster(drawer.masterKey, rec, isNew);
      // Portal users sign in with the password set here
      if (drawer.masterKey === 'users' && rec.email && rec.password) {
        try {
          const pw = JSON.parse(localStorage.getItem('krl_custom_passwords') || '{}') || {};
          pw[rec.email.toLowerCase().trim()] = rec.password;
          localStorage.setItem('krl_custom_passwords', JSON.stringify(pw));
        } catch (e) {}
      }
      if (drawer.masterKey === 'vehicles' && rec.tank) {
        setVehTank(rec.id, rec.tank);
      }
    }

    closeDrawer();
    showToast('success', String(saveLabelOf(form)).replace(/^Create|^Save|^Send/, m => ({ Create: 'Created', Save: 'Saved', Send: 'Sent' })[m]), `${drawer.title} · ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`);
  };

  // Called from antd Upload's beforeUpload (which returns false, so nothing is
  // posted anywhere); the photo is shrunk and stored on the form as before.
  const pickFormUpload = (file, key) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      showToast('warning', 'Not an image', 'Upload a JPG or PNG photo of the document.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('warning', 'File too large', 'Keep the photo under 5 MB.');
      return;
    }
    const kb = file.size / 1024;
    const size = kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(kb)) + ' KB';
    shrinkImage(file).then(url => {
      setForm({ ...form, [key]: { name: file.name, size, url } });
    });
  };

  const clearFormUpload = (key) => {
    setForm({ ...form, [key]: null });
  };

  const toggleFormCheck = (key, val) => {
    const cur = Array.isArray(form[key]) ? form[key] : [];
    setForm({
      ...form,
      [key]: cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val]
    });
  };


  const clearFieldError = (key) => {
    if (fieldErrors[key]) setFieldErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const reqList = requiredOf(form);

  // Form.Item error / hint wiring shared by every field row.
  const itemStatus = (key, hintText) => ({
    validateStatus: fieldErrors[key] ? 'error' : undefined,
    help: fieldErrors[key] || undefined,
    extra: !fieldErrors[key] && hintText ? hintText : undefined,
    required: reqList.includes(key),
  });

  const docCard = (url, alt, placeholder, caption) => (
    <Card
      size="small"
      cover={
        url ? (
          <Image src={url} alt={alt} height={110} width="100%" style={{ objectFit: 'cover' }} />
        ) : (
          <Flex align="center" justify="center" style={{ height: 110, background: 'var(--surface-muted)' }}>
            <Typography.Text type="secondary">{placeholder}</Typography.Text>
          </Flex>
        )
      }
    >
      <Typography.Text strong>{caption}</Typography.Text>
    </Card>
  );

  return (
    <Modal
      open={!!drawer}
      onCancel={closeDrawer}
      width={560}
      centered
      destroyOnHidden
      mask={{ closable: true }}
      closable={{ 'aria-label': 'Close' }}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 } }}
      title={
        <div>
          <Typography.Text type="secondary" style={kickerStyle}>
            {drawer.kicker}
          </Typography.Text>
          <Typography.Title level={4} style={{ margin: '2px 0 0' }}>
            {drawer.title}
          </Typography.Title>
        </div>
      }
      footer={
        <Flex justify="flex-end" wrap gap={12}>
          <Button type="text" onClick={closeDrawer}>
            Cancel
          </Button>
          {drawer.isException && exc.status !== 'Resolved' && (
            <Button type="primary" onClick={handleExcSubmit} disabled={!excAssignees.length}>
              Submit
            </Button>
          )}
          {drawer.isDriverReq && isPendingDrv && (
            <>
              <Button danger onClick={() => decideDriver(drawer.reqId, 'Rejected', rejectReason.trim())}>
                Reject
              </Button>
              <Button type="primary" onClick={() => decideDriver(drawer.reqId, 'Approved')}>
                Approve driver
              </Button>
            </>
          )}
          {drawer.isForm && (
            <Button type="primary" onClick={handleSaveForm}>
              {saveLabelOf(form)}
            </Button>
          )}
        </Flex>
      }
    >
      <ConfigProvider
        theme={{ components: { Form: { itemMarginBottom: 0 } } }}
        getPopupContainer={popupContainer}
      >
        <div ref={popupHostRef} style={{ position: 'relative' }}>
        <Form layout="vertical" component={false}>
          <Flex vertical gap={16}>
            {/* EXCEPTION DETAILS */}
            {drawer.isException && (
              <>
                <Flex gap={8} wrap>
                  <Tag color={excDetail.sevColor}>{excDetail.severity}</Tag>
                  <Tag>{excDetail.status}</Tag>
                </Flex>
                <Typography.Paragraph style={{ margin: 0, fontSize: 15 }}>{excDetail.detail}</Typography.Paragraph>
                <Descriptions
                  bordered
                  size="small"
                  column={1}
                  items={excDetail.rows.map(([k, val], i) => ({ key: i, label: k, children: val }))}
                />
                {exc.trip && (
                  <Button
                    type="link"
                    style={{ padding: 0, alignSelf: 'flex-start' }}
                    onClick={() => {
                      closeDrawer();
                      navTo('trip', { selectedTrip: exc.trip });
                    }}
                  >
                    Open trip {excDetail.tripNumber} →
                  </Button>
                )}
                <Form.Item
                  label="Alert supervisors"
                  required
                  extra={
                    excAssignees.length === 0
                      ? 'Each supervisor you tick gets this exception as an alert in their app.'
                      : `${excAssignees.length} supervisor${excAssignees.length > 1 ? 's' : ''} will be alerted on submit.`
                  }
                >
                  <Select
                    {...multiSelectProps({
                      value: excAssignees,
                      options: supervisorOptions,
                      placeholder: 'Choose supervisors',
                      noun: 'supervisor',
                      onPick: (next) => setExcAssignees(next || []),
                    })}
                  />
                </Form.Item>
                <Form.Item
                  label={
                    <span>
                      Message to supervisor <Typography.Text type="secondary">· optional</Typography.Text>
                    </span>
                  }
                >
                  <Input
                    placeholder="What should they check or do"
                    value={excNote}
                    onChange={(e) => setExcNote(e.target.value)}
                  />
                </Form.Item>
              </>
            )}

            {/* DRIVER APPROVAL REQUEST */}
            {drawer.isDriverReq && drvReq && (
              <>
                <Flex align="center" gap={10} wrap>
                  <Tag color={DRIVER_STATUS_COLOR[drvStatus] || 'warning'}>{drvStatus}</Tag>
                  <Typography.Text type="secondary">
                    {isReq ? `Requested by ${drvReq.supervisorName} · ${(tms.B[drvReq.branch] || {}).name} · ${drvReq.requestedAt}` : `${(tms.B[drvReq.branch] || {}).name} · already in driver master`}
                  </Typography.Text>
                </Flex>
                {drvReq.vehicle && (
                  <Alert
                    type="warning"
                    title={`The supervisor has already assigned this driver to a trip being opened on ${drvReq.vehicle}. Rejecting removes the driver from that trip form.`}
                  />
                )}
                <Descriptions
                  title={<Typography.Text type="secondary" style={kickerStyle}>Driver details</Typography.Text>}
                  bordered
                  size="small"
                  column={1}
                  items={[
                    { key: 'name', label: 'Name', children: drvReq.name },
                    { key: 'licence', label: 'Licence number', children: drvReq.licence },
                    { key: 'phone', label: 'Mobile', children: `+91 ${drvReq.phone}` },
                  ]}
                />

                {isReq && (
                  <>
                    <Descriptions
                      title={<Typography.Text type="secondary" style={kickerStyle}>Bank account</Typography.Text>}
                      bordered
                      size="small"
                      column={1}
                      items={[
                        { key: 'holder', label: 'Account holder', children: drvReq.holder || drvReq.name },
                        { key: 'account', label: 'Account number', children: mask(drvReq.account || '1234567890') },
                        { key: 'ifsc', label: 'IFSC', children: drvReq.ifsc || 'SBIN0001234' },
                      ]}
                    />

                    <div>
                      <Typography.Text type="secondary" style={{ ...kickerStyle, display: 'block', marginBottom: 6 }}>
                        Documents
                      </Typography.Text>
                      <Row gutter={[12, 12]}>
                        <Col xs={24} sm={12}>
                          {docCard(drvReq.licImg?.url, 'Licence', 'Driving Licence', 'Licence Image')}
                        </Col>
                        <Col xs={24} sm={12}>
                          {docCard(drvReq.aadhaarImg?.url, 'Aadhaar', 'Aadhaar Card', 'Aadhaar Image')}
                        </Col>
                      </Row>
                    </div>
                  </>
                )}

                {isPendingDrv && (
                  <Form.Item label="Reason if rejecting">
                    <Input
                      placeholder="Optional · sent to the supervisor"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value.slice(0, 200))}
                    />
                  </Form.Item>
                )}
              </>
            )}

            {/* GENERIC RECORD / NOTICE FORM */}
            {drawer.isForm && (
              <>
                {drawer.intro && <Alert type="info" title={drawer.intro} />}
                {drawer.details && drawer.details.length > 0 && (
                  <Descriptions
                    bordered
                    size="small"
                    column={1}
                    items={drawer.details.map(([dLabel, dValue, dTone], i) => ({
                      key: i,
                      label: dLabel,
                      children: (
                        <Typography.Text strong type={dTone === 'bad' ? 'danger' : undefined}>
                          {dValue == null || dValue === '' ? '—' : dValue}
                        </Typography.Text>
                      ),
                    }))}
                  />
                )}

                {formError && <Alert type="error" showIcon title={formError} />}

                {drawer.isNotice && (
                  <Alert
                    type="success"
                    title="Supervisors see this on the Notifications page of the mobile app with your name and the time sent. Urgent notices also pop up on screen."
                  />
                )}

                {drawer.isTripEdit && (
                  <Alert
                    type="warning"
                    title="Edits to trip records are logged with your user, timestamp and the previous values. Supervisors cannot edit saved trips."
                  />
                )}

                {drawer.fields && drawer.fields.map(([key, label, opts, hint, extra = {}], idx) => {
                  if (extra.when && !extra.when(form)) return null;
                  const isSection = opts === 'section';
                  const isUpload = opts === 'upload';
                  const isArea = opts === 'textarea';
                  const isChecks = opts === 'checks';
                  const isBunksInput = opts === 'bunks-input' || key === 'authorizedBunks';
                  const isLocationsInput = opts === 'locations-input' || key === 'loadingLocations';
                  const isCheckboxSelect = (opts === 'checkbox-select'
                    || (key === 'clients' && extra && extra.options)
                    || (key === 'supervisors' && extra && extra.options)) && !isBunksInput && !isLocationsInput;
                  const isSelect = Array.isArray(opts);
                  const raw = form[key];
                  const file = isUpload && raw && typeof raw === 'object' ? raw : null;

                  // Repeatable name lists (authorised fuel bunks / a client's loading locations):
                  // stored as an array of trimmed, case-insensitively unique strings.
                  if (isBunksInput || isLocationsInput) {
                    const isLoc = !isBunksInput;
                    const list = Array.isArray(raw)
                      ? (isLoc ? raw.filter(Boolean) : raw)
                      : typeof raw === 'string' && raw
                      ? raw.split(',').map((s) => s.trim()).filter(Boolean)
                      : [];
                    const draft = listDrafts[key] || '';
                    const setDraft = (text) => setListDrafts(prev => ({ ...prev, [key]: text }));
                    const setList = (nextVal) => {
                      setForm(prev => ({ ...prev, [key]: nextVal }));
                      clearFieldError(key);
                    };
                    const addItem = () => {
                      const trimmed = draft.trim();
                      if (!trimmed) return;
                      if (!list.some((l) => l.toLowerCase() === trimmed.toLowerCase())) {
                        setList([...list, trimmed]);
                      }
                      setDraft('');
                    };
                    const placeholder = typeof hint === 'string'
                      ? hint
                      : isLoc
                      ? 'Type a loading location (e.g. Sriperumbudur Cryogenic Hub)'
                      : 'Type bunk name manually (e.g. IOC – Salem Highway Hub)';
                    const helpText = isLoc
                      ? (extra.hint || (
                        <>
                          Type a location and click <strong>+ Add</strong> (or press Enter). Each one is saved to the
                          Loading Location Master under this client, where you can set its address, safe radius and GPS.
                        </>
                      ))
                      : <>Type a bunk name above and click <strong>+ Add</strong> (or press Enter) to authorize it for this route.</>;
                    const ItemIcon = isLoc ? MapPin : Fuel;
                    return (
                      <Form.Item
                        key={idx}
                        label={
                          <Space size={8}>
                            {label}
                            {list.length > 0 && (
                              <Tag color="success" variant="filled">
                                {isLoc
                                  ? `${list.length} location${list.length > 1 ? 's' : ''}`
                                  : `${list.length} bunk${list.length > 1 ? 's' : ''} authorized`}
                              </Tag>
                            )}
                          </Space>
                        }
                        {...itemStatus(key, helpText)}
                      >
                        <Flex vertical gap={8}>
                          <Space.Compact block>
                            <Input
                              value={draft}
                              placeholder={placeholder}
                              onChange={(e) => setDraft(e.target.value)}
                              onPressEnter={(e) => {
                                e.preventDefault();
                                addItem();
                              }}
                            />
                            <Button type="primary" icon={<Plus size={16} />} disabled={!draft.trim()} onClick={addItem}>
                              Add
                            </Button>
                          </Space.Compact>
                          {list.length === 0 ? (
                            <Typography.Text type="secondary" italic>
                              {isLoc ? 'No loading location added for this client.' : 'No authorized bunks added for this route.'}
                            </Typography.Text>
                          ) : (
                            <Flex wrap gap={8}>
                              {list.map((itemName, i) => (
                                <Tag
                                  key={`${itemName}-${i}`}
                                  color="success"
                                  icon={<ItemIcon size={14} />}
                                  closable={{ 'aria-label': `Remove ${itemName}` }}
                                  onClose={(e) => {
                                    e.preventDefault();
                                    setList(list.filter((_, j) => j !== i));
                                  }}
                                >
                                  {itemName}
                                </Tag>
                              ))}
                            </Flex>
                          )}
                        </Flex>
                      </Form.Item>
                    );
                  }

                  if (isCheckboxSelect) {
                    const options = (typeof extra.options === 'function' ? extra.options(form) : extra.options) || (Array.isArray(opts) ? opts : []);
                    return (
                      <Form.Item key={idx} label={label} {...itemStatus(key)}>
                        <Select
                          aria-label={label}
                          {...multiSelectProps({
                            value: raw,
                            options,
                            placeholder: hint && typeof hint === 'string' ? hint : `Select ${label.toLowerCase()}`,
                            noun: extra.itemNoun || (key === 'supervisors' ? 'supervisor' : 'client'),
                            onPick: (val, str) => {
                              setForm(prev => ({
                                ...prev,
                                [key]: val,
                                [`${key}Names`]: str,
                                ...(key === 'clients' ? { clientIds: val } : {}),
                                ...(key === 'supervisors' ? { supervisorIds: val } : {}),
                              }));
                              clearFieldError(key);
                            },
                          })}
                        />
                      </Form.Item>
                    );
                  }

                  if (isSection) {
                    return (
                      <Divider key={idx} titlePlacement="start" style={{ margin: '4px 0 0' }}>
                        <Typography.Text strong style={kickerStyle}>{label}</Typography.Text>
                      </Divider>
                    );
                  }

                  if (isSelect) {
                    const options = typeof opts[0] === 'string' ? opts.map(o => ({ value: o, label: o })) : opts;
                    return (
                      <Form.Item key={idx} label={label} {...itemStatus(key, hint && typeof hint === 'string' ? hint : undefined)}>
                        <Select
                          aria-label={label}
                          value={raw === '' || raw == null ? undefined : raw}
                          onChange={(v) => {
                            setForm({ ...form, [key]: v === undefined ? '' : v });
                            clearFieldError(key);
                          }}
                          options={options}
                          placeholder="Select"
                        />
                      </Form.Item>
                    );
                  }

                  if (isChecks) {
                    const picked = Array.isArray(raw) ? raw : [];
                    const options = extra.options || [];
                    return (
                      <Form.Item key={idx} label={label} {...itemStatus(key)}>
                        <Flex wrap gap={8} role="group" aria-label={label}>
                          {options.map(o => (
                            <Checkbox
                              key={o.value}
                              checked={picked.includes(o.value)}
                              onChange={() => {
                                toggleFormCheck(key, o.value);
                                clearFieldError(key);
                              }}
                            >
                              {o.label}
                            </Checkbox>
                          ))}
                        </Flex>
                      </Form.Item>
                    );
                  }

                  if (isUpload) {
                    return (
                      <Form.Item key={idx} label={label} {...itemStatus(key)} extra={hint}>
                        {!file ? (
                          <Upload.Dragger
                            accept="image/*"
                            showUploadList={false}
                            maxCount={1}
                            beforeUpload={(picked) => {
                              pickFormUpload(picked, key);
                              clearFieldError(key);
                              return false;
                            }}
                          >
                            <Space>
                              <UploadIcon size={18} />
                              <Typography.Text strong type={fieldErrors[key] ? 'danger' : undefined}>
                                Upload photo (JPG / PNG)
                              </Typography.Text>
                            </Space>
                          </Upload.Dragger>
                        ) : (
                          <Alert
                            type="success"
                            title={`${file.name} (${file.size})`}
                            action={
                              <Button type="link" danger size="small" onClick={() => clearFormUpload(key)}>
                                Remove
                              </Button>
                            }
                          />
                        )}
                      </Form.Item>
                    );
                  }

                  if (isArea) {
                    return (
                      <Form.Item key={idx} label={label} {...itemStatus(key)}>
                        <Input.TextArea
                          rows={4}
                          placeholder={hint || ''}
                          value={raw ?? ''}
                          onChange={(e) => {
                            setForm({ ...form, [key]: e.target.value });
                            clearFieldError(key);
                          }}
                        />
                      </Form.Item>
                    );
                  }

                  if (extra.type === 'password') {
                    return (
                      <Form.Item key={idx} label={label} {...itemStatus(key, extra.hint)}>
                        <Input.Password
                          value={raw ?? ''}
                          placeholder={hint || ''}
                          autoComplete="new-password"
                          onChange={(e) => {
                            setForm({ ...form, [key]: e.target.value });
                            clearFieldError(key);
                          }}
                        />
                      </Form.Item>
                    );
                  }

                  // Default input text / number (kept as the typed string, as before)
                  const textInput = (
                    <Input
                      type={extra.clean === 'account' || extra.clean === 'litres' ? 'number' : 'text'}
                      placeholder={hint || ''}
                      value={raw ?? ''}
                      onChange={(e) => {
                        setForm({ ...form, [key]: e.target.value });
                        clearFieldError(key);
                      }}
                    />
                  );
                  return (
                    <Form.Item key={idx} label={label} {...itemStatus(key, extra.hint)}>
                      {extra.prefix ? (
                        <Space.Compact block>
                          <Space.Addon>{extra.prefix}</Space.Addon>
                          {textInput}
                        </Space.Compact>
                      ) : (
                        textInput
                      )}
                    </Form.Item>
                  );
                })}
              </>
            )}
          </Flex>
        </Form>
        </div>
      </ConfigProvider>
    </Modal>
  );
};

export default AdminDrawer;
