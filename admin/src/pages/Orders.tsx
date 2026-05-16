import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaEye, FaTimes, FaCheck, FaBoxOpen, FaTruck, FaBan, FaSearch, FaComments, FaTrash } from 'react-icons/fa';
import api from '../services/api';
import { syncService } from '../services/SyncService';
import './Orders.css';

interface OrderData {
  id: number;
  user?: { id: number; fullName: string; phone: string; email: string };
  items?: { product?: { title: string }; quantity: number; price: number }[];
  totalAmount: number;
  paymentConfirmed?: boolean;
  status: string;
  shippingAddress: string;
  contactPhone: string;
  createdAt: string;
  trackingNumber?: string;
  shippingStatus?: string;
}

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

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

      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      showNotification('Holat muvaffaqiyatli yangilandi', 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('Holatni yangilashda xatolik yuz berdi', 'error');
    }
  };

  const requestConfirm = (id: number, status: string) => {
    updateStatus(id, status);
  };

  const shipOrder = async (id: number) => {
    try {
      const res = await api.post(`/admin/orders/${id}/ship`);
      const updated = res.data;
      setOrders(orders.map(o => o.id === id ? { ...o, ...updated } : o));
      if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, ...updated });
      showNotification(`UzPost ga yuborildi. Tracking: ${updated.trackingNumber || '—'}`, 'success');
    } catch (error: any) {
      showNotification(error?.response?.data?.message || 'UzPost ga yuborishda xatolik', 'error');
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
                  {selectedOrder.trackingNumber && (
                    <p><strong>Tracking:</strong> <code>{selectedOrder.trackingNumber}</code> <span style={{ color: '#8b92a7', fontSize: '12px' }}>({selectedOrder.shippingStatus})</span></p>
                  )}
                </div>
              </div>

              <div className="detail-grid" style={{ marginTop: '1rem' }}>
                <div className="detail-section">
                  <h3>To'lov holati</h3>
                  {selectedOrder.paymentConfirmed ? (
                    <p><span className="badge badge-success"><FaCheck /> Payme orqali to'langan</span></p>
                  ) : (
                    <p><span className="badge badge-warning">To'lov kutilmoqda</span></p>
                  )}
                  <p style={{ marginTop: '0.5rem', color: '#8b92a7', fontSize: '13px' }}>
                    To'lov Payme orqali avtomatik tasdiqlanadi
                  </p>
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
                    disabled={selectedOrder.status === 'SHIPPED' || selectedOrder.status === 'DELIVERED' || selectedOrder.status === 'RECEIVED'}
                    onClick={() => shipOrder(selectedOrder.id)}
                  >
                    <FaTruck /> UzPost ga yuborish
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

    </div>
  );
}
