import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'

const Navbar = () => {
    const [dark, setDark] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const location = useLocation()

    useEffect(() => {
        setDark(document.documentElement.classList.contains('dark'))
    }, [])

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => setIsMobileMenuOpen(false), 0)
        return () => clearTimeout(timer)
    }, [location])

    useEffect(() => {
        document.body.classList.toggle('menu-open', isMobileMenuOpen)
        return () => document.body.classList.remove('menu-open')
    }, [isMobileMenuOpen])

    const handleNavClick = (e, targetId) => {
        const isHomePage = location.pathname === '/' || location.pathname === ''
        if (!isHomePage) {
            setIsMobileMenuOpen(false)
            return
        }
        e.preventDefault()
        const element = document.getElementById(targetId)
        if (element) element.scrollIntoView({ behavior: 'smooth' })
        setIsMobileMenuOpen(false)
    }

    const toggleTheme = () => {
        const isDark = document.documentElement.classList.toggle('dark')
        setDark(isDark)
        localStorage.setItem('theme', isDark ? 'dark' : 'light')
    }

    return (
        <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`} id="navbar">
            <div className="container">
                <div className="nav-content">
                    <Link to="/" className="logo">
                        <img src="/robologo.png" alt="Robotronix" className="logo-img" />
                        <span className="logo-text">Robotronix</span>
                    </Link>

                    <ul className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`} id="nav-menu">
                        <li>
                            <a href="/#home" className="nav-link" onClick={(e) => handleNavClick(e, 'home')}>
                                Bosh sahifa
                            </a>
                        </li>
                        <li>
                            <Link to="/courses" className="nav-link">Kurslar</Link>
                        </li>
                        <li>
                            <Link to="/products" className="nav-link">Do'kon</Link>
                        </li>
                        <li>
                            <Link to="/news" className="nav-link">Yangiliklar</Link>
                        </li>
                        <li>
                            <a href="/#about" className="nav-link" onClick={(e) => handleNavClick(e, 'about')}>
                                Biz haqimizda
                            </a>
                        </li>
                        <li>
                            <a href="/#contact" className="nav-link" onClick={(e) => handleNavClick(e, 'contact')}>
                                Aloqa
                            </a>
                        </li>

                        {/* Mobile Auth Section */}
                        <li className="mobile-auth-separator">
                            <div className="separator-line"></div>
                            <span className="separator-text">Hisob</span>
                            <div className="separator-line"></div>
                        </li>
                        <li className="mobile-auth-item">
                            <Link to="/login" className="nav-link mobile-auth-link" onClick={() => setIsMobileMenuOpen(false)}>
                                <i className="fas fa-sign-in-alt"></i> Kirish
                            </Link>
                        </li>
                        <li className="mobile-auth-item">
                            <Link to="/register" className="nav-link mobile-auth-link primary" onClick={() => setIsMobileMenuOpen(false)}>
                                <i className="fas fa-user-plus"></i> Ro'yxatdan o'tish
                            </Link>
                        </li>
                    </ul>

                    <div className="nav-actions">
                        <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Mavzuni almashtirish">
                            {dark ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <Link to="/login" className="btn-outline">Kirish</Link>
                        <Link to="/register" className="btn-primary">Ro'yxatdan o'tish</Link>

                        <button
                            className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}
                            id="hamburger"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
