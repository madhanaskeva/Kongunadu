import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="website-footer">
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '32px',
        }}
      >
        <div>
          <img src="/assets/logo-inverse.png" alt="Kongunadu Road Lines" style={{ height: '36px', width: 'auto', marginBottom: '16px' }} />
          <p style={{ fontSize: '13px', color: 'var(--kr-grey-300)', lineHeight: 1.6, maxWidth: '300px' }}>
            Premier cryogenic & pharmaceutical transport operations managing 700+ fleet with GPS tracking and distance verification.
          </p>
        </div>
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Quick Portals</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <li><Link to="/login" style={{ color: 'var(--kr-grey-300)' }}>Open Admin Portal</Link></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); alert('Supervisor App is available as a dedicated mobile application.'); }} style={{ color: 'var(--kr-grey-300)' }}>Open Supervisor App (Mobile)</a></li>
            <li><Link to="/about" style={{ color: 'var(--kr-grey-300)' }}>About KRL Logistics</Link></li>
          </ul>
        </div>
        <div>
          <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Head Office</h4>
          <p style={{ fontSize: '13px', color: 'var(--kr-grey-300)', lineHeight: 1.6 }}>
            Kongunadu Road Lines<br />
            SIPCOT Industrial Park, Sriperumbudur<br />
            Tamil Nadu – 602105, India
          </p>
        </div>
      </div>
      <div
        style={{
          maxWidth: '1200px',
          margin: '32px auto 0',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--kr-grey-500)',
        }}
      >
        <span>© {new Date().getFullYear()} Kongunadu Road Lines. All rights reserved.</span>
        <span>Transport Management System · v1.0</span>
      </div>
    </footer>
  );
};

export default Footer;

