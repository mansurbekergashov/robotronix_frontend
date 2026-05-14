import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaBook, FaBox, FaShoppingCart, FaEnvelope, FaArrowUp, FaClipboardList, FaPlus, FaStore } from 'react-icons/fa';
import api from '../services/api';
import './Dashboard.css';

interface Stats {
  totalUsers: number;
  totalCourses: number;
  totalProducts: number;
  totalEnrollments: number;
  unreadMessages: number;
  totalOrders: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="dashboard"><p>Yuklanmoqda...</p></div>;

  const statCards = [
    { title: 'Foydalanuvchilar', value: stats?.totalUsers || 0, icon: <FaUsers />, color: '#0066ff' },
    { title: 'Kurslar', value: stats?.totalCourses || 0, icon: <FaBook />, color: '#00ccff' },
    { title: 'Mahsulotlar', value: stats?.totalProducts || 0, icon: <FaBox />, color: '#ff5722' },
    { title: 'Buyurtmalar', value: stats?.totalOrders || 0, icon: <FaShoppingCart />, color: '#9c27b0' },
    { title: 'Arizalar', value: stats?.totalEnrollments || 0, icon: <FaClipboardList />, color: '#ff9800' },
    { title: 'Xabarlar', value: stats?.unreadMessages || 0, icon: <FaEnvelope />, color: '#4caf50' },
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Robotronix Admin Panel</p>
        </div>
      </header>

      <div className="stats-grid">
        {statCards.map((stat) => (
          <div key={stat.title} className="stat-card">
            <div className="stat-content">
              <p className="stat-title">{stat.title}</p>
              <h2 className="stat-value">{stat.value.toLocaleString()}</h2>
              <div className="stat-change up">
                <FaArrowUp />
                <span>Real</span>
              </div>
            </div>
            <div className="stat-icon" style={{ background: stat.color }}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="welcome-card">
          <div className="welcome-text">
            <h2>Xush kelibsiz, {user?.fullName || 'Admin'}!</h2>
            <p>Chap tomondagi menu orqali saytni boshqarishingiz mumkin. Barcha funksiyalar sizning ixtiyoringizda.</p>
          </div>
          <div className="quick-actions">
            <button className="action-btn primary" onClick={() => navigate('/courses')}>
              <FaPlus />
              <span>Yangi kurs qo'shish</span>
            </button>
            <button className="action-btn secondary" onClick={() => navigate('/products')}>
              <FaStore />
              <span>Mahsulot qo'shish</span>
            </button>
            <button className="action-btn secondary" onClick={() => navigate('/applications')}>
              <FaClipboardList />
              <span>Arizalarni ko'rish</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
