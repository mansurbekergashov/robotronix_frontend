import React, { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import Preloader from './components/common/Preloader'
import ScrollToHash from './components/common/ScrollToHash'
import BackToTop from './components/common/BackToTop'
import DroneBackground from './components/common/DroneBackground'

// Lazy loaded pages
import HomePage from './pages/HomePage'
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CoursesPage = lazy(() => import('./pages/CoursesPage'))
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'))
const NewsPage = lazy(() => import('./pages/NewsPage'))

// Payme callback redirect: robotronix.uz/orders → /user-panel/#orders
function OrdersRedirect() {
  useEffect(() => { window.location.replace('/user-panel/#orders'); }, []);
  return <div style={{ textAlign: 'center', padding: '3rem', color: '#8b92a7' }}>Buyurtmalar sahifasiga o'tilmoqda...</div>;
}

const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

function App() {
  const location = useLocation();
  const isAuthPage = AUTH_ROUTES.includes(location.pathname);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <DroneBackground />
        <Preloader />
        <ScrollToHash />
        {!isAuthPage && <Navbar />}
        <main>
          <Suspense fallback={<div className="loading-fallback">Yuklanmoqda...</div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:id" element={<CourseDetailPage />} />
              <Route path="/news" element={<NewsPage />} />
              {/* Payme callback redirect → user panel orders */}
              <Route path="/orders" element={<OrdersRedirect />} />
            </Routes>
          </Suspense>
        </main>
        {!isAuthPage && <BackToTop />}
        {!isAuthPage && <Footer />}
      </CartProvider>
    </AuthProvider>
  )
}

export default App

