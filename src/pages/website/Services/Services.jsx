import React from 'react';

export const Services = () => {
  return (
    <div style={{ maxWidth: '1000px', margin: '48px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '16px' }}>
        Logistics & Fleet Services
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800 }}>Cryogenic Gas Transportation</h3>
          <p style={{ margin: 0, color: 'var(--text-body)', lineHeight: 1.6 }}>Liquid Oxygen (LOX), Liquid Nitrogen (LIN), and Liquid Argon (LAR) bulk tankers with calibrated temperature and pressure sensors.</p>
        </div>
        <div style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800 }}>Pharma Reefer Solutions</h3>
          <p style={{ margin: 0, color: 'var(--text-body)', lineHeight: 1.6 }}>20ft & 32ft temperature-controlled containers adhering to strict cold-chain compliance and GPS route integrity.</p>
        </div>
      </div>
    </div>
  );
};

export default Services;

