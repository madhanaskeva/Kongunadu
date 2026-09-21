import { useSelector } from 'react-redux';
import { hasPermission } from '../utils/permissions';

export const usePermission = (action) => {
  const user = useSelector((state) => state.auth.user);
  if (!user || !user.role) return false;
  return hasPermission(user.role, action);
};

