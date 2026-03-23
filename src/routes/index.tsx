import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import AdminLayout from '@/layouts/AdminLayout'
import { PERMISSIONS } from '@/utils/permissions'

const LoginPage        = lazy(() => import('@/pages/auth/LoginPage'))
const DashboardPage    = lazy(() => import('@/pages/dashboard/DashboardPage'))
const DepartmentPage   = lazy(() => import('@/pages/department/DepartmentPage'))
const EmployeePage     = lazy(() => import('@/pages/employee/EmployeePage'))
const UserPage         = lazy(() => import('@/pages/user/UserPage'))
const RolePage         = lazy(() => import('@/pages/role/RolePage'))
const PermissionPage   = lazy(() => import('@/pages/permission/PermissionPage'))
const ContractPage     = lazy(() => import('@/pages/contract/ContractPage'))
const AttendancePage   = lazy(() => import('@/pages/attendance/AttendancePage'))
const RewardPage       = lazy(() => import('@/pages/reward/RewardPage'))
const SalaryPage       = lazy(() => import('@/pages/salary/SalaryPage'))
const TokenBlackListPage = lazy(() => import('@/pages/token/TokenBlackListPage'))

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <Spin size="large" />
  </div>
)

const PermissionGuard: React.FC<{ permission: string; children: React.ReactNode }> = ({ permission, children }) => {
  const { hasPermission } = useAuth()
  return hasPermission(permission) ? <>{children}</> : <Navigate to="/dashboard" replace />
}

const AppRouter: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="departments" element={<PermissionGuard permission={PERMISSIONS.DEPARTMENT_LIST}><DepartmentPage /></PermissionGuard>} />
            <Route path="employees"   element={<PermissionGuard permission={PERMISSIONS.EMPLOYEE_LIST}><EmployeePage /></PermissionGuard>} />
            <Route path="users"       element={<PermissionGuard permission={PERMISSIONS.USER_LIST}><UserPage /></PermissionGuard>} />
            <Route path="roles"       element={<PermissionGuard permission={PERMISSIONS.ROLE_LIST}><RolePage /></PermissionGuard>} />
            <Route path="permissions" element={<PermissionGuard permission={PERMISSIONS.PERMISSION_LIST}><PermissionPage /></PermissionGuard>} />
            <Route path="contracts"   element={<PermissionGuard permission={PERMISSIONS.CONTRACT_LIST}><ContractPage /></PermissionGuard>} />
            <Route path="attendance"  element={<PermissionGuard permission={PERMISSIONS.ATTENDANCE_LIST}><AttendancePage /></PermissionGuard>} />
            <Route path="rewards"     element={<PermissionGuard permission={PERMISSIONS.REWARD_LIST}><RewardPage /></PermissionGuard>} />
            <Route path="salary"      element={<PermissionGuard permission={PERMISSIONS.SALARY_LIST}><SalaryPage /></PermissionGuard>} />
            <Route path="token-black-list" element={<PermissionGuard permission={PERMISSIONS.TOKEN_LIST}><TokenBlackListPage /></PermissionGuard>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  </BrowserRouter>
)

export default AppRouter
