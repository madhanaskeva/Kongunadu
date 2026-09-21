import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout/AdminLayout';
import Dashboard from '../pages/admin/Dashboard/Dashboard';
import TripList from '../pages/admin/Trips/TripList';
import TripDetail from '../pages/admin/Trips/TripDetail';
import Exceptions from '../pages/admin/Exceptions/Exceptions';
import FleetMonitor from '../pages/admin/Fleet/FleetMonitor';
import DistanceVariation from '../pages/admin/Distance/DistanceVariation';
import {
  BranchMaster,
  SupervisorMaster,
  VehicleMaster,
  DriverMaster,
  ClientMaster,
  LocationMaster,
  RouteMaster,
} from '../pages/admin/Masters';
import Attendance from '../pages/admin/Attendance/Attendance';
import Analytics from '../pages/admin/Analytics/Analytics';
import Reports from '../pages/admin/Reports/Reports';
import UserList from '../pages/admin/Users/UserList';
import Settings from '../pages/admin/Settings/Settings';
import DeviceApprovals from '../pages/admin/DeviceApprovals/DeviceApprovals';

export const AdminRoutes = (
  <Route path="admin" element={<AdminLayout />}>
    <Route index element={<Navigate to="/admin/dashboard" replace />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="trips" element={<TripList />} />
    <Route path="trips/:id" element={<TripDetail />} />
    <Route path="exceptions" element={<Exceptions />} />
    <Route path="fleet" element={<FleetMonitor />} />
    <Route path="distance" element={<DistanceVariation />} />
    <Route path="attendance" element={<Attendance />} />
    <Route path="masters/branches" element={<BranchMaster />} />
    <Route path="masters/supervisors" element={<SupervisorMaster />} />
    <Route path="masters/vehicles" element={<VehicleMaster />} />
    <Route path="masters/drivers" element={<DriverMaster />} />
    <Route path="masters/clients" element={<ClientMaster />} />
    <Route path="masters/locations" element={<LocationMaster />} />
    <Route path="masters/routes" element={<RouteMaster />} />
    <Route path="analytics" element={<Analytics />} />
    <Route path="reports" element={<Reports />} />
    <Route path="users" element={<UserList />} />
    <Route path="settings" element={<Settings />} />
    <Route path="device-approvals" element={<DeviceApprovals />} />
  </Route>
);

export default AdminRoutes;

