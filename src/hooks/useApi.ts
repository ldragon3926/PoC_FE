import { useState, useCallback } from 'react'
import { App } from 'antd'

// ─── Single fetch hook ───────────────────────────────────────────────────────

export function useFetch<T>(fetcher: () => Promise<{ data: T }>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetcher()
      setData(res.data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  return { data, loading, error, fetch, setData }
}

// ─── List hook ───────────────────────────────────────────────────────────────

export function useList<T>(fetcher: () => Promise<{ data: T[] }>) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetcher()
      setData(res.data ?? [])
    } catch (e) {
      setError((e as Error).message)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  return { data, loading, error, fetch, setData }
}

// ─── Mutation hook ───────────────────────────────────────────────────────────

export function useMutation<Args extends unknown[], R>(
  mutator: (...args: Args) => Promise<R>,
  options?: {
    successMessage?: string
    onSuccess?: (result: R) => void
    onError?: (err: Error) => void
  }
) {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)

  const execute = useCallback(
    async (...args: Args) => {
      setLoading(true)
      try {
        const result = await mutator(...args)
        if (options?.successMessage) {
          message.success(options.successMessage)
        }
        options?.onSuccess?.(result)
        return result
      } catch (e) {
        const err = e as Error
        message.error(err.message || 'Đã xảy ra lỗi')
        options?.onError?.(err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutator]
  )

  return { execute, loading }
}
