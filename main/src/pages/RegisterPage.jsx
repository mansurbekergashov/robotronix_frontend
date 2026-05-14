import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { register } = useAuth()
    const navigate = useNavigate()

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

        // Validation
        if (formData.password.length < 6) {
            setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak')
            setIsSubmitting(false)
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Parollar mos kelmadi')
            setIsSubmitting(false)
            return
        }

        if (!formData.agreeToTerms) {
            setError('Shartlarga rozilik berishingiz kerak')
            setIsSubmitting(false)
            return
        }

        const result = await register({
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password
        })

        if (result.success) {
            // After successful registration, redirect to login
            navigate('/login')
        } else {
            setError(result.error || 'Ro\'yxatdan o\'tish amalga oshmadi.')
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
                    <h1 className="auth-title">Hisob yaratish</h1>
                    <p className="auth-subtitle">Ro'yxatdan o'tish uchun ma'lumotlaringizni kiriting</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && (
                        <div className="auth-error">
                            <i className="fas fa-exclamation-circle"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="auth-form-group">
                        <label htmlFor="fullName" className="auth-form-label">
                            Ism va familiya
                        </label>
                        <div className="auth-form-input-wrapper">
                            <i className="fas fa-user auth-form-icon"></i>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                className="auth-form-input"
                                placeholder="Ism Familiya"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                autoComplete="name"
                            />
                        </div>
                    </div>

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
                        <label htmlFor="phone" className="auth-form-label">
                            Telefon raqam
                        </label>
                        <div className="auth-form-input-wrapper">
                            <i className="fas fa-phone auth-form-icon"></i>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                className="auth-form-input"
                                placeholder="+998 90 123 45 67"
                                value={formData.phone}
                                onChange={handleChange}
                                autoComplete="tel"
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
                                minLength={6}
                                autoComplete="new-password"
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

                    <div className="auth-form-group">
                        <label htmlFor="confirmPassword" className="auth-form-label">
                            Parolni tasdiqlash
                        </label>
                        <div className="auth-form-input-wrapper">
                            <i className="fas fa-lock auth-form-icon"></i>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                name="confirmPassword"
                                className="auth-form-input"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                minLength={6}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label={showConfirmPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
                            >
                                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    <div className="auth-checkbox">
                        <input
                            type="checkbox"
                            id="agreeToTerms"
                            name="agreeToTerms"
                            checked={formData.agreeToTerms}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="agreeToTerms">
                            <a href="#" className="auth-footer-link">Foydalanish shartlari</a> va{' '}
                            <a href="#" className="auth-footer-link">Maxfiylik siyosati</a>ga roziman
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="auth-spinner"></div>
                                <span>Ro'yxatdan o'tish...</span>
                            </>
                        ) : (
                            <>
                                <i className="fas fa-user-plus"></i>
                                <span>Ro'yxatdan o'tish</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p className="auth-footer-text">
                        Hisobingiz bormi?{' '}
                        <Link to="/login" className="auth-footer-link">
                            Kirish
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default RegisterPage
