import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaEye, FaTimes, FaCheck, FaBoxOpen, FaTruck, FaBan, FaSearch, FaComments, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import api from '../services/api';
import { syncService } from '../services/SyncService';
import './Orders.css';

interface OrderData {
  id: number;
  user?: { id: number; fullName: string; phone: string; email: string };
  items?: { product?: { title: string }; quantity: number; price: number }[];
  totalAmount: number;
  paymentCardId?: number | null;
  paymentReceiptUrl?: string | null;
  status: string;
  shippingAddress: string;
  contactPhone: string;
  createdAt: string;
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

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentCards, setPaymentCards] = useState<PaymentCard[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ id: number; status: string; hasReceipt: boolean } | null>(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Polling every 10s is enough
    
    // Listen for real-time updates
    const unsub = syncService.subscribe('ORDER', fetchOrders);
    
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [filterStatus, searchTerm]); // Refetch when filters change

  useEffect(() => {
    fetchPaymentCards();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/admin/orders', {
        params: { status: filterStatus, search: searchTerm }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
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


  const handleDeleteOrder = async (id: number) => {
    if (!confirm("Ushbu buyurtmani butunlay o'chirishni tasdiqlaysizmi? Bu amal qaytarilmaydi!")) return;
    
    try {
      await api.delete(`/admin/orders/${id}`);
      setOrders(orders.filter(o => o.id !== id));
      if (selectedOrder?.id === id) {
        setSelectedOrder(null);
      }
      showNotification('Buyurtma muvaffaqiyatli o\'chirildi', 'success');
    } catch (error) {
      console.error('Error deleting order:', error);
      showNotification('Buyurtmani o\'chirishda xatolik yuz berdi', 'error');
    }
  };

  const handleStartChat = (order: OrderData) => {
    if (order.user) {
      navigate('/chat', { state: { userId: order.user.id, email: order.user.email, fullName: order.user.fullName } });
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await api.put(`/admin/orders/${id}/status`, { status: newStatus });

      // If confirmed, the receipt was deleted on backend — clear it locally too
      const receiptDeleted = newStatus === 'CONFIRMED';

      setOrders(orders.map(o =>
        o.id === id
          ? { ...o, status: newStatus, ...(receiptDeleted ? { paymentReceiptUrl: null } : {}) }
          : o
      ));
      if (selectedOrder?.id === id) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus,
          ...(receiptDeleted ? { paymentReceiptUrl: null } : {}),
        });
      }

      if (receiptDeleted) {
        showNotification('✅ Buyurtma tasdiqlandi va to\'lov cheki o\'chirildi', 'success');
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
      const order = orders.find(o => o.id === id) || selectedOrder;
      const hasReceipt = !!(order?.paymentReceiptUrl);
      setConfirmDialog({ id, status, hasReceipt });
    } else {
      updateStatus(id, status);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; class: string; icon: React.ReactElement }> = {
      PENDING: { label: 'Kutilmoqda', class: 'badge-warning', icon: <FaBoxOpen /> },
      CONFIRMED: { label: 'Tasdiqlandi', class: 'badge-info', icon: <FaCheck /> },
      PREPARING: { label: 'Tayyorlanmoqda', class: 'badge-primary', icon: <FaBoxOpen /> },
      SHIPPED: { label: 'Yuborildi', class: 'badge-secondary', icon: <FaTruck /> },
      DELIVERED: { label: 'Yetkazildi', class: 'badge-success', icon: <FaCheck /> },
      RECEIVED: { label: 'Qabul qilindi', class: 'badge-success', icon: <FaCheck /> },
      CANCELLED: { label: 'Bekor qilindi', class: 'badge-danger', icon: <FaBan /> },
    };
    return badges[status] || { label: status, class: 'badge-info', icon: <FaBoxOpen /> };
  };


  if (loading) return <div className="page-container"><p>Yuklanmoqda...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><FaShoppingCart /> Buyurtmalar</h1>
          <p>Barcha buyurtmalarni ko'ring ({orders.length} ta)</p>
        </div>
        <div className="page-toolbar">
          <div className="toolbar-filters">
            <div className="search-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Foydalanuvchi ismi yoki email..."
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
                <option value="CONFIRMED">Tasdiqlandi</option>
                <option value="PREPARING">Tayyorlanmoqda</option>
                <option value="SHIPPED">Yuborildi</option>
                <option value="DELIVERED">Yetkazildi</option>
                <option value="RECEIVED">Qabul qilindi</option>
                <option value="CANCELLED">Bekor qilindi</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Foydalanuvchi</th>
              <th>Jami summa</th>
              <th>Holati</th>
              <th>Sana</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {

              return (
                <tr key={order.id} onClick={() => setSelectedOrder(order)} className="clickable-row">
                  <td>#{order.id}</td>
                  <td>
                    <div className="user-info">
                      <span className="user-name">{order.user?.fullName || '-'}</span>
                      <span className="user-phone">{order.contactPhone || order.user?.phone || ''}</span>
                    </div>
                  </td>
                  <td><strong className="amount">{(order.totalAmount || 0).toLocaleString()} so'm</strong></td>
                  <td>
                    <span className={`badge ${getStatusBadge(order.status).class}`}>
                      {getStatusBadge(order.status).icon} {getStatusBadge(order.status).label}
                    </span>
                  </td>
                  <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('uz-UZ') : '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-message"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartChat(order);
                        }}
                        title="Habar yuborish"
                      >
                        <FaComments />
                      </button>
                      <button
                        className="btn-icon btn-view"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                        title="Batafsil"
                      >
                        <FaEye />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOrder(order.id);
                        }}
                        title="O'chirish"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Buyurtmalar hali yo'q</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content order-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Buyurtma #{selectedOrder.id}</h2>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-section">
                  <h3><FaCheck /> Buyurtma ma'lumotlari</h3>
                  <p><strong>Holat:</strong> <span className={`badge ${getStatusBadge(selectedOrder.status).class}`}>{getStatusBadge(selectedOrder.status).label}</span></p>
                  <p><strong>Sana:</strong> {new Date(selectedOrder.createdAt).toLocaleString('uz-UZ')}</p>
                  <p><strong>Jami summa:</strong> {selectedOrder.totalAmount.toLocaleString()} so'm</p>
                </div>
                <div className="detail-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Foydalanuvchi</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn-icon btn-message"
                        onClick={() => handleStartChat(selectedOrder)}
                        title="Habar yuborish"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '1rem', gap: '5px' }}
                      >
                        <FaComments />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDeleteOrder(selectedOrder.id)}
                        title="O'chirish"
                        style={{ padding: '', fontSize: '1rem', gap: '5px' }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <p><strong>Ism:</strong> {selectedOrder.user?.fullName}</p>
                  <p><strong>Telefon:</strong> {selectedOrder.contactPhone || selectedOrder.user?.phone}</p>
                  <p><strong>Manzil:</strong> {selectedOrder.shippingAddress || 'Ko\'rsatilmagan'}</p>
                </div>
              </div>

              <div className="detail-grid" style={{ marginTop: '1rem' }}>
                <div className="detail-section">
                  <h3>To'lov ma'lumotlari</h3>
                  {(() => {
                    const card = paymentCards.find(c => c.id === selectedOrder.paymentCardId);
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
                  {selectedOrder.paymentReceiptUrl ? (
                    <a className="btn-secondary" href={selectedOrder.paymentReceiptUrl} target="_blank" rel="noreferrer">
                      Chekni ko'rish
                    </a>
                  ) : (
                    <p>{selectedOrder.status === 'CONFIRMED' ? 'Chek tasdiqlangandan keyin o\'chirilgan' : 'Chek yuklanmagan'}</p>
                  )}
                </div>
              </div>

              <h3>Mahsulotlar</h3>
              <div className="order-items-list">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="order-item-row">
                    <span>{item.product?.title}</span>
                    <span>{item.quantity} x {(item.price || 0).toLocaleString()} so'm</span>
                    <strong>{(item.quantity * (item.price || 0)).toLocaleString()} so'm</strong>
                  </div>
                ))}
              </div>

              <div className="status-management">
                <h3>Holatni boshqarish</h3>
                <div className="status-actions">
                  <button
                    className="btn-status btn-info"
                    disabled={selectedOrder.status === 'CONFIRMED' || selectedOrder.status === 'RECEIVED'}
                    onClick={() => requestConfirm(selectedOrder.id, 'CONFIRMED')}
                  >
                    <FaCheck /> Tasdiqlash
                  </button>
                  <button
                    className="btn-status btn-primary"
                    disabled={selectedOrder.status === 'PREPARING' || selectedOrder.status === 'RECEIVED'}
                    onClick={() => updateStatus(selectedOrder.id, 'PREPARING')}
                  >
                    <FaBoxOpen /> Tayyorlash
                  </button>
                  <button
                    className="btn-status btn-secondary"
                    disabled={selectedOrder.status === 'SHIPPED' || selectedOrder.status === 'RECEIVED'}
                    onClick={() => updateStatus(selectedOrder.id, 'SHIPPED')}
                  >
                    <FaTruck /> Yuborish
                  </button>
                  <button
                    className="btn-status btn-success"
                    disabled={selectedOrder.status === 'DELIVERED' || selectedOrder.status === 'RECEIVED'}
                    onClick={() => updateStatus(selectedOrder.id, 'DELIVERED')}
                  >
                    <FaCheck /> Yetkazilgan qilish
                  </button>
                  <button
                    className="btn-status btn-danger"
                    disabled={selectedOrder.status === 'CANCELLED' || selectedOrder.status === 'RECEIVED'}
                    onClick={() => updateStatus(selectedOrder.id, 'CANCELLED')}
                  >
                    <FaBan /> Bekor qilish
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation dialog for confirming order */}
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
                Buyurtmani tasdiqlashni xohlaysizmi?
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
                  updateStatus(confirmDialog.id, confirmDialog.status);
                  setConfirmDialog(null);
                }}
              >
                <FaCheck /> Ha, tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
