// "Completed · not closed" — the trip has finished its job on the road, but the
// supervisor has not filed the closing entry, so it is still open in the system.
// Nothing bills until a trip closes, so Head Office and the supervisor both get
// chased about these. Admin trips list, admin notifications and the supervisor
// app all read the rule from here — change it once and every screen follows.

export const PENDING_CLOSE_LABEL = 'Completed · not closed';

// The stored status stays 'Enroute' — every filter, seed record and saved trip
// still uses that value. This is only what people read on screen, so the wording
// can change here without touching a single comparison.
export const ENROUTE_LABEL = 'On Road';

// Lowercase form for the middle of a sentence ("14 trips · 9 on road").
export const ENROUTE_LABEL_LOWER = ENROUTE_LABEL.toLowerCase();

// A trip whose GPS distance has reached this share of its fixed route distance
// has effectively arrived, even if the stage was never advanced by hand.
export const PENDING_CLOSE_GPS_RATIO = 0.95;

// Stages that mean the load has reached the customer.
const ARRIVED_STAGES = ['Unloading', 'Unloaded', 'Delivered', 'Completed'];

export const isTripOpen = (t) => !!t && t.status !== 'Closed' && !t.closed;

export const isPendingClose = (t) => {
  if (!isTripOpen(t)) return false;
  if (ARRIVED_STAGES.includes(t.stage)) return true;
  if (t.qtyUnload != null || t.closeKm != null) return true;
  const fixed = Number(t.fixedKm) || 0;
  const gps = Number(t.gpsKm) || 0;
  return fixed > 0 && gps / fixed >= PENDING_CLOSE_GPS_RATIO;
};

// One short line explaining why the trip is waiting to be closed.
export const pendingCloseReason = (t) => {
  if (!isPendingClose(t)) return '';
  if (ARRIVED_STAGES.includes(t.stage)) return `unloading stage reached (${t.stage})`;
  if (t.qtyUnload != null) return 'unloaded quantity already recorded';
  if (t.closeKm != null) return 'closing km already recorded';
  const fixed = Number(t.fixedKm) || 0;
  const pct = Math.min(100, Math.round(((Number(t.gpsKm) || 0) / fixed) * 100));
  return `GPS shows ${pct}% of the ${fixed} km route covered`;
};

// Reason plus how long the trip has been sitting open, for alerts and notices.
export const pendingCloseDetail = (t) => {
  const why = pendingCloseReason(t);
  if (!why) return '';
  const h = Number(t.hoursOpen);
  return why + (h ? ` · open ${h} h` : '');
};
