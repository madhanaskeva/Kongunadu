import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';

export const Header = () => {
  return (
    <header className="website-header">
      <div
        style={{
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/assets/logo-1600.png" alt="Kongunadu Road Lines" style={{ height: '36px', width: 'auto' }} />
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link to="/" className="website-nav-link">Home</Link>
          <Link to="/about" className="website-nav-link">About</Link>
          <Link to="/services" className="website-nav-link">Services</Link>
          <Link to="/contact" className="website-nav-link">Contact</Link>
          <Link to="/login" style={{ marginLeft: '12px' }}>
            <Button variant="primary" size="sm">Login</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;

