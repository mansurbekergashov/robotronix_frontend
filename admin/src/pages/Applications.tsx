import { useState, useEffect } from 'react';
import { FaGraduationCap, FaSearch, FaTimes, FaComments, FaClock, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { syncService } from '../services/SyncService';
import './Applications.css';

interface Application {
  id: number;
  fullName: string;
  phone: string;
  courseTitle: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  createdAt: string;
  userEmail?: string;
  paymentCardId?: number | null;
  paymentReceiptUrl?: string | null;
}

interface PaymentCard {
  id: number;
  label: string;
  cardNumber: string;
  cardHolder: string;
  bankName?: string;
  phone?: string;
  isActive: boolean;
}

export default function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [paymentCards, setPaymentCards] = useState<PaymentCard[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{ id: number; status: string; hasReceipt: boolean } | null>(null);
  const navigate = useNavigate();

  const PAGE_SIZE = 50;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    fetchApplications(0, false);
    const interval = setInterval(() => fetchApplications(0, false, true), 60000); // light polling fallback (1 min)
    
    // Listen for global enrollments
    const unsubEnroll = syncService.subscribe('ENROLLMENT', () => {
      fetchApplications(0, false, true);
    });
    
    return () => {
      clearInterval(interval);
      unsubEnroll();
    };
  }, [debouncedSearch, filterStatus]);

  useEffect(() => {
    fetchPaymentCards();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchApplications = async (pageToLoad = 0, append = false, merge = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await api.get('/admin/enrollments', {
        params: { status: filterStatus, search: debouncedSearch, page: pageToLoad, size: PAGE_SIZE }
      });
      const items = response.data || [];

      setHasMore(items.length === PAGE_SIZE);
      setPage(pageToLoad);

      setApplications(prev => {
        if (append) return [...prev, ...items];
        if (!merge) return items;

        const nextIds = new Set(items.map((x: any) => x.id));
        const rest = prev.filter((x: any) => !nextIds.has(x.id));
        return [...items, ...rest];
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
      showNotification('Arizalarni yuklashda xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchPaymentCards = async () => {
    try {
      const response = await api.get('/admin/payment-cards');
      setPaymentCards(response.data || []);
    } catch (error) {
      console.error('Error fetching payment cards:', error);
    }
  };


  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await api.put(`/admin/enrollments/${id}/status`, { status });

      // If confirmed, the receipt was deleted on backend — clear it locally too
      const receiptDeleted = status === 'CONFIRMED';

      setApplications(applications.map(app =>
        app.id === id
          ? { ...app, status: status as any, ...(receiptDeleted ? { paymentReceiptUrl: null } : {}) }
          : app
      ));
      if (selectedApp?.id === id) {
        setSelectedApp({
          ...selectedApp,
          status: status,
          ...(receiptDeleted ? { paymentReceiptUrl: null } : {}),
        });
      }

      if (receiptDeleted) {
        showNotification('✅ Ariza tasdiqlandi va to\'lov cheki o\'chirildi', 'success');
      } else {
        showNotification('Holat muvaffaqiyatli yangilandi', 'success');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('Holatni yangilashda xatolik yuz berdi', 'error');
    }
  };

  /** Show confirmation dialog when confirming with a receipt */
  const requestConfirm = (id: number, status: string) => {
    if (status === 'CONFIRMED') {
      const app = applications.find((a: any) => a.id === id) || selectedApp;
      const hasReceipt = !!(app?.paymentReceiptUrl);
      setConfirmDialog({ id, status, hasReceipt });
    } else {
      handleStatusUpdate(id, status);
    }
  };

  const handleDeleteApplication = async (id: number) => {
    if (!confirm("Ushbu arizani butunlay o'chirishni tasdiqlaysizmi? Bu amal qaytarilmaydi!")) return;
    
    try {
      await api.delete(`/admin/enrollments/${id}`);
      setApplications(applications.filter(a => a.id !== id));
      if (selectedApp?.id === id) {
        setIsModalOpen(false);
        setSelectedApp(null);
      }
      showNotification('Ariza muvaffaqiyatli o\'chirildi', 'success');
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      showNotification('Arizani o\'chirishda xatolik yuz berdi', 'error');
    }
  };

  const handleStartChat = (app: any) => {
    navigate('/chat', { state: { userId: app.user?.id, email: app.user?.email, fullName: app.user?.fullName } });
  };

  const openDetails = (app: any) => {
    setSelectedApp(app);
    setIsModalOpen(true);
  };

  if (loading) return <div className="page-container"><p>Yuklanmoqda...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><FaGraduationCap /> Kursga yozilganlar</h1>
          <p>Yangi va faol arizalarni boshqaring ({applications.length} ta)</p>
        </div>
      </div>

      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="page-toolbar">
        <div className="toolbar-filters">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Arizalarni qidirish (ism, email)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-group">
            <span className="filter-label">Holati:</span>
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Barcha holatlar</option>
              <option value="PENDING">Kutilmoqda</option>
              <option value="CONFIRMED">Tasdiqlangan</option>
              <option value="REJECTED">Rad etilgan</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-container desktop-view">
        <table className="data-table">
          <thead>
            <tr>
              <th>F.I.SH</th>
              <th>Telefon</th>
              <th>Kurs</th>
              <th>Sana</th>
              <th>Holat</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app: any) => (
              <tr key={app.id} onClick={() => openDetails(app)} className="clickable-row">
                <td>
                  <div className="user-info-cell">
                    <strong>{app.user?.fullName}</strong>
                    <span className="user-email-mini">{app.user?.email}</span>
                  </div>
                </td>
                <td>{app.user?.phone}</td>
                <td>{app.course?.title}</td>
                <td>{new Date(app.createdAt || app.enrolledAt).toLocaleString('uz-UZ')}</td>
                <td>
                  <span className={`badge ${app.status === 'CONFIRMED' ? 'badge-success' :
                    app.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'
                    }`}>
                    {app.status === 'PENDING' ? 'Kutilmoqda' :
                      app.status === 'CONFIRMED' ? 'Tasdiqlangan' : 'Rad etilgan'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-icon btn-chat"
                      title="Chatda bog'lanish"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartChat(app);
                      }}
                    >
                      <FaComments />
                    </button>
                    <button className="btn-icon btn-view" onClick={() => openDetails(app)} title="Batafsil">
                      <FaSearch />
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      title="O'chirish"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteApplication(app.id);
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mobile-cards-view">
        {applications.map((app: any) => (
          <div key={app.id} className="app-card" onClick={() => openDetails(app)}>
            <div className="app-card-header">
              <div className="app-card-user">
                <strong>{app.user?.fullName}</strong>
                <span>{app.user?.phone}</span>
              </div>
              <span className={`badge ${app.status === 'CONFIRMED' ? 'badge-success' :
                app.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'
                }`}>
                {app.status === 'PENDING' ? 'Kutilmoqda' :
                  app.status === 'CONFIRMED' ? 'Tasdiqlangan' : 'Rad etilgan'}
              </span>
            </div>
            <div className="app-card-body">
              <div className="app-card-info">
                <FaGraduationCap /> <span>{app.course?.title}</span>
              </div>
              <div className="app-card-info">
                <FaClock /> <span>{new Date(app.createdAt || app.enrolledAt).toLocaleDateString('uz-UZ')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {applications.length === 0 && (
        <div className="empty-state">Arizalar topilmadi</div>
      )}

      {hasMore && (
        <div className="load-more">
          <button
            className="btn-secondary"
            onClick={() => fetchApplications(page + 1, true)}
            disabled={loadingMore}
          >
            {loadingMore ? "Yuklanmoqda..." : "Ko'proq yuklash"}
          </button>
        </div>
      )}


      {isModalOpen && selectedApp && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ariza #{selectedApp.id}</h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  className="btn-icon btn-delete"
                  onClick={() => handleDeleteApplication(selectedApp.id)}
                  title="O'chirish"
                  style={{ background: 'transparent', color: '#ff5630', fontSize: '1.2rem', border: 'none', cursor: 'pointer' }}
                >
                  <FaTrash />
                </button>
                <button className="close-btn" onClick={() => setIsModalOpen(false)}><FaTimes /></button>
              </div>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-section">
                  <h3><FaGraduationCap /> Ariza ma'lumotlari</h3>
                  <p><strong>Holat:</strong> 
                    <span className={`badge ${selectedApp.status === 'CONFIRMED' ? 'badge-success' :
                      selectedApp.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'
                      }`}>
                      {selectedApp.status === 'PENDING' ? 'Kutilmoqda' :
                        selectedApp.status === 'CONFIRMED' ? 'Tasdiqlangan' : 'Rad etilgan'}
                    </span>
                  </p>
                  <p><strong>Kurs:</strong> {selectedApp.course?.title}</p>
                  <p><strong>Sana:</strong> {new Date(selectedApp.createdAt || selectedApp.enrolledAt).toLocaleString('uz-UZ')}</p>
                </div>

                <div className="detail-section">
                  <h3>Foydalanuvchi</h3>
                  <p><strong>Ism:</strong> {selectedApp.user?.fullName}</p>
                  <p><strong>Email:</strong> {selectedApp.user?.email}</p>
                  <p><strong>Telefon:</strong> {selectedApp.user?.phone}</p>
                </div>
              </div>

              <div className="detail-grid" style={{ marginTop: '1rem' }}>
                <div className="detail-section">
                  <h3>To'lov ma'lumotlari</h3>
                  {(() => {
                    const card = paymentCards.find(c => c.id === selectedApp.paymentCardId);
                    if (!card) {
                      return <p><strong>Karta:</strong> Tanlanmagan</p>;
                    }
                    return (
                      <>
                        <p><strong>Karta:</strong> {card.label}</p>
                        <p><strong>Raqam:</strong> {card.cardNumber}</p>
                        <p><strong>Ega:</strong> {card.cardHolder}</p>
                        {card.bankName && <p><strong>Bank:</strong> {card.bankName}</p>}
                        {card.phone && <p><strong>Telefon:</strong> {card.phone}</p>}
                      </>
                    );
                  })()}
                </div>
                <div className="detail-section">
                  <h3>Chek</h3>
                  {selectedApp.paymentReceiptUrl ? (
                    <a className="btn-secondary" href={selectedApp.paymentReceiptUrl} target="_blank" rel="noreferrer">
                      Chekni ko'rish
                    </a>
                  ) : (
                    <p>{selectedApp.status === 'CONFIRMED' ? 'Chek tasdiqlangandan keyin o\'chirilgan' : 'Chek yuklanmagan'}</p>
                  )}
                </div>
              </div>

              <div className="status-management">
                <h3>Holatni boshqarish</h3>
                <div className="status-actions">
                  <button
                    className="btn-status btn-success"
                    disabled={selectedApp.status === 'CONFIRMED'}
                    onClick={() => {
                      requestConfirm(selectedApp.id, 'CONFIRMED');
                    }}
                  >
                    <FaGraduationCap /> Tasdiqlash
                  </button>
                  <button
                    className="btn-status btn-danger"
                    disabled={selectedApp.status === 'REJECTED'}
                    onClick={() => {
                      handleStatusUpdate(selectedApp.id, 'REJECTED');
                    }}
                  >
                    <FaTimes /> Rad etish
                  </button>
                  <button
                    className="btn-status btn-warning"
                    disabled={selectedApp.status === 'PENDING'}
                    onClick={() => {
                      handleStatusUpdate(selectedApp.id, 'PENDING');
                    }}
                  >
                    <FaClock /> Kutilmoqda qilish
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation dialog for confirming enrollment */}
      {confirmDialog && (
        <div className="modal-overlay confirm-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-dialog-icon">
              <FaExclamationTriangle />
            </div>
            <h3>Diqqat!</h3>
            {confirmDialog.hasReceipt ? (
              <p className="confirm-dialog-text">
                Chekni yaxshilab tekshiring! Agar tasdiqlasangiz, <strong>to'lov cheki o'chirib yuboriladi</strong> va qayta tiklab bo'lmaydi.
                <br /><br />
                Davom etishni xohlaysizmi?
              </p>
            ) : (
              <p className="confirm-dialog-text">
                Arizani tasdiqlashni xohlaysizmi?
              </p>
            )}
            <div className="confirm-dialog-actions">
              <button
                className="btn-status btn-secondary"
                onClick={() => setConfirmDialog(null)}
              >
                Bekor qilish
              </button>
              <button
                className="btn-status btn-success"
                onClick={() => {
                  handleStatusUpdate(confirmDialog.id, confirmDialog.status);
                  setConfirmDialog(null);
                }}
              >
                <FaGraduationCap /> Ha, tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
