import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './hooks/useToast';
import { ConfirmProvider } from './hooks/useConfirm';
import Sidebar from './components/Sidebar';
import { syncService } from './services/SyncService';
import './App.css';

// Lazy loaded components
import Dashboard from './components/Dashboard';
const Login = lazy(() => import('./pages/Login'));
const Users = lazy(() => import('./pages/Users'));
const Courses = lazy(() => import('./pages/Courses'));
const Students = lazy(() => import('./pages/Students'));
const Certifications = lazy(() => import('./pages/Certifications'));
const CertificateHolders = lazy(() => import('./pages/CertificateHolders'));
const Products = lazy(() => import('./pages/Products'));
const Payments = lazy(() => import('./pages/Payments'));
const Orders = lazy(() => import('./pages/Orders'));
const Geography = lazy(() => import('./pages/Geography'));
const Applications = lazy(() => import('./pages/Applications'));
const Audit = lazy(() => import('./pages/Audit'));
const Chat = lazy(() => import('./pages/Chat'));
const Profile = lazy(() => import('./pages/Profile'));
const Team = lazy(() => import('./pages/Team'));
const News = lazy(() => import('./pages/News'));

function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  if (isInitializing) return null; // AppRoutes spinner ko'rsatadi
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
}

function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
        syncService.init();
    }
    return () => {
        syncService.disconnect();
    };
  }, []); // Mount/unmount only — user o'zgarganda qayta connect qilish shart emas

  const handleToggleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  };

  return (
    <div className="app">
      <div className={`mobile-header ${isMobileMenuOpen ? 'pushed' : ''}`}>
        <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
        <span className="mobile-logo-text">Robotronix Admin</span>
      </div>

      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={handleToggleCollapse}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />
      <main className={`main-content ${isCollapsed ? 'sidebar-collapsed' : ''} ${isMobileMenuOpen ? 'mobile-shifted' : ''}`}>
        <Suspense fallback={<div className="loading-fallback">Yuklanmoqda...</div>}>
          <Outlet />
        </Suspense>
      </main>
      {isMobileMenuOpen && <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}
    </div>
  );
}

function AppRoutes() {
  const { isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div style={{
        height: '100vh', 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--bg)',
        color: 'var(--text-primary)',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid rgba(0, 102, 255, 0.1)',
          borderTop: '3px solid #0066ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{ fontSize: '1.2rem', fontWeight: 500, letterSpacing: '1px' }}>SESSIYA TEKSHIRILMOQDA...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        <Suspense fallback={<div className="loading-fallback">Yuklanmoqda...</div>}>
          <Login />
        </Suspense>
      } />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="courses" element={<Courses />} />
          <Route path="students" element={<Students />} />
          <Route path="certifications" element={<Certifications />} />
          <Route path="certificate-holders" element={<CertificateHolders />} />
          <Route path="products" element={<Products />} />
          <Route path="payments" element={<Payments />} />
          <Route path="orders" element={<Orders />} />
          <Route path="geography" element={<Geography />} />
          <Route path="applications" element={<Applications />} />
          <Route path="audit" element={<Audit />} />
          <Route path="chat" element={<Chat />} />
          <Route path="news" element={<News />} />
          <Route path="team" element={<Team />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <AppRoutes />
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
