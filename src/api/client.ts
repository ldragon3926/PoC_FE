import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types'

// ─── Token Storage ───────────────────────────────────────────────────────────
// Stored in memory (more secure for SPAs) with sessionStorage fallback
// to survive page refresh within the same session.

const TOKEN_KEY = 'hrm_token'

export const tokenStorage = {
  get: (): string | null => sessionStorage.getItem(TOKEN_KEY),
  set: (token: string) => sessionStorage.setItem(TOKEN_KEY, token),
  remove: () => sessionStorage.removeItem(TOKEN_KEY),
}

// ─── Axios Instance ──────────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor – attach token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.get()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor – normalize errors + auto-logout on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      tokenStorage.remove()
      // Avoid circular dependency: navigate via hard redirect
      window.location.href = '/login'
    }
    // Normalize error message
    const message =
      error.response?.data?.message ||
      error.message ||
      'Đã xảy ra lỗi không xác định'
    return Promise.reject(new Error(message))
  }
)

// ─── Generic CRUD factory ────────────────────────────────────────────────────

export function createCrudApi<T, CreateReq = Partial<T>, UpdateReq = Partial<T>>(
  module: string
) {
  const base = `/${module}`
  return {
    listAll: () =>
      apiClient.get<ApiResponse<T[]>>(`${base}/list-all`).then((r) => r.data),

    detail: (id: number) =>
      apiClient.get<ApiResponse<T>>(`${base}/detail/${id}`).then((r) => r.data),

    create: (data: CreateReq) =>
      apiClient.post<ApiResponse<T>>(`${base}/create`, data).then((r) => r.data),

    update: (id: number, data: UpdateReq) =>
      apiClient.put<ApiResponse<T>>(`${base}/update/${id}`, data).then((r) => r.data),

    delete: (id: number) =>
      apiClient.delete<ApiResponse<void>>(`${base}/delete/${id}`).then((r) => r.data),
  }
}

export default apiClient
