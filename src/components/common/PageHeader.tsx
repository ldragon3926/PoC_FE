import React from 'react'
import { Typography, Space } from 'antd'

const { Title, Text } = Typography

interface PageHeaderProps {
  title: string
  subtitle?: string
  extra?: React.ReactNode
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, extra }) => (
  <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
    <div>
      <Title level={4} style={{ margin: 0 }}>{title}</Title>
      {subtitle && <Text type="secondary" style={{ fontSize: 13 }}>{subtitle}</Text>}
    </div>
    {extra && <Space wrap>{extra}</Space>}
  </div>
)

export default PageHeader
