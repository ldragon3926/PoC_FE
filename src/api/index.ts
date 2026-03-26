import apiClient, { createCrudApi } from './client'
import type {
  ApiResponse, AuthData, LoginRequest,
  MyProfile,
  Department, DepartmentCreateRequest, DepartmentUpdateRequest,
  Employee, EmployeeCreateRequest, EmployeeUpdateRequest,
  User, UserCreateRequest, UserUpdateRequest,
  Role, RoleCreateRequest, RoleUpdateRequest,
  Permission, PermissionCreateRequest, PermissionUpdateRequest,
  Contract, ContractCreateRequest, ContractUpdateRequest,
  Attendance, AttendanceCreateRequest, AttendanceUpdateRequest,
  Reward, RewardCreateRequest, RewardUpdateRequest,
  Salary, SalaryCreateRequest, SalaryGenerateAsyncRequest, SalaryJob, SalaryUpdateRequest,
  TokenBlackList,
} from '@/types'

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<AuthData>>('/auth/login', data).then((r) => r.data),

  me: () =>
    apiClient.get<ApiResponse<AuthData>>('/auth/me').then((r) => r.data),

  meProfile: () =>
    apiClient.get<ApiResponse<MyProfile>>('/auth/me-profile').then((r) => r.data),

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
const salaryCrudApi        = createCrudApi<Salary,      SalaryCreateRequest,     SalaryUpdateRequest>('salary')
export const salaryApi     = {
  ...salaryCrudApi,
  listAll: (params?: {
    keyword?: string
    employeeId?: number
    month?: number
    year?: number
    status?: Salary['status']
  }) =>
    apiClient
      .get<ApiResponse<Salary[]>>('/salary/list-all', { params })
      .then((r) => r.data),
  generateMonth: (month: number, year: number, overwriteDraft = false) =>
    apiClient
      .post<ApiResponse<number>>(`/salary/create/generate`, undefined, { params: { month, year, overwriteDraft } })
      .then((r) => r.data),
  generateMonthAsync: (payload: SalaryGenerateAsyncRequest) =>
    apiClient
      .post<ApiResponse<SalaryJob>>('/salary/create/generate/async', payload)
      .then((r) => r.data),
  getJob: (id: number) =>
    apiClient
      .get<ApiResponse<SalaryJob>>(`/salary/jobs/${id}`)
      .then((r) => r.data),
  finalizeMonth: (month: number, year: number) =>
    apiClient
      .put<ApiResponse<number>>(`/salary/update/finalize`, undefined, { params: { month, year } })
      .then((r) => r.data),
}
export const tokenBlackListApi = createCrudApi<TokenBlackList>('token-black-list')
