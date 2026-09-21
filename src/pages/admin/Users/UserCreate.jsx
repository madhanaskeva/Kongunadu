import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../../api/userApi';
import Button from '../../../components/common/Button';
import FormInput from '../../../components/forms/FormInput';
import FormSelect from '../../../components/forms/FormSelect';

export const UserCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Administrator', branch: 'All branches' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await userApi.createUser(formData);
    navigate('/admin/users');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: 800 }}>Create New User</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormInput
          label="Full Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <FormInput
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <FormSelect
          label="Role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          options={['Administrator', 'Owner (read-only)', 'Billing (read-only)']}
        />
        <FormSelect
          label="Branch Scope"
          value={formData.branch}
          onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
          options={['All branches', 'Chennai HO', 'Namakkal', 'Hyderabad', 'Bengaluru', 'Mumbai']}
        />
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <Button variant="outline" size="md" onClick={() => navigate('/admin/users')}>Cancel</Button>
          <Button type="submit" variant="primary" size="md">Save User</Button>
        </div>
      </form>
    </div>
  );
};

export default UserCreate;

