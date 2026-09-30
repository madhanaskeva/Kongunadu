import React from 'react';
import { Avatar, Badge, Button, Card, Descriptions, Flex, Tag, Typography } from 'antd';
import { ENROUTE_LABEL } from '../../../utils/tripStatus';

const { Text, Title } = Typography;

export const SupervisorProfile = ({ v }) => (
  <Flex vertical gap={16} style={{ flex: 1, padding: "20px 16px 32px" }}>
    {/* Profile Main Card */}
    <Card style={{ background: "var(--color-brand-tint)", borderColor: "var(--color-brand)" }}>
      <Flex align="center" gap={16}>
        <Avatar size={60} className="sv-avatar" style={{ flex: "none", fontSize: 22 }}>
          {v.supInitials || "SV"}
        </Avatar>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Title level={4} style={{ margin: 0 }}>
            {v.supFullName || v.supName || "Supervisor"}
          </Title>
          <Text style={{ display: "block", fontSize: 13, marginTop: 2 }}>
            {v.supRoleText}
          </Text>
          <Tag color="success" style={{ marginTop: 6 }}>
            <Badge status="success" text={<Text strong style={{ fontSize: 11, color: "inherit" }}>Active · Device Approved</Text>} />
          </Tag>
        </div>
      </Flex>
    </Card>

    {/* Contact & Branch Details Section */}
    <Card size="small" title="Profile Details">
      <Descriptions
        column={2}
        layout="vertical"
        size="small"
        items={[
          { key: 'id', label: 'Supervisor ID', children: <Text strong>{v.supId || "S01"}</Text> },
          { key: 'branch', label: 'Branch', children: <Text strong>{v.branchName}</Text> },
          { key: 'mobile', label: 'Mobile Number', children: <Text strong>+91 98410 22314</Text> },
          { key: 'role', label: 'Role Access', children: <Text strong>Branch Field Operations</Text> },
        ]}
      />
    </Card>

    {/* Operations & System Stats */}
    <Card size="small" title="Operational Overview">
      <Flex vertical gap={12}>
        <Flex justify="space-between" align="center" gap={8} style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--surface-muted)" }}>
          <Text strong>{ENROUTE_LABEL} Vehicles</Text>
          <Text strong style={{ color: "var(--color-brand)" }}>{v.activeCount} active</Text>
        </Flex>

        <Flex justify="space-between" align="center" gap={8} style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--text-heading)" }}>
          <Text strong style={{ color: "var(--surface-muted)" }}>Driver Attendance</Text>
          <Text strong style={{ color: "#fff" }}>{v.attendanceMarked} of {v.attendanceTotal} drivers</Text>
        </Flex>
      </Flex>
    </Card>

    {/* Sign Out Button */}
    <Button
      type="primary"
      danger
      size="large"
      block
      onClick={v.onSignOut}
      style={{ marginTop: 12 }}
    >
      Sign out
    </Button>
  </Flex>
);

export default SupervisorProfile;
