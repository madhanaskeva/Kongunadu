import { createSlice } from '@reduxjs/toolkit';

export const SESSION_KEY = 'krl_auth_user';

const DEFAULT_USER = {
  id: 'A01',
  name: 'Head Office Admin',
  email: 'admin@transport.example',
  role: 'Administrator',
  branch: 'All branches',
};

// Signed-in user survives a page refresh; falls back to the demo admin
const savedUser = () => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return null; }
};

const initialState = {
  user: savedUser() || DEFAULT_USER,
  isAuthenticated: true,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action) {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    },
    loginFailure(state, action) {
      state.loading = false;
      state.isAuthenticated = false;
      state.error = action.payload;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    updateUserProfile(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;

