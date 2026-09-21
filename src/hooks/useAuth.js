import { useSelector, useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure, logout } from '../features/auth/authSlice';

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

        const user =
          credentials.role === 'supervisor'
            ? {
                id: 'S01',
                name: 'Branch Supervisor',
                email: credentials.email,
                role: 'Supervisor',
                branch: 'Coimbatore',
              }
            : {
                id: 'A01',
                name: 'Head Office Admin',
                email: credentials.email,
                role: 'Administrator',
                branch: 'All branches',
              };
        dispatch(loginSuccess(user));
        return { success: true };
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (err) {
      dispatch(loginFailure(err.message || 'Login failed'));
      return { success: false, error: err.message };
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading,
    error: auth.error,
    login,
    logout: handleLogout,
  };
};

