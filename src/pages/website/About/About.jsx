import React from 'react';

export const About = () => {
  return (
    <div style={{ maxWidth: '1000px', margin: '48px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '16px' }}>
        About Kongunadu Road Lines
      </h1>
      <p style={{ fontSize: '16px', lineHeight: 1.7, color: 'var(--text-body)', marginBottom: '24px' }}>
        Kongunadu Road Lines is a leading specialized transportation enterprise operating over 700 trucks across multiple branches in India. We specialize in bulk cryogenic liquids, medical gases, pharmaceuticals, and perishable cold chain logistics.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '32px' }}>
        <div style={{ padding: '20px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-brand)' }}>700+</div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Heavy Commercial Fleet</div>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-brand)' }}>350+</div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Daily Dispatches</div>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-brand)' }}>6+</div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Regional Hubs</div>
        </div>
      </div>
    </div>
  );
};

export default About;

