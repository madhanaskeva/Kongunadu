import React from 'react';
import { Flex, Typography } from 'antd';

// A numbered section heading that splits an Analytics tab into clear steps.
export const SectionHeader = ({ step, title, sub, extra }) => (
  <Flex justify="space-between" align="flex-end" gap={12} wrap className="an-section-head">
    <Flex align="center" gap={10}>
      {step != null && <span className="an-step" aria-hidden>{step}</span>}
      <div>
        <Typography.Title level={5} style={{ margin: 0 }}>{title}</Typography.Title>
        {sub && <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>{sub}</Typography.Text>}
      </div>
    </Flex>
    {extra}
  </Flex>
);

export default SectionHeader;
