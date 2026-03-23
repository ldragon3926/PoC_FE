import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import AdminLayout from '@/layouts/AdminLayout'
import { useAuth } from '@/contexts/AuthContext'

// Lazy-loaded pages
const LoginPage         = lazy(() => import('@/pages/auth/LoginPage'))
const DashboardPage     = lazy(() => import('@/pages/dashboard/DashboardPage'))
const DepartmentPage    = lazy(() => import('@/pages/department/DepartmentPage'))
const EmployeePage      = lazy(() => import('@/pages/employee/EmployeePage'))
const UserPage          = lazy(() => import('@/pages/user/UserPage'))
const RolePage          = lazy(() => import('@/pages/role/RolePage'))
const PermissionPage    = lazy(() => import('@/pages/permission/PermissionPage'))
const ContractPage      = lazy(() => import('@/pages/contract/ContractPage'))
const AttendancePage    = lazy(() => import('@/pages/attendance/AttendancePage'))
const RewardPage        = lazy(() => import('@/pages/reward/RewardPage'))
const SalaryPage        = lazy(() => import('@/pages/salary/SalaryPage'))
const TokenBlackListPage = lazy(() => import('@/pages/token-black-list/TokenBlackListPage'))

const Loading = () => (
  <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Spin size="large" />
  </div>
)

// Auth guard: redirect to /login if not authenticated
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"        element={<DashboardPage />} />
          <Route path="departments"      element={<DepartmentPage />} />
          <Route path="employees"        element={<EmployeePage />} />
          <Route path="users"            element={<UserPage />} />
          <Route path="roles"            element={<RolePage />} />
          <Route path="permissions"      element={<PermissionPage />} />
          <Route path="contracts"        element={<ContractPage />} />
          <Route path="attendance"       element={<AttendancePage />} />
          <Route path="rewards"          element={<RewardPage />} />
          <Route path="salary"           element={<SalaryPage />} />
          <Route path="token-black-list" element={<TokenBlackListPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
)

export default AppRouter
