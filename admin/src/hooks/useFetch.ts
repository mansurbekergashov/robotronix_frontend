import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../services/api'

interface UseFetchOptions<T> {
    transform?: (data: T) => T
    deps?: unknown[]
}

interface UseFetchResult<T> {
    data: T | null
    loading: boolean
    error: unknown
    refetch: () => void
}

function useFetch<T = unknown>(url: string, options: UseFetchOptions<T> = {}): UseFetchResult<T> {
    const { transform, deps = [] } = options
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<unknown>(null)
    const abortRef = useRef<AbortController | null>(null)

    const fetch = useCallback(async () => {
        if (abortRef.current) abortRef.current.abort()
        abortRef.current = new AbortController()
        const { signal } = abortRef.current

        setLoading(true)
        setError(null)
        try {
            const response = await api.get<T>(url, { signal })
            if (signal.aborted) return
            const result = response.data
            setData(transform ? transform(result) : result)
        } catch (err: any) {
            if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') return
            console.error(`useFetch [${url}]:`, err)
            setError(err)
            setData(null)
        } finally {
            if (!signal.aborted) setLoading(false)
        }
    }, [url, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetch()
        return () => { abortRef.current?.abort() }
    }, [fetch])

    return { data, loading, error, refetch: fetch }
}

export default useFetch
