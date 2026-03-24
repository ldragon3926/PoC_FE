import React, { useEffect, useState } from 'react'
import { Alert, Card, Descriptions, Space, Spin, Tag, Typography } from 'antd'
import { authApi } from '@/api'
import PageHeader from '@/components/common/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import type { MyProfile } from '@/types'

const { Text } = Typography

const ProfilePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth()
  const [detail, setDetail] = useState<MyProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !user) return
    setLoading(true)
    setError(null)
    authApi
      .meProfile()
      .then((response) => setDetail(response.data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [authLoading, user])

  return (
    <>
      <PageHeader title="My Profile" subtitle="Your account attributes and permissions" />
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      <Spin spinning={loading}>
        <Card>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="User ID">{user?.userId ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Username">{user?.username ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Email">{detail?.email ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Employee ID">{detail?.employeeId ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Employee Name">{detail?.employeeName ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Roles">
              {detail?.roleNames?.length ? (
                <Space wrap>
                  {detail.roleNames.map((role) => (
                    <Tag key={role} color="blue">
                      {role}
                    </Tag>
                  ))}
                </Space>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Authorities">
              {user?.authorities?.length ? (
                <Space wrap>
                  {user.authorities.map((permission) => (
                    <Tag key={permission}>{permission}</Tag>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">No authorities</Text>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Spin>
    </>
  )
}

export default ProfilePage
