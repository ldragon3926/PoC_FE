import React, { useEffect } from 'react'
import { Row, Col, Card, Statistic, Typography, Spin, Alert } from 'antd'
import {
  TeamOutlined, BankOutlined, UserOutlined, FileTextOutlined,
  DollarOutlined, TrophyOutlined,
} from '@ant-design/icons'
import { useList } from '@/hooks/useApi'
import { departmentApi, employeeApi, userApi, contractApi, salaryApi, rewardApi } from '@/api'
import PageHeader from '@/components/common/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { PERMISSIONS } from '@/utils/permissions'

const { Text } = Typography

const DashboardPage: React.FC = () => {
  const { hasPermission } = useAuth()

  const depts      = useList(() => departmentApi.listAll())
  const employees  = useList(() => employeeApi.listAll())
  const users      = useList(() => userApi.listAll())
  const contracts  = useList(() => contractApi.listAll())
  const salaries   = useList(() => salaryApi.listAll())
  const rewards    = useList(() => rewardApi.listAll())

  useEffect(() => {
    if (hasPermission(PERMISSIONS.DEPARTMENT_LIST)) depts.fetch()
    if (hasPermission(PERMISSIONS.EMPLOYEE_LIST))   employees.fetch()
    if (hasPermission(PERMISSIONS.USER_LIST))        users.fetch()
    if (hasPermission(PERMISSIONS.CONTRACT_LIST))    contracts.fetch()
    if (hasPermission(PERMISSIONS.SALARY_LIST))      salaries.fetch()
    if (hasPermission(PERMISSIONS.REWARD_LIST))      rewards.fetch()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stats = [
    {
      title: 'Phòng ban',
      value: depts.data.length,
      icon: <BankOutlined />,
      color: '#1677ff',
      show: hasPermission(PERMISSIONS.DEPARTMENT_LIST),
      loading: depts.loading,
    },
    {
      title: 'Nhân viên',
      value: employees.data.length,
      icon: <TeamOutlined />,
      color: '#52c41a',
      show: hasPermission(PERMISSIONS.EMPLOYEE_LIST),
      loading: employees.loading,
    },
    {
      title: 'Tài khoản',
      value: users.data.length,
      icon: <UserOutlined />,
      color: '#722ed1',
      show: hasPermission(PERMISSIONS.USER_LIST),
      loading: users.loading,
    },
    {
      title: 'Hợp đồng',
      value: contracts.data.length,
      icon: <FileTextOutlined />,
      color: '#fa8c16',
      show: hasPermission(PERMISSIONS.CONTRACT_LIST),
      loading: contracts.loading,
    },
    {
      title: 'Bảng lương (tất cả)',
      value: salaries.data.length,
      icon: <DollarOutlined />,
      color: '#13c2c2',
      show: hasPermission(PERMISSIONS.SALARY_LIST),
      loading: salaries.loading,
    },
    {
      title: 'Khen thưởng',
      value: rewards.data.length,
      icon: <TrophyOutlined />,
      color: '#eb2f96',
      show: hasPermission(PERMISSIONS.REWARD_LIST),
      loading: rewards.loading,
    },
  ].filter(s => s.show)

  return (
    <>
      <PageHeader title="Tổng quan" subtitle="Thống kê hệ thống quản lý nhân sự" />

      {stats.length === 0 && (
        <Alert message="Bạn không có quyền xem thống kê." type="info" showIcon />
      )}

      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col key={s.title} xs={24} sm={12} lg={8}>
            <Card>
              <Spin spinning={s.loading}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: s.color + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color: s.color,
                  }}>
                    {s.icon}
                  </div>
                  <Statistic title={<Text type="secondary" style={{ fontSize: 13 }}>{s.title}</Text>} value={s.value} />
                </div>
              </Spin>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  )
}

export default DashboardPage
