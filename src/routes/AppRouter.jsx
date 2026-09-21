import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WebsiteRoutes from './WebsiteRoutes';
import AdminRoutes from './AdminRoutes';
import SupervisorRoutes from './SupervisorRoutes';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {WebsiteRoutes}
        {AdminRoutes}
        {SupervisorRoutes}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;

