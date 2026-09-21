import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import WebsiteLayout from '../layouts/WebsiteLayout/WebsiteLayout';
import About from '../pages/website/About/About';
import Services from '../pages/website/Services/Services';
import Contact from '../pages/website/Contact/Contact';
import Login from '../pages/website/Login/Login';

export const WebsiteRoutes = (
  <>
    <Route path="/" element={<Login />} />
    <Route path="login" element={<Navigate to="/" replace />} />
    <Route element={<WebsiteLayout />}>
      <Route path="about" element={<About />} />
      <Route path="services" element={<Services />} />
      <Route path="contact" element={<Contact />} />
    </Route>
  </>
);

export default WebsiteRoutes;
