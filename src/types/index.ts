// ─── API Response ───────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  code: string
  message: string
  data: T
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthData {
  token: string
  userId: number
  username: string
  authorities: string[]
}

export interface MyProfile {
  userId: number
  username: string
  email?: string
  employeeId?: number
  employeeName?: string
  departmentId?: number
  roleNames: string[]
  authorities: string[]
}

// ─── Department ──────────────────────────────────────────────────────────────

export interface Department {
  id: number
  name: string
  description?: string
}

export type DepartmentCreateRequest = Omit<Department, 'id'>
export type DepartmentUpdateRequest = Omit<Department, 'id'>

// ─── Employee ────────────────────────────────────────────────────────────────

export interface Employee {
  id: number
  name: string
  email: string
  phone?: string
  address?: string
  dob?: string
  departmentId?: number
  departmentName?: string
  createdAt?: string
}

export type EmployeeCreateRequest = Omit<Employee, 'id' | 'createdAt' | 'departmentName'>
export type EmployeeUpdateRequest = EmployeeCreateRequest

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: number
  employeeId?: number
  employeeName?: string
  email: string
  username: string
  password?: string
  status: 'ACTIVE' | 'INACTIVE'
  idRoles?: number[]
  roleNames?: string[]
  roles?: Role[]
}

export type UserCreateRequest = Omit<User, 'id' | 'employeeName' | 'roleNames'>
export type UserUpdateRequest = Omit<UserCreateRequest, 'password'> & { password?: string }

// ─── Role ────────────────────────────────────────────────────────────────────

export interface Role {
  id: number
  name: string
  code: string
  description?: string
  status: 'ACTIVE' | 'INACTIVE'
  idPermissions?: number[]
  idPermission?: number[]
  permissionNames?: string[]
  permissionsName?: string[]
  permissionCodes?: string[]
  permissions?: Permission[]
}

export type RoleCreateRequest = Omit<Role, 'id' | 'permissionNames'>
export type RoleUpdateRequest = RoleCreateRequest

// ─── Permission ──────────────────────────────────────────────────────────────

export interface Permission {
  id: number
  name: string
  code: string
  description?: string
  status: 'ACTIVE' | 'INACTIVE'
}

export type PermissionCreateRequest = Omit<Permission, 'id'>
export type PermissionUpdateRequest = PermissionCreateRequest

// ─── Contract ────────────────────────────────────────────────────────────────

export interface Contract {
  id: number
  employeeId: number
  employeeName?: string
  contractType: string
  baseSalary: number
  salaryCoefficient: number
  startDate: string
  endDate?: string
}

export type ContractCreateRequest = Omit<Contract, 'id' | 'employeeName'>
export type ContractUpdateRequest = ContractCreateRequest

// ─── Attendance ──────────────────────────────────────────────────────────────

export interface Attendance {
  id: number
  employeeId: number
  employeeName?: string
  workDate: string
  checkIn?: string
  checkOut?: string
  workingHours?: number
}

export type AttendanceCreateRequest = Omit<Attendance, 'id' | 'employeeName'>
export type AttendanceUpdateRequest = AttendanceCreateRequest

// ─── Reward ──────────────────────────────────────────────────────────────────

export interface Reward {
  id: number
  employeeId: number
  employeeName?: string
  amount: number
  reason?: string
  createdAt?: string
}

export type RewardCreateRequest = Omit<Reward, 'id' | 'employeeName' | 'createdAt'>
export type RewardUpdateRequest = RewardCreateRequest

// ─── Salary ──────────────────────────────────────────────────────────────────

export interface Salary {
  id: number
  employeeId: number
  employeeName?: string
  month: number
  year: number
  baseSalary: number
  allowance: number
  deduction: number
  totalSalary: number
  status?: 'DRAFT' | 'FINALIZED' | 'PAID'
  createdAt?: string
}

export type SalaryCreateRequest = Omit<Salary, 'id' | 'employeeName' | 'createdAt'>
export type SalaryUpdateRequest = SalaryCreateRequest

// ─── Token Black List ────────────────────────────────────────────────────────

export interface TokenBlackList {
  id: number
  token: string
  expiryDate: string
}

// ─── Common ──────────────────────────────────────────────────────────────────

export type Status = 'ACTIVE' | 'INACTIVE'
