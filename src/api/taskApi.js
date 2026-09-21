import { mockData, apiCall } from './baseApi';

export const taskApi = {
  getTrips: (filter = {}) =>
    apiCall(() => {
      let list = [...mockData.trips];
      if (filter.branch) list = list.filter((t) => t.branch === filter.branch);
      if (filter.status) list = list.filter((t) => t.status === filter.status);
      if (filter.type) list = list.filter((t) => t.type === filter.type);
      if (filter.flag === 'flagged') list = list.filter((t) => t.flags && t.flags.length > 0);
      if (filter.flag === 'clean') list = list.filter((t) => !t.flags || t.flags.length === 0);
      return list;
    }),

  getTripById: (id) =>
    apiCall(() => {
      const trip = mockData.trips.find((t) => t.id === id);
      if (!trip) throw new Error('Trip not found');
      return trip;
    }),

  updateTrip: (id, updates) =>
    apiCall(() => {
      const idx = mockData.trips.findIndex((t) => t.id === id);
      if (idx !== -1) {
        mockData.trips[idx] = { ...mockData.trips[idx], ...updates };
        return mockData.trips[idx];
      }
      throw new Error('Trip not found');
    }),

  deleteTrip: (id) =>
    apiCall(() => {
      mockData.trips = mockData.trips.filter((t) => t.id !== id);
      return { success: true };
    }),

  getExceptions: (status = 'all') =>
    apiCall(() => {
      if (status === 'all') return [...mockData.exceptions];
      return mockData.exceptions.filter((e) => e.status.toLowerCase() === status.toLowerCase());
    }),

  resolveException: (id, note, assignee) =>
    apiCall(() => {
      const exc = mockData.exceptions.find((e) => e.id === id);
      if (exc) {
        exc.status = 'Resolved';
        exc.resolutionNote = note;
        if (assignee) exc.assignee = assignee;
        return exc;
      }
      throw new Error('Exception not found');
    }),
};

