import dayjs from 'dayjs'

const normalizeDateValue = (date?: unknown) => {
  if (date == null || date === '') return null

  if (typeof date === 'string' || typeof date === 'number' || date instanceof Date) {
    const parsed = dayjs(date)
    return parsed.isValid() ? parsed : null
  }

  if (Array.isArray(date)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = date
    const parsed = dayjs(new Date(year, (month ?? 1) - 1, day ?? 1, hour, minute, second))
    return parsed.isValid() ? parsed : null
  }

  if (typeof date === 'object') {
    const candidate = date as { seconds?: number; nanos?: number; epochMilli?: number; time?: number }

    if (typeof candidate.epochMilli === 'number') {
      const parsed = dayjs(candidate.epochMilli)
      return parsed.isValid() ? parsed : null
    }

    if (typeof candidate.time === 'number') {
      const parsed = dayjs(candidate.time)
      return parsed.isValid() ? parsed : null
    }

    if (typeof candidate.seconds === 'number') {
      const parsed = dayjs(candidate.seconds * 1000)
      return parsed.isValid() ? parsed : null
    }
  }

  return null
}

export const formatDate = (date?: unknown, fmt = 'DD/MM/YYYY') => {
  const normalized = normalizeDateValue(date)
  return normalized ? normalized.format(fmt) : '-'
}

export const formatDateTime = (date?: unknown) =>
  formatDate(date, 'DD/MM/YYYY HH:mm')

export const formatCurrency = (amount?: number | null) =>
  amount != null
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
    : '-'

export const normalizeStatus = (status?: string | boolean | null) => {
  if (status === true) return 'ACTIVE'
  if (status === false) return 'INACTIVE'
  if (status == null) return undefined

  const normalized = String(status).trim().toUpperCase()
  if (normalized === 'TRUE' || normalized === 'ACTIVE') return 'ACTIVE'
  if (normalized === 'FALSE' || normalized === 'INACTIVE') return 'INACTIVE'

  return normalized
}

export const statusLabel = (status?: string | boolean | null) => {
  const normalized = normalizeStatus(status)
  return normalized === 'ACTIVE'
    ? 'Hoat dong'
    : normalized === 'INACTIVE'
      ? 'Vo hieu'
      : normalized ?? '-'
}

export const statusColor = (status?: string | boolean | null) =>
  normalizeStatus(status) === 'ACTIVE' ? 'success' : 'default'

type EmployeeLikeRecord = Record<string, unknown> & {
  employeeId?: number
  employeeName?: string
  idEmployee?: number
  nameEmployee?: string
  employee?: {
    id?: number
    name?: string
    fullName?: string
  } | null
}

export const getEmployeeRefId = (record: EmployeeLikeRecord): number | undefined => {
  const rawId = record.employeeId ?? record.idEmployee ?? record.employee?.id
  return typeof rawId === 'number' ? rawId : undefined
}

export const getEmployeeDisplayName = (
  record: EmployeeLikeRecord,
  employeeMap?: Record<number, string>
) => {
  const directName =
    record.employeeName ??
    record.nameEmployee ??
    record.employee?.name ??
    record.employee?.fullName

  if (typeof directName === 'string' && directName.trim()) {
    return directName
  }

  const employeeId = getEmployeeRefId(record)
  if (employeeId != null) {
    return employeeMap?.[employeeId] || employeeId
  }

  return '-'
}
