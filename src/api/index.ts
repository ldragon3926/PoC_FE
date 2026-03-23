import apiClient, { createCrudApi } from './client'
import type {
  ApiResponse, AuthData, LoginRequest,
  Department, DepartmentCreateRequest, DepartmentUpdateRequest,
  Employee, EmployeeCreateRequest, EmployeeUpdateRequest,
  User, UserCreateRequest, UserUpdateRequest,
  Role, RoleCreateRequest, RoleUpdateRequest,
  Permission, PermissionCreateRequest, PermissionUpdateRequest,
  Contract, ContractCreateRequest, ContractUpdateRequest,
  Attendance, AttendanceCreateRequest, AttendanceUpdateRequest,
  Reward, RewardCreateRequest, RewardUpdateRequest,
  Salary, SalaryCreateRequest, SalaryUpdateRequest,
  TokenBlackList,
} from '@/types'

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<AuthData>>('/auth/login', data).then((r) => r.data),

  me: () =>
    apiClient.get<ApiResponse<AuthData>>('/auth/me').then((r) => r.data),

  logout: () =>
    apiClient.post<ApiResponse<void>>('/auth/logout').then((r) => r.data),
}

// ─── Modules ─────────────────────────────────────────────────────────────────

export const departmentApi = createCrudApi<Department, DepartmentCreateRequest, DepartmentUpdateRequest>('department')
export const employeeApi   = createCrudApi<Employee,   EmployeeCreateRequest,   EmployeeUpdateRequest>('employee')
export const userApi       = createCrudApi<User,        UserCreateRequest,       UserUpdateRequest>('user')
export const roleApi       = createCrudApi<Role,        RoleCreateRequest,       RoleUpdateRequest>('role')
export const permissionApi = createCrudApi<Permission,  PermissionCreateRequest, PermissionUpdateRequest>('permission')
export const contractApi   = createCrudApi<Contract,    ContractCreateRequest,   ContractUpdateRequest>('contract')
export const attendanceApi = createCrudApi<Attendance,  AttendanceCreateRequest, AttendanceUpdateRequest>('attendance')
export const rewardApi     = createCrudApi<Reward,      RewardCreateRequest,     RewardUpdateRequest>('reward')
export const salaryApi     = createCrudApi<Salary,      SalaryCreateRequest,     SalaryUpdateRequest>('salary')
export const tokenBlackListApi = createCrudApi<TokenBlackList>('token-black-list')
