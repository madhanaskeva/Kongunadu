import { useSelector, useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure, logout, updateUserProfile, SESSION_KEY } from '../features/auth/authSlice';
import { readPortalUsers, readSupervisors } from '../utils/moduleAccess';

const PW_KEY = 'krl_custom_passwords';
const readPasswords = () => {
  try { return JSON.parse(localStorage.getItem(PW_KEY) || '{}') || {}; } catch (e) { return {}; }
};
const saveSession = user => {
  try {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  } catch (e) {}
};

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  const login = async (credentials) => {
    dispatch(loginStart());
    try {
      // Mock login authentication
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (credentials.email && credentials.password) {
        // Check if there is an updated password for this email from Forgot Password reset
        try {
          const raw = localStorage.getItem('krl_custom_passwords');
          if (raw) {
            const customPasswords = JSON.parse(raw);
            const normalizedEmail = credentials.email.toLowerCase().trim();
            const expectedPassword = customPasswords[normalizedEmail];
            if (expectedPassword && credentials.password !== expectedPassword) {
              throw new Error('Incorrect password. Please use your updated password.');
            }
          }
        } catch (storageErr) {
          if (storageErr.message && storageErr.message.includes('Incorrect password')) {
            throw storageErr;
          }
        }

        // The account decides the destination: a user on Users & roles opens the Admin Portal,
        // a supervisor from Masters › Supervisors opens the Supervisor app
        const email = credentials.email.toLowerCase().trim();
        const byEmail = u => String(u.email || '').toLowerCase().trim() === email;
        const portalUser = readPortalUsers().find(byEmail);
        const supervisor = portalUser ? null : readSupervisors().find(byEmail);
        const account = portalUser || supervisor;
        if (!account) throw new Error('No account with this email. Ask an administrator to add you.');
        if (account.password && account.password !== credentials.password) throw new Error('Incorrect email or password.');
        if (/Suspended|Inactive|Disabled/i.test(account.status || '')) throw new Error('This account is disabled. Contact an administrator.');

        const user = supervisor
          ? {
              id: supervisor.id,
              name: supervisor.name,
              email: supervisor.email,
              phone: supervisor.phone || '',
              role: 'Supervisor',
              branch: supervisor.branch,
            }
          : {
              id: portalUser.id,
              name: portalUser.name,
              email: portalUser.email,
              phone: portalUser.phone || '',
              role: portalUser.role,
              branch: portalUser.branch || 'All branches',
            };
        saveSession(user);
        dispatch(loginSuccess(user));
        return { success: true, redirect: supervisor ? '/supervisor' : '/admin/dashboard' };
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (err) {
      dispatch(loginFailure(err.message || 'Login failed'));
      return { success: false, error: err.message };
    }
  };

  const updateProfile = (updates) => {
    const oldEmail = (auth.user?.email || '').toLowerCase().trim();
    const newEmail = (updates.email || oldEmail).toLowerCase().trim();
    // Keep a changed password attached to the new sign-in email
    if (newEmail && newEmail !== oldEmail) {
      const pw = readPasswords();
      if (pw[oldEmail]) {
        pw[newEmail] = pw[oldEmail];
        delete pw[oldEmail];
        try { localStorage.setItem(PW_KEY, JSON.stringify(pw)); } catch (e) {}
      }
    }
    const next = { ...updates, email: newEmail || updates.email };
    if (auth.user) saveSession({ ...auth.user, ...next });
    dispatch(updateUserProfile(next));
  };

  // Mock check: a password set earlier (reset or change) must match; otherwise any non-empty value is accepted
  const changePassword = (current, next) => {
    const email = (auth.user?.email || '').toLowerCase().trim();
    const pw = readPasswords();
    if (!current) return { success: false, error: 'Enter your current password.' };
    if (pw[email] && pw[email] !== current) return { success: false, error: 'Current password is incorrect.' };
    pw[email] = next;
    try { localStorage.setItem(PW_KEY, JSON.stringify(pw)); } catch (e) {
      return { success: false, error: 'Could not save the new password.' };
    }
    return { success: true };
  };

  const handleLogout = () => {
    saveSession(null);
    dispatch(logout());
  };

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading,
    error: auth.error,
    login,
    logout: handleLogout,
    updateProfile,
    changePassword,
  };
};

