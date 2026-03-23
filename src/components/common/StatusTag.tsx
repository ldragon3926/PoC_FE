import React from 'react'
import { Tag } from 'antd'
import { statusLabel, statusColor } from '@/utils/format'

const StatusTag: React.FC<{ status?: string | boolean | null }> = ({ status }) => (
  <Tag color={statusColor(status)}>{statusLabel(status)}</Tag>
)

export default StatusTag
