import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { APP_CONFIG } from '../config/app.config'

const AuthContext = createContext(null)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [token, setToken] = useState(localStorage.getItem('token'))

    const LAST_ACTIVE_KEY = 'robotronix_last_active'
    const TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

    useEffect(() => {
        const checkAuth = async () => {
            const storedToken = localStorage.getItem('token')
            const storedUser = localStorage.getItem('user')

            if (storedToken && storedUser) {
                try {
                    // Strictly verify session with backend
                    const response = await api.get('/auth/me');
                    const userData = response.data;
                    
                    setToken(storedToken);
                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
                    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());

                    // Only redirect if NOT on login/register pages and not in user-panel
                    const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
                    const isInPanel = window.location.pathname.startsWith('/user-panel');
                    
                    if (!isInPanel && isAuthPage) {
                        if (userData.role === 'ADMIN') {
                            window.location.href = APP_CONFIG.ADMIN_DASHBOARD_URL;
                        } else {
                            window.location.href = APP_CONFIG.USER_DASHBOARD_URL;
                        }
                    }
                } catch (error) {
                    console.error('Initial verification failed:', error);
                    logout();
                }
            }
            setLoading(false)
        }

        checkAuth()
    }, [])

    // Auto logout and activity tracking
    useEffect(() => {
        if (!user) return

        let inactivityTimer

        const resetTimer = () => {
            // Update local time for tab-local timer
            clearTimeout(inactivityTimer)
            inactivityTimer = setTimeout(() => {
                console.log('Auto logout due to inactivity')
                logout()
            }, TIMEOUT_MS)

            // Update localStorage for cross-tab/re-open persistence
            localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString())
        }

        // Events that reset the timer
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
        
        events.forEach(event => {
            document.addEventListener(event, resetTimer)
        })

        // Start the timer
        resetTimer()

        // Cleanup
        return () => {
            clearTimeout(inactivityTimer)
            events.forEach(event => {
                document.removeEventListener(event, resetTimer)
            })
        }
    }, [user])

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password })
            const data = response.data

            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString())
            setToken(data.token)
            setUser(data.user)
            return { success: true }
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Email yoki parol noto\'g\'ri' }
        }
    }

    const register = async (userData) => {
        try {
            const response = await api.post('/auth/register', userData)
            const data = response.data

            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString())
            setToken(data.token)
            setUser(data.user)
            return { success: true, data }
        } catch (error) {
            return { success: false, error: error.response?.data?.message || error.message }
        }
    }

    const logout = async () => {
        try { await api.post('/auth/logout') } catch { /* ignore */ }
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem(LAST_ACTIVE_KEY)
        setToken(null)
        setUser(null)
    }

    const hasRole = (role) => {
        if (!user) return false
        if (role === 'USER') return true
        if (role === 'ADMIN') return user.role === 'ADMIN'
        return false
    }

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        hasRole,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext
