import { NavLink, useNavigate } from 'react-router-dom';
import {
  FaHome, FaUsers, FaBook, FaBox, FaShoppingCart,
  FaClipboardList, FaComments, FaUserGraduate, FaCertificate,
  FaHistory, FaGlobe, FaSignOutAlt, FaChevronDown, FaUserCircle, FaUserCheck, FaNewspaper, FaCreditCard,
  FaMapMarkerAlt, FaIdBadge
} from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { syncService } from '../services/SyncService';
import api from '../services/api';
import './Sidebar.css';
import { useTheme } from "../context/ThemeContext";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path: string;
  badge?: number;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <FaHome />, path: '/' },
  { id: 'users', label: 'Foydalanuvchilar', icon: <FaUsers />, path: '/users' },
  { id: 'courses', label: 'Kurslar', icon: <FaBook />, path: '/courses' },
  { id: 'students', label: 'O\'quvchilar', icon: <FaUserGraduate />, path: '/students' },
  { id: 'certifications', label: 'Sertifikatlash', icon: <FaCertificate />, path: '/certifications' },
  { id: 'certificate-holders', label: 'Sertifikat olganlar', icon: <FaUserCheck />, path: '/certificate-holders' },
  { id: 'products', label: 'Mahsulotlar', icon: <FaBox />, path: '/products' },
  { id: 'payments', label: 'To\'lovlar', icon: <FaCreditCard />, path: '/payments' },
  { id: 'orders', label: 'Buyurtmalar', icon: <FaShoppingCart />, path: '/orders' },
  { id: 'geography', label: 'Pochta manzillari', icon: <FaMapMarkerAlt />, path: '/geography' },
  { id: 'applications', label: "Arizalar", icon: <FaClipboardList />, path: '/applications' },
  { id: 'news', label: 'Yangiliklar', icon: <FaNewspaper />, path: '/news' },
  { id: 'team', label: 'Jamoa', icon: <FaIdBadge />, path: '/team' },
  { id: 'audit', label: 'Audit Jurnali', icon: <FaHistory />, path: '/audit' },
  { id: 'chat', label: 'Chat', icon: <FaComments />, path: '/chat' },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<{ orders: number; enrollments: number; chatUnread: number }>({
    orders: 0,
    enrollments: 0,
    chatUnread: 0,
  });
  const fetchTimerRef = useRef<number | null>(null);

  const fetchStats = async () => {
    try {
      const [adminStatsRes, chatUnreadRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/chat/unread-count'),
      ]);

      const chatUnread = Number(chatUnreadRes?.data?.count || 0);
      setStats({
        orders: adminStatsRes.data.totalOrders || 0,
        enrollments: adminStatsRes.data.totalEnrollments || 0,
        chatUnread: Number.isFinite(chatUnread) ? chatUnread : 0,
      });
    } catch (error) {
      console.error('Error fetching stats for sidebar:', error);
    }
  };

  // Debounced wrapper — collapses rapid bursts of sync events into one call
  const scheduleFetchStats = () => {
    if (fetchTimerRef.current) window.clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = window.setTimeout(() => {
      fetchTimerRef.current = null;
      fetchStats();
    }, 300);
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);

    window.addEventListener('robotronix:chat-unread-update', scheduleFetchStats);
    const unsubOrders = syncService.subscribe('ORDER', scheduleFetchStats);
    const unsubEnrolls = syncService.subscribe('ENROLLMENT', scheduleFetchStats);
    const unsubChat = syncService.subscribe('CHAT', scheduleFetchStats);

    return () => {
      clearInterval(interval);
      if (fetchTimerRef.current) window.clearTimeout(fetchTimerRef.current);
      window.removeEventListener('robotronix:chat-unread-update', scheduleFetchStats);
      unsubOrders();
      unsubEnrolls();
      unsubChat();
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-logo">
          <img src="/robologo.png" alt="Robotronix" />
        </div>
        {!isCollapsed && (
          <div className="brand-text">
            <h2>Robotronix</h2>
            <p>Admin Panel</p>
          </div>
        )}
      </div>

      <div className="sidebar-header">
        <div className="admin-avatar">
          <img
            src={user?.avatarUrl ? user.avatarUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Admin')}&background=0066ff&color=fff`}
            alt="Admin"
          />
        </div>
        {!isCollapsed && (
          <>
            <h3 className="admin-name">{user?.fullName || 'Admin User'}</h3>
            <p className="admin-role">Administrator</p>
          </>
        )}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const badgeValue = (item.id === 'orders'
            ? stats.orders
            : item.id === 'applications'
              ? stats.enrollments
              : item.id === 'chat'
                ? stats.chatUnread
                : item.badge) ?? 0;

          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              end={item.path === '/'}
              title={isCollapsed ? item.label : ''}
              onClick={closeMobileMenu}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
              {!isCollapsed && badgeValue > 0 && (
                <span className="nav-badge">{badgeValue}</span>
              )}
            </NavLink>
          );
        })}
      </nav>
      <button className='nav-item' onClick={toggleTheme} title={isCollapsed ? 'Rejim' : ''}>
        {theme === "light" ? <span className='nav-icon'><i className="fas fa-moon"></i></span> :<span className='nav-icon'><i className="fas fa-sun"></i></span>}
        {!isCollapsed && <span className="nav-label">Rejim</span>}

      </button>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={isCollapsed ? 'Profil' : ''} onClick={closeMobileMenu}>
          <span className="nav-icon"><FaUserCircle /></span>
          {!isCollapsed && <span className="nav-label">Profil</span>}
        </NavLink>
        <a href="/" target="_blank" className="nav-item settings" title={isCollapsed ? 'Saytga qaytish' : ''}>
          <span className="nav-icon"><FaGlobe /></span>
          {!isCollapsed && <span className="nav-label">Saytga qaytish</span>}
        </a>
        <button className="nav-item logout" onClick={handleLogout} title={isCollapsed ? 'Chiqish' : ''}>
          <span className="nav-icon"><FaSignOutAlt /></span>
          {!isCollapsed && <span className="nav-label">Chiqish</span>}
        </button>

      <button className="sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
        <FaChevronDown className={isCollapsed ? 'rotated' : ''} />
      </button>
    </aside>
  );
}

