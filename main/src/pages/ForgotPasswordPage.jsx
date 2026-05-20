import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

const ForgotPasswordPage = () => {
    const [step, setStep] = useState(1) // 1: email, 2: code + new password
    const [formData, setFormData] = useState({
        email: '',
        token: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        setError('')
    }

    const handleEmailSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')
        setSuccess('')

        try {
            const response = await api.post('/auth/forgot-password', {
                email: formData.email
            })
            setSuccess(response.data.message)
            setStep(2)
        } catch (err) {
            setError(err.response?.data?.message || 'Xatolik yuz berdi. Qaytadan urinib ko\'ring.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleResetSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Parollar mos kelmadi')
            setIsSubmitting(false)
            return
        }

        if (formData.newPassword.length < 6) {
            setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak')
            setIsSubmitting(false)
            return
        }

        try {
            const response = await api.post('/auth/reset-password', {
                token: formData.token,
                newPassword: formData.newPassword
            })

            // Save token and user data
            localStorage.setItem('token', response.data.token)
            if (response.data.refreshToken) {
                localStorage.setItem('refreshToken', response.data.refreshToken)
            }
            localStorage.setItem('user', JSON.stringify(response.data.user))

            setSuccess('Parol muvaffaqiyatli o\'zgartirildi! Tizimga kirilmoqda...')
            
            setTimeout(() => {
                window.location.href = '/user-panel/'
            }, 1500)
        } catch (err) {
            setError(err.response?.data?.message || 'Xatolik yuz berdi. Qaytadan urinib ko\'ring.')
        } finally {
            setIsSubmitting(false)
        }
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
                    <h1 className="auth-title">
                        {step === 1 ? 'Parolni tiklash' : 'Yangi parol o\'rnatish'}
                    </h1>
                    <p className="auth-subtitle">
                        {step === 1 
                            ? 'Email manzilingizni kiriting, sizga tasdiqlash kodi yuboramiz'
                            : 'Emailingizga yuborilgan kodni kiriting va yangi parol o\'rnating'
                        }
                    </p>
                </div>

                {step === 1 ? (
                    <form className="auth-form" onSubmit={handleEmailSubmit}>
                        {error && (
                            <div className="auth-error">
                                <i className="fas fa-exclamation-circle"></i>
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="auth-success">
                                <i className="fas fa-check-circle"></i>
                                <span>{success}</span>
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

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="auth-spinner"></div>
                                    <span>Yuborilmoqda...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-paper-plane"></i>
                                    <span>Kod yuborish</span>
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <form className="auth-form" onSubmit={handleResetSubmit}>
                        {error && (
                            <div className="auth-error">
                                <i className="fas fa-exclamation-circle"></i>
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="auth-success">
                                <i className="fas fa-check-circle"></i>
                                <span>{success}</span>
                            </div>
                        )}

                        <div className="auth-form-group">
                            <label htmlFor="token" className="auth-form-label">
                                Tasdiqlash kodi
                            </label>
                            <div className="auth-form-input-wrapper">
                                <i className="fas fa-key auth-form-icon"></i>
                                <input
                                    type="text"
                                    id="token"
                                    name="token"
                                    className="auth-form-input"
                                    placeholder="Tasdiqlash kodini kiriting"
                                    value={formData.token}
                                    onChange={handleChange}
                                    required
                                    autoComplete="off"
                                />
                            </div>
                            <small style={{ color: '#8b98a5', fontSize: '0.875rem', marginTop: '0.5rem', display: 'block' }}>
                                Emailingizga yuborilgan tasdiqlash kodini kiriting
                            </small>
                        </div>

                        <div className="auth-form-group">
                            <label htmlFor="newPassword" className="auth-form-label">
                                Yangi parol
                            </label>
                            <div className="auth-form-input-wrapper">
                                <i className="fas fa-lock auth-form-icon"></i>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="newPassword"
                                    name="newPassword"
                                    className="auth-form-input"
                                    placeholder="••••••••"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    required
                                    minLength="6"
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
                                Parolni tasdiqlang
                            </label>
                            <div className="auth-form-input-wrapper">
                                <i className="fas fa-lock auth-form-icon"></i>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    className="auth-form-input"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    minLength="6"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="auth-spinner"></div>
                                    <span>O\'zgartirish...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-check"></i>
                                    <span>Parolni o'rnatish</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            className="auth-back-btn"
                            onClick={() => setStep(1)}
                            style={{ 
                                marginTop: '1rem', 
                                background: 'transparent', 
                                color: '#0ac630',
                                border: '1px solid #0ac630'
                            }}
                        >
                            <i className="fas fa-arrow-left"></i>
                            <span>Orqaga</span>
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <p className="auth-footer-text">
                        Parolingizni esladingizmi?{' '}
                        <Link to="/login" className="auth-footer-link">
                            Kirish
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ForgotPasswordPage
