import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useEffect } from "react";
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import Preloader from './components/common/Preloader'
import ScrollToHash from './components/common/ScrollToHash'
import ChatWidget from './components/common/ChatWidget'
import BackToTop from './components/common/BackToTop'

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

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <Preloader />
        <ScrollToHash />
        <Navbar />
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
            </Routes>
          </Suspense>
        </main>
        <ChatWidget />
        <BackToTop />
        <Footer />
      </CartProvider>
    </AuthProvider>
  )
}

export default App

