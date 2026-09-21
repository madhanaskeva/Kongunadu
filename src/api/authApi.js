import { mockData, apiCall } from './baseApi';

export const authApi = {
  login: (email, password) =>
    apiCall(() => {
      const user = mockData.users.find((u) => u.email === email);
      if (user) {
        return { success: true, user, token: 'mock-jwt-token' };
      }
      return { success: false, message: 'Invalid credentials' };
    }),

  getCurrentUser: () =>
    apiCall(() => {
      return mockData.users[0];
    }),
};

