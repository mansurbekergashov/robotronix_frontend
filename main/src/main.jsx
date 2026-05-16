import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/index.css'
import './styles/LayoutFixes.css'
import './styles/mobile.css'
import './styles/cart.css'
import './styles/auth.css'
import './styles/news.css'

// Initialize AOS
import AOS from 'aos'
import 'aos/dist/aos.css'

// Initialize AOS when DOM is ready
AOS.init({
  duration: 700,
  easing: 'ease-out-cubic',
  once: true,
  offset: 60
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
