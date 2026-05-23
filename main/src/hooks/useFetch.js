import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../services/api'

const useFetch = (url, options = {}) => {
    const { transform, deps = [] } = options
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const abortRef = useRef(null)

    const fetch = useCallback(async () => {
        if (abortRef.current) abortRef.current.abort()
        abortRef.current = new AbortController()
        const { signal } = abortRef.current

        setLoading(true)
        setError(null)
        try {
            const response = await api.get(url, { signal })
            if (signal.aborted) return
            const result = Array.isArray(response.data) ? response.data : (response.data || [])
            setData(transform ? transform(result) : result)
        } catch (err) {
            if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') return
            console.error(`useFetch error [${url}]:`, err)
            setError(err)
            setData([])
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
