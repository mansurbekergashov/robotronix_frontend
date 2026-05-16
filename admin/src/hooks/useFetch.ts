import { useState, useEffect, useCallback } from 'react'
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

    const fetch = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await api.get<T>(url)
            const result = response.data
            setData(transform ? transform(result) : result)
        } catch (err) {
            console.error(`useFetch [${url}]:`, err)
            setError(err)
            setData(null)
        } finally {
            setLoading(false)
        }
    }, [url, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetch()
    }, [fetch])

    return { data, loading, error, refetch: fetch }
}

export default useFetch
