import { mockData, apiCall } from './baseApi';

export const userApi = {
  getUsers: () => apiCall(() => [...mockData.users]),
  createUser: (user) =>
    apiCall(() => {
      const newUser = { id: `A0${mockData.users.length + 1}`, ...user, status: 'Active', last: 'Just now' };
      mockData.users.push(newUser);
      return newUser;
    }),
  updateUser: (id, updates) =>
    apiCall(() => {
      const idx = mockData.users.findIndex((u) => u.id === id);
      if (idx !== -1) {
        mockData.users[idx] = { ...mockData.users[idx], ...updates };
        return mockData.users[idx];
      }
      throw new Error('User not found');
    }),
  deleteUser: (id) =>
    apiCall(() => {
      mockData.users = mockData.users.filter((u) => u.id !== id);
      return { success: true };
    }),
};

