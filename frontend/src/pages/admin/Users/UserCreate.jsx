import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Flex, Form, Input, Select, Typography } from 'antd';
import { userApi } from '../../../api/userApi';

const toOptions = list => list.map(v => ({ value: v, label: v }));

export const UserCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Administrator', branch: 'All branches' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await userApi.createUser(formData);
    navigate('/admin/users');
  };

  return (
    <Card style={{ maxWidth: 600, margin: '0 auto' }}>
      <Typography.Title level={4} style={{ marginTop: 0 }}>Create New User</Typography.Title>
      {/* Native submit (keeps the browser's required / email checks); handleSubmit runs in the capture phase. */}
      <Form layout="vertical" onSubmitCapture={handleSubmit}>
        <Form.Item label="Full Name" required>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </Form.Item>
        <Form.Item label="Email Address" required>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </Form.Item>
        <Form.Item label="Role">
          <Select
            value={formData.role}
            onChange={(v) => setFormData({ ...formData, role: v })}
            options={toOptions(['Administrator', 'Verification Team', 'Owner (read-only)', 'Billing (read-only)'])}
          />
        </Form.Item>
        <Form.Item label="Branch Scope">
          <Select
            value={formData.branch}
            onChange={(v) => setFormData({ ...formData, branch: v })}
            options={toOptions(['All branches', 'Chennai HO', 'Namakkal', 'Hyderabad', 'Bengaluru', 'Mumbai'])}
          />
        </Form.Item>
        <Flex gap={12} justify="flex-end" wrap style={{ marginTop: 16 }}>
          <Button onClick={() => navigate('/admin/users')}>Cancel</Button>
          <Button type="primary" htmlType="submit">Save User</Button>
        </Flex>
      </Form>
    </Card>
  );
};

export default UserCreate;
