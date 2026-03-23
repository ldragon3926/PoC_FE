import React from 'react'
import { Form, Input, Button, Card, Typography, Space, App } from 'antd'
import { UserOutlined, LockOutlined, IdcardOutlined } from '@ant-design/icons'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { LoginRequest } from '@/types'

const { Title, Text } = Typography

const LoginPage: React.FC = () => {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [loading, setLoading] = React.useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const onFinish = async (values: LoginRequest) => {
    setLoading(true)
    try {
      await login(values)
      message.success('Đăng nhập thành công!')
      navigate('/dashboard')
    } catch (e) {
      message.error((e as Error).message || 'Tên đăng nhập hoặc mật khẩu không đúng')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f2f5 0%, #e6f4ff 100%)',
    }}>
      <Card style={{ width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        <Space direction="vertical" size={4} style={{ width: '100%', textAlign: 'center', marginBottom: 28 }}>
          <IdcardOutlined style={{ fontSize: 40, color: '#1677ff' }} />
          <Title level={3} style={{ margin: 0 }}>HRM System</Title>
          <Text type="secondary">Hệ thống Quản lý Nhân sự</Text>
        </Space>

        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default LoginPage
