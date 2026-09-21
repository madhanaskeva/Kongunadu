import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import Button from '../../../components/common/Button';
import FormInput from '../../../components/forms/FormInput';

export const Contact = () => {
  return (
    <div style={{ maxWidth: '900px', margin: '48px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '16px' }}>
        Contact Operations
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MapPin size={20} color="var(--color-brand)" />
            <span>SIPCOT Phase 2, Sriperumbudur, Tamil Nadu</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Phone size={20} color="var(--color-brand)" />
            <span>+91 44 2715 8800</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Mail size={20} color="var(--color-brand)" />
            <span>operations@kongunaduroadlines.com</span>
          </div>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800 }}>Send Enquiry</h3>
          <form onSubmit={(e) => { e.preventDefault(); alert('Enquiry received. Our fleet manager will contact you.'); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <FormInput label="Full Name" placeholder="Your name" required />
            <FormInput label="Email" type="email" placeholder="Your email" required />
            <Button type="submit" variant="primary" size="md">Submit</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;

