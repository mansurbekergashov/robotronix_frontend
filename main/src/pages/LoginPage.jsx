import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { APP_CONFIG } from '../config/app.config'

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const redirectTo = searchParams.get('redirect') || '/dashboard'

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')

        const result = await login(formData.email, formData.password)

        if (result.success) {
            // Get user from localStorage to check role
            const userData = localStorage.getItem('user')
            const user = userData ? JSON.parse(userData) : null
            
            // Regular users go to user panel
            window.location.href = '/user-panel/'
        } else {
            setError(result.error || 'Kirish amalga oshmadi. Qaytadan urinib ko\'ring.')
        }

        setIsSubmitting(false)
    }

    return (
        <div className="auth-container">
            <div className="auth-background"></div>

            <div className="auth-card">
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        <img src="/robologo.png" alt="Robotronix" />
                        <span className="auth-logo-text">Robotronix</span>
                    </Link>
                    <h1 className="auth-title">Xush kelibsiz!</h1>
                    <p className="auth-subtitle">Hisobingizga kirish uchun ma'lumotlaringizni kiriting</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && (
                        <div className="auth-error">
                            <i className="fas fa-exclamation-circle"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="auth-form-group">
                        <label htmlFor="email" className="auth-form-label">
                            Email manzil
                        </label>
                        <div className="auth-form-input-wrapper">
                            <i className="fas fa-envelope auth-form-icon"></i>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="auth-form-input"
                                placeholder="example@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="auth-form-group">
                        <label htmlFor="password" className="auth-form-label">
                            Parol
                        </label>
                        <div className="auth-form-input-wrapper">
                            <i className="fas fa-lock auth-form-icon"></i>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                className="auth-form-input"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
                            >
                                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    <div className="auth-options">
                        <div className="auth-checkbox">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                name="rememberMe"
                                checked={formData.rememberMe}
                                onChange={handleChange}
                            />
                            <label htmlFor="rememberMe">Meni eslab qol</label>
                        </div>
                        <Link to="/forgot-password" className="auth-forgot-link">Parolni unutdingizmi?</Link>
                    </div>

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="auth-spinner"></div>
                                <span>Kirish...</span>
                            </>
                        ) : (
                            <>
                                <i className="fas fa-sign-in-alt"></i>
                                <span>Kirish</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p className="auth-footer-text">
                        Hisobingiz yo'qmi?{' '}
                        <Link to="/register" className="auth-footer-link">
                            Ro'yxatdan o'tish
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
