import { apiCall } from './baseApi';

export const reportApi = {
  getAvailableReports: () =>
    apiCall(() => [
      { id: 'REP-01', name: 'Trip Register & Billing Summary', description: 'Complete record of billable trips with fixed, GPS and odometer distance verification.', freq: 'Daily', format: 'Excel' },
      { id: 'REP-02', name: 'Hidden Kilometres & Odometer Audit', description: 'Gap analysis between consecutive trips detecting unaccounted vehicle movements.', freq: 'Daily', format: 'Excel' },
      { id: 'REP-03', name: 'Route Diversion & Corridor Violations', description: 'Trips with GPS tracking showing diversion from assigned national/state highway corridor.', freq: 'Daily', format: 'Excel' },
      { id: 'REP-04', name: 'Vehicle Idle Time & Utilization', description: 'Vehicles idle over 24h, breakdown of reasons, and fleet utilization score.', freq: 'Weekly', format: 'Excel' },
      { id: 'REP-05', name: 'Driver Attendance & Duty Roster', description: 'Monthly 31-day driver attendance matrix, consecutive absences, and trip days.', freq: 'Monthly', format: 'Excel' },
      { id: 'REP-06', name: 'Diesel & Advance Settlement', description: 'Advance given vs settled, fuel bunk rates, diesel litres consumed per trip.', freq: 'Daily', format: 'Excel' },
      { id: 'REP-07', name: 'Non-Business Movement Log', description: 'Maintenance, empty return, and testing movements with supervisor reasons.', freq: 'Weekly', format: 'Excel' },
      { id: 'REP-08', name: 'Branch Performance Scorecard', description: 'Trips, revenue leakage averted, exceptions rate, and attendance by branch.', freq: 'Monthly', format: 'Excel' },
    ]),

  generateReportXlsx: (reportId) =>
    apiCall(() => {
      return {
        success: true,
        downloadUrl: '#',
        filename: `${reportId}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      };
    }),
};

