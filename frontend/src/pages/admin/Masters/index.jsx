import React from 'react';
import MasterManager from './MasterManager';

export const BranchMaster = () => (
  <MasterManager
    type="branches"
    title="Branch Master"
    singular="Branch"
    subtitle="Company operating branches and regional transport hubs."
  />
);

export const SupervisorMaster = () => (
  <MasterManager
    type="supervisors"
    title="Supervisor Master"
    singular="Supervisor"
    subtitle="Branch supervisors authorized to open and close trips."
  />
);

export const VehicleMaster = () => (
  <MasterManager
    type="vehicles"
    title="Vehicle Master"
    singular="Vehicle"
    subtitle="700+ commercial reefer trailers, containers, and closed body trucks."
  />
);

export const DriverMaster = () => (
  <MasterManager
    type="drivers"
    title="Driver Master"
    singular="Driver"
    subtitle="Regular and supporting drivers with verified driving licences."
  />
);

export const ClientMaster = () => (
  <MasterManager
    type="clients"
    title="Client & Customer Master"
    singular="Client"
    subtitle="Industrial gas, pharmaceutical, and cold-chain enterprise clients."
  />
);

export const LocationMaster = () => (
  <MasterManager
    type="locations"
    title="Loading Location Master"
    singular="Location"
    subtitle="Loading plants, cold storage warehouses, and geofenced hub coordinates."
  />
);

export const RouteMaster = () => (
  <MasterManager
    type="routes"
    title="Route Corridor Master"
    singular="Route"
    subtitle="Predefined standard route corridors with validated Google Maps distances."
  />
);

