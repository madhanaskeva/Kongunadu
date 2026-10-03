import React from 'react';
import { Alert, Avatar, Badge, Button, Drawer, Dropdown, Flex, Grid, Modal, Radio, Tag, Typography } from 'antd';
import { AlertTriangle, Bell, CalendarDays, ChevronDown, ChevronLeft, LogOut, MapPin, Menu, User } from 'lucide-react';
import BrandLogo from '../../components/common/BrandLogo';
import SupervisorSidebar from './components/SupervisorSidebar';
import DeviceApproval from '../auth/SupervisorDeviceApproval';
import VerifyOtp from '../auth/SupervisorVerifyOtp';
import Register from '../auth/SupervisorRegister';
import Login from '../auth/SupervisorLogin';
import Home from './Home/Home';
import OpenTrip from './OpenTrip/OpenTrip';
import OpenTripReview from './OpenTrip/OpenTripReview';
import OpenTripDone from './OpenTrip/OpenTripDone';
import CloseTripList from './CloseTrip/CloseTripList';
import CloseTrip from './CloseTrip/CloseTrip';
import CloseTripReview from './CloseTrip/CloseTripReview';
import CloseTripDone from './CloseTrip/CloseTripDone';
import UnclosedTrips from './Trips/UnclosedTrips';
import TripDetail from './Trips/TripDetail';
import TripHistory from './History/TripHistory';
import ClosedTripDetail from './History/ClosedTripDetail';
import VehicleIdleStatus from './Vehicles/VehicleIdleStatus';
import Notifications from './Notifications/Notifications';
import NotificationDetail from './Notifications/NotificationDetail';
import MarkAttendance from './Attendance/MarkAttendance';
import DailyAttendance from './Attendance/DailyAttendance';
// import MonthlyAttendance from './Attendance/MonthlyAttendance';
import RequestDriver from './Drivers/RequestDriver';
import RequestSent from './Drivers/RequestSent';
import GpsPermission from './Home/GpsPermission';
import Offline from './Home/Offline';
import SupervisorProfile from './Profile/SupervisorProfile';

const { Title, Text, Paragraph } = Typography;

// ds Toast tones → antd Alert types.
const TOAST_TYPE = { success: 'success', danger: 'error', warning: 'warning', info: 'info' };

export const SupervisorScreens = ({ v }) => {
  // Wide screens keep the sidebar open beside the page; phones and tablets slide it in from the menu button.
  const wide = !!Grid.useBreakpoint().lg;
  const [navOpen, setNavOpen] = React.useState(false);
  const sidebar = <SupervisorSidebar v={v} showBrand={!wide} onNavigate={() => setNavOpen(false)} />;
  // Profile dropdown (Supervisor Profile / Sign out), shared by the desktop top bar and the phone app bar.
  const profileMenu = (trigger, desktop) => (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      open={v.profileMenuOpen}
      onOpenChange={(open, info) => { if (info && info.source === 'menu') return; /* goProfile / onSignOut close it themselves */ if (open !== v.profileMenuOpen) v.toggleProfileMenu(); }}
      popupRender={(menu) => (
        <div className={desktop ? 'tms-topbar-dropdown' : 'sv-profile-menu'}>
          <div className={desktop ? 'tms-topbar-dropdown-head' : 'sv-profile-menu-head'}>
            <Text strong>{v.supFullName || v.supName || "Supervisor"}</Text>
            {desktop ? null : <br />}
            <Text type="secondary" style={{ fontSize: desktop ? 12 : 11 }}>{v.supRoleText}</Text>
          </div>
          {menu}
        </div>
      )}
      menu={{
        items: [
          { key: 'profile', label: 'Supervisor Profile', icon: <User size={16} strokeWidth={2.2} />, onClick: v.goProfile },
          { type: 'divider' },
          { key: 'signout', label: 'Sign out', danger: true, icon: <LogOut size={16} strokeWidth={2.2} />, onClick: v.onSignOut },
        ],
      }}
    >
      {trigger}
    </Dropdown>
  );
  return (
    <div className="sv-screens">
      {/* ============ DEVICE APPROVAL ============ */}
      {v.is.approval && <DeviceApproval v={v} />}
      {/* ============ OTP ============ */}
      {v.is.otp && <VerifyOtp v={v} />}
      {/* ============ REGISTER ============ */}
      {v.is.register && <Register v={v} />}
      {/* AUTH TOAST */}
      {v.authToast ? (
        <>
          <div className="sv-toast">
            <Alert showIcon type={TOAST_TYPE[v.toast.tone] || 'success'} title={v.toast.title} description={v.toast.message} closable={{ onClose: v.hideToast }} style={v.toastStyle} />
          </div>
        </>
      ) : null}
      {/* ============ LOGIN ============ */}
      {v.isLogin && <Login v={v} />}
      {/* ============ APP SHELL ============ */}
      {v.isApp ? (
        <div className={wide ? 'sv-shell sv-shell--wide' : 'sv-shell'}>
          {/* Desktop: full-width top bar like the Admin Portal (brand + tagline, GPS, bell, account). */}
          {wide ? (
            <header className="tms-topbar sv-topbar">
              <span role="button" tabIndex={0} onClick={v.goHome} onKeyDown={e => { if (e.key === 'Enter') v.goHome(); }} className="tms-topbar-brand" style={{ cursor: 'pointer' }} aria-label="Dashboard">
                <BrandLogo />
              </span>
              <div className="tms-topbar-tagline">
                Safe moves
                <br />
                Stronger tomorrows
              </div>
              <div className="tms-topbar-scene" aria-hidden="true" />
              <Flex align="center" gap={12} className="tms-topbar-actions">
                <span title="GPS status">
                  <Badge status="processing" color={v.gpsColor} text={<Text strong className="sv-gps-label" style={{ color: v.gpsColor }}>{v.gpsLabel}</Text>} />
                </span>
                <Badge count={v.notifHasUnread ? v.notifUnread : 0} overflowCount={99} size="small" offset={[-6, 6]}>
                  <Button type="text" onClick={v.goNotifications} className="tms-topbar-icon" aria-label={v.bellLabel} icon={<Bell size={20} />} style={{ background: v.bellBg }} />
                </Badge>
                {profileMenu(
                  <button type="button" aria-label="My profile menu" aria-expanded={v.profileMenuOpen} className={`tms-topbar-account${v.profileMenuOpen || v.is.profile ? ' is-active' : ''}`}>
                    <Avatar size={42} className="tms-topbar-avatar">{v.supInitials || 'SV'}</Avatar>
                    <Flex vertical style={{ textAlign: 'left', lineHeight: 1.25 }}>
                      <Text strong style={{ fontSize: 15 }}>{v.supName}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{v.branchName}</Text>
                    </Flex>
                    <ChevronDown size={18} color="var(--text-muted)" style={{ transition: 'transform 0.15s ease', transform: v.profileMenuOpen ? 'rotate(180deg)' : 'none' }} />
                  </button>,
                  true,
                )}
              </Flex>
            </header>
          ) : null}
          <div className="sv-body">
          {wide ? (
            <aside className="sv-sider">{sidebar}</aside>
          ) : (
            <Drawer
              placement="left"
              open={navOpen}
              onClose={() => setNavOpen(false)}
              closable={false}
              size={246}
              rootClassName="tms-sidebar-drawer"
              styles={{ body: { padding: 0 }, mask: { background: 'rgba(20,32,43,.45)' } }}
            >
              {sidebar}
            </Drawer>
          )}
          <div className="sv-main">
          {wide ? (
            /* Desktop page heading, as on admin pages. The dashboard renders its own welcome heading. */
            !v.is.home ? (
              <div className="tms-pagehead sv-pagehead">
                <Flex align="center" gap={12} style={{ minWidth: 0 }}>
                  {v.showBack ? (
                    <Button onClick={v.back} aria-label="Back" icon={<ChevronLeft size={20} strokeWidth={2.5} />} className="sv-pagehead-back" />
                  ) : null}
                  <div style={{ minWidth: 0 }}>
                    <h1>{v.title}</h1>
                    <p className="sv-pagehead-meta">
                      <span className="sv-branch-pill"><MapPin size={11} strokeWidth={2.5} aria-hidden />{v.branchName}</span>
                      <span>{v.supName}</span>
                    </p>
                  </div>
                </Flex>
                <div className="tms-pagehead-date">
                  <CalendarDays size={20} color="var(--kr-grey-700)" />
                  <span>
                    <strong>Today</strong>
                    <small>{v.todayLong}</small>
                  </span>
                </div>
              </div>
            ) : null
          ) : (
          <Flex component="header" align="center" gap={10} className="sv-appbar">
            <Button type="text" size="large" onClick={() => setNavOpen(true)} aria-label="Open menu" icon={<Menu size={22} strokeWidth={2.2} />} />
            {v.showBack ? (
              <>
                <Button type="text" size="large" onClick={v.back} aria-label="Back" icon={<ChevronLeft size={22} strokeWidth={2.5} />} />
              </>
            ) : null}
            <div className="sv-appbar-title">
              <Title level={5} ellipsis style={{ margin: 0 }}>
                {v.title}
              </Title>
              {/* Branch as a highlighted pill, then the supervisor's name */}
              <Flex align="center" gap={6} className="sv-appbar-meta">
                <span className="sv-branch-pill"><MapPin size={11} strokeWidth={2.5} aria-hidden />{v.branchName}</span>
                <Text className="sv-appbar-name" ellipsis>{v.supName}</Text>
              </Flex>
            </div>
            <span title="GPS status">
              <Badge status="processing" color={v.gpsColor} text={<Text strong className="sv-gps-label" style={{ color: v.gpsColor }}>{v.gpsLabel}</Text>} />
            </span>
            <Badge count={v.notifHasUnread ? v.notifUnread : 0} size="small" offset={[-6, 8]}>
              <Button type="text" size="large" onClick={v.goNotifications} aria-label={v.bellLabel} icon={<Bell size={22} strokeWidth={2.2} />} style={{ background: v.bellBg }} />
            </Badge>
            {/* Profile Avatar Pill & Dropdown */}
            {profileMenu(
              <Button shape="round" aria-label="Profile menu" aria-expanded={v.profileMenuOpen} className="sv-profile-pill">
                <Avatar size={30} className="sv-avatar">{v.supInitials || "SV"}</Avatar>
                <ChevronDown size={14} strokeWidth={2.5} style={{ transform: v.profileMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
              </Button>,
              false,
            )}
          </Flex>
          )}
          <div className="sv-page">
          {/* HOME */}
          {v.is.home && <Home v={v} />}
          {/* PROFILE */}
          {v.is.profile && <SupervisorProfile v={v} />}
          {/* OPEN TRIP FORM */}
          {v.is.open && <OpenTrip v={v} />}
          {/* OPEN TRIP REVIEW */}
          {v.is.openReview && <OpenTripReview v={v} />}
          {/* OPEN TRIP SUCCESS */}
          {v.is.openDone && <OpenTripDone v={v} />}
          {/* CLOSE: SELECT TRIP */}
          {v.is.closeList && <CloseTripList v={v} />}
          {/* CLOSE TRIP FORM */}
          {v.is.close && <CloseTrip v={v} />}
          {/* CLOSE TRIP REVIEW */}
          {v.is.closeReview && <CloseTripReview v={v} />}
          {/* CLOSE SUCCESS */}
          {v.is.closeDone && <CloseTripDone v={v} />}
          {/* UNCLOSED LIST */}
          {v.is.unclosed && <UnclosedTrips v={v} />}
          {/* TRIP DETAIL */}
          {v.is.trip && <TripDetail v={v} />}
          {/* TRIP HISTORY LIST */}
          {v.is.history && <TripHistory v={v} />}
          {/* TRIP HISTORY DETAIL */}
          {v.is.histTrip && <ClosedTripDetail v={v} />}
          {/* VEHICLE IDLE STATUS */}
          {v.is.idle && <VehicleIdleStatus v={v} />}
          {/* NOTIFICATIONS */}
          {v.is.notifications && <Notifications v={v} />}
          {/* NOTIFICATION DETAIL */}
          {v.is.notifDetail && <NotificationDetail v={v} />}
          {/* ATTENDANCE · MARK BY VEHICLE */}
          {v.is.attMark && <MarkAttendance v={v} />}
          {/* ATTENDANCE DAILY */}
          {v.is.attendance && <DailyAttendance v={v} />}
          {/* ATTENDANCE MONTH */}
          {/* {v.is.attMonth && <MonthlyAttendance v={v} />} */}
          {/* REQUEST DRIVER */}
          {v.is.reqDriver && <RequestDriver v={v} />}
          {v.is.reqDone && <RequestSent v={v} />}
          {/* GPS PERMISSION */}
          {v.is.gpsPerm && <GpsPermission v={v} />}
          {/* OFFLINE / ERROR */}
          {v.is.offline && <Offline v={v} />}
          </div>
          {/* UNCLOSED TRIP ALERT · must be acknowledged, so no mask/escape close */}
          <Modal
            open={!!v.unclosedAlertOpen}
            centered
            width={340}
            closable={false}
            mask={{ closable: false }}
            keyboard={false}
            footer={null}
            className="sv-alert-modal"
          >
            {v.unclosedAlertOpen ? (
              <Flex vertical align="center" gap={8} role="alertdialog" aria-labelledby="unclosed-alert-title" aria-describedby="unclosed-alert-body">
                <Avatar size={56} className="sv-hazard-icon" icon={<AlertTriangle size={28} strokeWidth={2.2} />} />
                <Title level={4} id="unclosed-alert-title" style={{ margin: 0 }}>
                  Trip not closed
                </Title>
                <Paragraph id="unclosed-alert-body" style={{ textAlign: "center", marginBottom: 6 }}>
                  <Text strong>{v.ua.vehicle}</Text>
                  {' '}still has an unclosed trip. Please close that trip before opening a new one.
                </Paragraph>
                <Alert
                  type="warning"
                  style={{ width: "100%" }}
                  title={<Text strong code>{v.ua.number}</Text>}
                  description={<Flex vertical><span>{v.ua.route}</span><span>Opened {v.ua.opened} · {v.ua.hoursOpen} h open</span></Flex>}
                />
                <Button type="primary" size="large" block onClick={v.ackUnclosedAlert} style={{ ...v.bigBtn, marginTop: 10 }}>OK</Button>
              </Flex>
            ) : null}
          </Modal>
          {/* DRIVER PICKER · available drivers, or request a new one */}
          <Modal
            open={!!v.drvPickOpen}
            onCancel={v.closeDrvPick}
            width={456}
            wrapClassName="sv-sheet-wrap"
            className="sv-sheet"
            title={
              <div>
                <Title level={4} id="drv-pick-title" style={{ margin: 0 }}>Choose driver</Title>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>{v.pickSub}</Text>
              </div>
            }
            footer={
              <Flex vertical gap={8}>
                <Text type="secondary" style={{ textAlign: "center", fontSize: 13 }}>Driver not in the list? New drivers need Head Office approval.</Text>
                <Button color="primary" variant="outlined" size="large" block onClick={v.goReqDriverFromOpen}>+ Request new driver</Button>
              </Flex>
            }
          >
            <div role="listbox" aria-labelledby="drv-pick-title" className="sv-drv-list">
              {(v.pickList || []).map((d, dIdx) => (
                <React.Fragment key={dIdx}>
                  <Flex
                    role="option"
                    tabIndex={0}
                    aria-selected={d.on}
                    data-id={d.id}
                    onClick={v.pickDriver}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); v.pickDriver(e); } }}
                    align="center"
                    gap={12}
                    className={d.on === 'true' ? 'sv-drv-row is-on' : 'sv-drv-row'}
                  >
                    <Avatar size={40} aria-hidden="true" style={{ flex: "none", background: d.avatarBg, color: d.avatarFg, fontWeight: 800 }}>
                      {d.initials}
                    </Avatar>
                    <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                      <Flex align="center" gap={8} style={{ minWidth: 0 }}>
                        <Text strong ellipsis style={{ fontSize: 16 }}>{d.name}</Text>
                        {d.hasTag ? (
                          <>
                            <Tag color={d.tagColor} style={{ flex: "none", marginInlineEnd: 0 }}>{d.tag}</Tag>
                          </>
                        ) : null}
                      </Flex>
                      <Text type="secondary" style={{ fontSize: 13 }}>{d.sub}</Text>
                    </Flex>
                    <Radio checked={d.on === 'true'} aria-hidden="true" tabIndex={-1} style={{ pointerEvents: "none", marginInlineEnd: 0 }} />
                  </Flex>
                </React.Fragment>
              ))}
              {v.pickEmpty ? (
                <>
                  <div style={{ padding: "28px 20px", textAlign: "center" }}>
                    <Title level={5} style={{ margin: 0 }}>No free drivers right now</Title>
                    <Paragraph type="secondary" style={{ margin: "6px 0 0" }}>
                      Every {v.branchName} driver is on a trip, absent or inactive. Request a new driver below.
                    </Paragraph>
                  </div>
                </>
              ) : null}
            </div>
          </Modal>
          {/* DISCARD CONFIRM */}
          <Modal
            open={!!v.discardOpen}
            onCancel={v.cancelDiscard}
            closable={false}
            width={448}
            wrapClassName="sv-sheet-wrap"
            className="sv-sheet"
            title="Discard this trip?"
            footer={
              <Flex vertical gap={8}>
                <Button type="primary" danger size="large" block onClick={v.confirmDiscard}>Discard</Button>
                <Button type="text" size="large" block onClick={v.cancelDiscard}>Keep editing</Button>
              </Flex>
            }
          >
            <Paragraph style={{ fontSize: 15, margin: "8px 0 12px" }}>Nothing has been saved yet. The truck is loaded, so make sure the trip is opened before it leaves the yard.</Paragraph>
          </Modal>
          {/* TOAST */}
          {v.toast ? (
            <>
              <div className="sv-toast">
                <Alert showIcon type={TOAST_TYPE[v.toast.tone] || 'success'} title={v.toast.title} description={v.toast.message} closable={{ onClose: v.hideToast }} style={v.toastStyle} />
              </div>
            </>
          ) : null}
          </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SupervisorScreens;
