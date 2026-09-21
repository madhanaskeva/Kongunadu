import React from 'react';
import { Button, Toast } from './components/ds';
import DeviceApproval from './Auth/DeviceApproval';
import VerifyOtp from './Auth/VerifyOtp';
import Register from './Auth/Register';
import Login from './Auth/Login';
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
import MonthlyAttendance from './Attendance/MonthlyAttendance';
import RequestDriver from './Drivers/RequestDriver';
import RequestSent from './Drivers/RequestSent';
import GpsPermission from './Home/GpsPermission';
import Offline from './Home/Offline';

export const SupervisorScreens = ({ v }) => (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", background: "#fff", fontFamily: "var(--font-body)", color: "var(--text-body)", position: "relative" }}>
      {/* ============ DEVICE APPROVAL ============ */}
      {v.is.approval && <DeviceApproval v={v} />}
      {/* ============ OTP ============ */}
      {v.is.otp && <VerifyOtp v={v} />}
      {/* ============ REGISTER ============ */}
      {v.is.register && <Register v={v} />}
      {/* AUTH TOAST */}
      {v.authToast ? (
        <>
          <div style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: "448px", bottom: "calc(24px + env(safe-area-inset-bottom))", zIndex: "40", display: "flex", justifyContent: "center" }}>
            <Toast tone={v.toast.tone} title={v.toast.title} message={v.toast.message} onDismiss={v.hideToast} style={v.toastStyle} />
          </div>
        </>
      ) : null}
      {/* ============ LOGIN ============ */}
      {v.isLogin && <Login v={v} />}
      {/* ============ APP SHELL ============ */}
      {v.isApp ? (
        <>
          <header style={{ padding: "calc(12px + env(safe-area-inset-top)) 16px 12px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--border-default)", background: "#fff", position: "sticky", top: "0", zIndex: "5" }}>
            {v.showBack ? (
              <>
                <button onClick={v.back} aria-label="Back" style={{ all: "unset", cursor: "pointer", width: "44px", height: "44px", display: "grid", placeItems: "center", borderRadius: "var(--radius-md)", color: "var(--text-heading)" }} className="sv-h2">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
              </>
            ) : null}
            <div style={{ flex: "1", minWidth: "0" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "18px", letterSpacing: "-0.01em", color: "var(--text-heading)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {v.title}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.04em", textTransform: "uppercase" }}>Chennai HO · R. Senthil Kumar</div>
            </div>
            <span title="GPS status" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: v.gpsColor }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: v.gpsColor, animation: "tmsPulse 1.6s ease-in-out infinite" }} />
              {v.gpsLabel}
            </span>
            <div style={{ position: "relative", flex: "none" }}>
              <button onClick={v.goNotifications} aria-label={v.bellLabel} style={{ all: "unset", cursor: "pointer", position: "relative", width: "44px", height: "44px", display: "grid", placeItems: "center", borderRadius: "var(--radius-md)", color: "var(--text-heading)", background: v.bellBg }} className="sv-h2">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                {v.notifHasUnread ? (
                  <>
                    <span style={{ position: "absolute", top: "6px", right: "5px", minWidth: "18px", height: "18px", padding: "0 4px", boxSizing: "border-box", display: "grid", placeItems: "center", borderRadius: "999px", border: "2px solid #fff", background: "var(--kr-red-600)", color: "#fff", fontFamily: "var(--font-display)", fontSize: "10px", fontWeight: "800", lineHeight: "1" }}>
                      {v.notifUnread}
                    </span>
                  </>
                ) : null}
              </button>
            </div>
          </header>
          {/* HOME */}
          {v.is.home && <Home v={v} />}
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
          {v.is.attMonth && <MonthlyAttendance v={v} />}
          {/* REQUEST DRIVER */}
          {v.is.reqDriver && <RequestDriver v={v} />}
          {v.is.reqDone && <RequestSent v={v} />}
          {/* GPS PERMISSION */}
          {v.is.gpsPerm && <GpsPermission v={v} />}
          {/* OFFLINE / ERROR */}
          {v.is.offline && <Offline v={v} />}
          {/* UNCLOSED TRIP ALERT */}
          {v.unclosedAlertOpen ? (
            <>
              <div style={{ position: "fixed", inset: "0", background: "rgba(20,32,43,.6)", zIndex: "30" }}>
                {/* sticky layer the height of the phone screen, so the popup stays centred however far the form is scrolled */}
                <div style={{ height: "100%", maxWidth: "480px", margin: "0 auto", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                  <div role="alertdialog" aria-modal="true" aria-labelledby="unclosed-alert-title" aria-describedby="unclosed-alert-body" style={{ width: "100%", maxWidth: "340px", background: "#fff", borderRadius: "var(--radius-lg)", borderTop: "6px solid var(--color-hazard)", boxShadow: "var(--shadow-lg)", padding: "24px 20px 20px", textAlign: "center" }}>
                    <div style={{ width: "56px", height: "56px", margin: "0 auto 14px", borderRadius: "50%", background: "var(--color-hazard-soft)", display: "grid", placeItems: "center" }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7A4300" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
                      </svg>
                    </div>
                    <h3 id="unclosed-alert-title" style={{ margin: "0", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "20px", lineHeight: "1.2", color: "var(--text-heading)" }}>
                      Trip not closed
                    </h3>
                    <p id="unclosed-alert-body" style={{ margin: "8px 0 14px", fontSize: "15px", lineHeight: "1.5", color: "var(--text-body)" }}>
                      <strong style={{ color: "var(--text-heading)" }}>{v.ua.vehicle}</strong>
                      {' '}still has an unclosed trip. Please close that trip before opening a new one.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "10px 12px", marginBottom: "18px", background: "var(--surface-muted)", borderRadius: "var(--radius-md)", textAlign: "left", fontSize: "13px", color: "var(--text-muted)" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: "700", color: "var(--text-heading)" }}>{v.ua.number}</span>
                      <span>{v.ua.route}</span>
                      <span>Opened {v.ua.opened} · {v.ua.hoursOpen} h open</span>
                    </div>
                    <Button size="lg" fullWidth={true} onClick={v.ackUnclosedAlert} style={v.bigBtn}>OK</Button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
          {/* DRIVER PICKER · available drivers, or request a new one */}
          {v.drvPickOpen ? (
            <>
              <div onClick={v.closeDrvPick} style={{ position: "fixed", inset: "0", background: "rgba(20,32,43,.6)", zIndex: "30" }}>
                {/* sticky layer the height of the phone screen, so the sheet stays in view however far the form is scrolled */}
                <div style={{ height: "100%", maxWidth: "480px", margin: "0 auto", boxSizing: "border-box", display: "flex", alignItems: "flex-end", padding: "12px 12px 28px" }}>
                  <div role="dialog" aria-modal="true" aria-labelledby="drv-pick-title" onClick={v.stop} style={{ width: "100%", maxHeight: "640px", display: "flex", flexDirection: "column", background: "#fff", borderRadius: "var(--radius-lg)", borderTop: "6px solid var(--color-brand)", boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
                    <div style={{ flex: "none", display: "flex", alignItems: "flex-start", gap: "12px", padding: "18px 16px 14px", borderBottom: "1px solid var(--border-default)" }}>
                      <div style={{ flex: "1", minWidth: "0" }}>
                        <h3 id="drv-pick-title" style={{ margin: "0", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "20px", lineHeight: "1.2", color: "var(--text-heading)" }}>
                          Choose driver
                        </h3>
                        <p style={{ margin: "4px 0 0", fontSize: "13px", lineHeight: "1.45", color: "var(--text-muted)" }}>{v.pickSub}</p>
                      </div>
                      <button onClick={v.closeDrvPick} aria-label="Close" style={{ all: "unset", cursor: "pointer", flex: "none", width: "44px", height: "44px", margin: "-8px -8px 0 0", display: "grid", placeItems: "center", borderRadius: "var(--radius-md)", color: "var(--text-heading)" }} className="sv-h2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                          <path d="M6 6l12 12M18 6 6 18" />
                        </svg>
                      </button>
                    </div>
                    <div role="listbox" aria-labelledby="drv-pick-title" style={{ flex: "1", minHeight: "0", overflowY: "auto" }}>
                      {(v.pickList || []).map((d, dIdx) => (
                        <React.Fragment key={dIdx}>
                          <button role="option" aria-selected={d.on} data-id={d.id} onClick={v.pickDriver} style={{ all: "unset", cursor: "pointer", boxSizing: "border-box", width: "100%", display: "flex", alignItems: "center", gap: "12px", minHeight: "64px", padding: "10px 16px", borderBottom: "1px solid var(--border-default)", background: d.bg }}>
                            <span aria-hidden="true" style={{ flex: "none", width: "40px", height: "40px", borderRadius: "50%", background: d.avatarBg, color: d.avatarFg, display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "14px" }}>
                              {d.initials}
                            </span>
                            <span style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "0" }}>
                                <span style={{ fontWeight: "700", fontSize: "16px", color: "var(--text-heading)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {d.name}
                                </span>
                                {d.hasTag ? (
                                  <>
                                    <span style={{ flex: "none", fontFamily: "var(--font-display)", fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 6px", borderRadius: "var(--radius-sm)", background: d.tagBg, color: d.tagFg }}>
                                      {d.tag}
                                    </span>
                                  </>
                                ) : null}
                              </span>
                              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{d.sub}</span>
                            </span>
                            <span aria-hidden="true" style={{ flex: "none", boxSizing: "border-box", width: "24px", height: "24px", borderRadius: "50%", border: `2px solid ${d.ring}`, display: "grid", placeItems: "center" }}>
                              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: d.dot }} />
                            </span>
                          </button>
                        </React.Fragment>
                      ))}
                      {v.pickEmpty ? (
                        <>
                          <div style={{ padding: "28px 20px", textAlign: "center" }}>
                            <div style={{ fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "17px", color: "var(--text-heading)" }}>No free drivers right now</div>
                            <p style={{ margin: "6px 0 0", fontSize: "14px", color: "var(--text-muted)" }}>
                              Every Chennai HO driver is on a trip, absent or inactive. Request a new driver below.
                            </p>
                          </div>
                        </>
                      ) : null}
                    </div>
                    <div style={{ flex: "none", padding: "14px 16px 16px", borderTop: "1px solid var(--border-default)", background: "var(--surface-muted)", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center" }}>Driver not in the list? New drivers need Head Office approval.</div>
                      <Button variant="secondary" size="lg" fullWidth={true} onClick={v.goReqDriverFromOpen}>+ Request new driver</Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
          {/* DISCARD CONFIRM */}
          {v.discardOpen ? (
            <>
              <div onClick={v.cancelDiscard} style={{ position: "fixed", inset: "0", background: "rgba(20,32,43,.6)", zIndex: "30", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "16px" }}>
                <div role="dialog" onClick={v.stop} style={{ width: "100%", maxWidth: "448px", background: "#fff", borderRadius: "var(--radius-lg)", borderTop: "6px solid var(--color-brand)", boxShadow: "var(--shadow-lg)", padding: "20px 20px 24px" }}>
                  <h3 style={{ margin: "0", fontFamily: "var(--font-display)", fontWeight: "800", fontSize: "20px", color: "var(--text-heading)" }}>Discard this trip?</h3>
                  <p style={{ margin: "8px 0 20px", fontSize: "15px" }}>Nothing has been saved yet. The truck is loaded, so make sure the trip is opened before it leaves the yard.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <Button variant="accent" size="lg" fullWidth={true} onClick={v.confirmDiscard}>Discard</Button>
                    <Button variant="ghost" size="lg" fullWidth={true} onClick={v.cancelDiscard}>Keep editing</Button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
          {/* TOAST */}
          {v.toast ? (
            <>
              <div style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: "448px", bottom: "calc(24px + env(safe-area-inset-bottom))", zIndex: "40", display: "flex", justifyContent: "center" }}>
                <Toast tone={v.toast.tone} title={v.toast.title} message={v.toast.message} onDismiss={v.hideToast} style={v.toastStyle} />
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </div>
);

export default SupervisorScreens;
