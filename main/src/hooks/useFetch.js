import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const useFetch = (url, options = {}) => {
    const { transform, deps = [] } = options
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetch = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await api.get(url)
            const result = Array.isArray(response.data) ? response.data : (response.data || [])
            setData(transform ? transform(result) : result)
        } catch (err) {
            console.error(`useFetch error [${url}]:`, err)
            setError(err)
            setData([])
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
