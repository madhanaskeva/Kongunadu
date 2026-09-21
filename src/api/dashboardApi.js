import { mockData, apiCall } from './baseApi';

export const dashboardApi = {
  getStats: () =>
    apiCall(() => {
      const enrouteTrips = mockData.trips.filter((t) => t.status === 'Enroute').length;
      const closedToday = mockData.trips.filter((t) => t.status === 'Closed').length;
      const openExceptions = mockData.exceptions.filter((e) => e.status === 'Open').length;
      const activeVehicles = mockData.vehicles.filter((v) => v.status === 'Running').length;
      const idleVehicles = mockData.vehicles.filter((v) => v.status === 'Idle').length;

      return {
        enrouteTrips,
        closedToday,
        openExceptions,
        activeVehicles,
        idleVehicles,
        totalFleet: 722,
        gpsHealthPercent: 96.4,
        branchSummary: mockData.branches.map((b) => ({
          ...b,
          activeTrips: mockData.trips.filter((t) => t.branch === b.id && t.status === 'Enroute').length,
          exceptions: mockData.exceptions.filter((e) => e.branch === b.id && e.status === 'Open').length,
        })),
      };
    }),
};

