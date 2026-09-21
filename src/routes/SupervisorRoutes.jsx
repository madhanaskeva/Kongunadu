import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import SupervisorApp from '../pages/supervisor/SupervisorApp';

export const SupervisorRoutes = (
  <>
    <Route path="supervisor" element={<SupervisorApp />} />
    <Route path="supervisor/*" element={<Navigate to="/supervisor" replace />} />
  </>
);

export default SupervisorRoutes;
