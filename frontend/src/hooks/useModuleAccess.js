import { useAuth } from './useAuth';
import { can, firstAllowedPath, userAccess } from '../utils/moduleAccess';

// Module access for the signed-in portal user (Administrators always get everything)
export const useModuleAccess = () => {
  const { user } = useAuth();
  const access = userAccess(user);
  return {
    access,
    can: (key, act = 'view') => can(access, key, act),
    firstPath: firstAllowedPath(access),
  };
};

export default useModuleAccess;
