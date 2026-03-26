import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Typography, Space, theme } from 'antd'
import {
  DashboardOutlined, TeamOutlined, UserOutlined, IdcardOutlined,
  SafetyOutlined, KeyOutlined, FileTextOutlined, ClockCircleOutlined,
  TrophyOutlined, DollarOutlined, LogoutOutlined, MenuFoldOutlined,
  MenuUnfoldOutlined, LockOutlined, BankOutlined, ClusterOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { PERMISSIONS } from '@/utils/permissions'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout
const { Text } = Typography

interface NavItem {
  key: string
  icon: React.ReactNode
  label: string
  permission?: string
  permissions?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { key: '/dashboard',   icon: <DashboardOutlined />,    label: 'Tổng quan' },
  { key: '/profile',     icon: <IdcardOutlined />,       label: 'Cá nhân' },
  { key: '/departments', icon: <BankOutlined />,          label: 'Phòng ban',     permission: PERMISSIONS.DEPARTMENT_LIST },
  { key: '/employees',   icon: <TeamOutlined />,          label: 'Nhân viên',     permission: PERMISSIONS.EMPLOYEE_LIST },
  { key: '/contracts',   icon: <FileTextOutlined />,      label: 'Hợp đồng',      permission: PERMISSIONS.CONTRACT_LIST },
  { key: '/attendance',  icon: <ClockCircleOutlined />,   label: 'Chấm công',     permission: PERMISSIONS.ATTENDANCE_LIST },
  { key: '/rewards',     icon: <TrophyOutlined />,        label: 'Khen thưởng',   permission: PERMISSIONS.REWARD_LIST },
  { key: '/salary',      icon: <DollarOutlined />,        label: 'Lương',         permission: PERMISSIONS.SALARY_LIST },
  { key: '/salary-kafka', icon: <ClusterOutlined />,      label: 'Salary Kafka',  permission: PERMISSIONS.SALARY_CREATE },
  { key: '/users',       icon: <UserOutlined />,          label: 'Tài khoản',     permission: PERMISSIONS.USER_LIST },
  { key: '/roles',       icon: <SafetyOutlined />,        label: 'Vai trò',       permission: PERMISSIONS.ROLE_LIST },
  { key: '/permissions', icon: <KeyOutlined />,           label: 'Quyền hạn',     permission: PERMISSIONS.PERMISSION_LIST },
  { key: '/token-black-list', icon: <LockOutlined />,     label: 'Token bị chặn', permission: PERMISSIONS.TOKEN_LIST },
]

const AdminLayout: React.FC = () => {
  const { user, logout, hasPermission } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const { token } = theme.useToken()

  if (!user) return <Navigate to="/login" replace />

  const visibleItems: MenuProps['items'] = NAV_ITEMS
    .filter(item => !item.permission || hasPermission(item.permission))
    .map(item => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
      onClick: () => navigate(item.key),
    }))

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: async () => {
        await logout()
        navigate('/login')
      },
    },
  ]

  const selectedKey = '/' + location.pathname.split('/')[1]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        {/* Logo */}
        <div style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 20px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          gap: 10,
        }}>
          <IdcardOutlined style={{ fontSize: 22, color: token.colorPrimary }} />
          {!collapsed && (
            <Text strong style={{ fontSize: 15, color: token.colorPrimary }}>
              HRM System
            </Text>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={visibleItems}
          style={{ border: 'none', paddingTop: 8 }}
        />
      </Sider>

      <Layout>
        <Header style={{
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          height: 56,
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ background: token.colorPrimary }} />
              <Text style={{ fontSize: 13 }}>{user.username}</Text>
            </Space>
          </Dropdown>
        </Header>

        <Content style={{
          padding: 24,
          background: token.colorBgLayout,
          minHeight: 'calc(100vh - 56px)',
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
