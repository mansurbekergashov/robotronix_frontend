import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaEye, FaTimes, FaCheck, FaBoxOpen, FaTruck, FaBan, FaSearch, FaComments, FaTrash } from 'react-icons/fa';
import api from '../services/api';
import { syncService } from '../services/SyncService';
import { useConfirm } from '../hooks/useConfirm';
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
  receiverJurisdictionId?: number;
}

export default function Orders() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // UzPost ship modal state
  const [shipModal, setShipModal] = useState<{ open: boolean; orderId: number | null }>({ open: false, orderId: null });
  const [jurSearch, setJurSearch] = useState('');
  const [jurisdictions, setJurisdictions] = useState<{ id: number; name: string }[]>([]);
  const [jurLoading, setJurLoading] = useState(false);
  const [selectedJur, setSelectedJur] = useState<{ id: number; name: string } | null>(null);
  const [serviceTypeCode, setServiceTypeCode] = useState('PARCEL');
  const jurSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (!(await confirm({ message: "Ushbu buyurtmani butunlay o'chirishni tasdiqlaysizmi? Bu amal qaytarilmaydi!" }))) return;
    
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

  const openShipModal = (id: number) => {
    const order = orders.find(o => o.id === id);
    setSelectedJur(null);
    setJurSearch('');
    setJurisdictions([]);
    setServiceTypeCode('PARCEL');
    setShipModal({ open: true, orderId: id });
    // Pre-fill if order already has a jurisdiction from user checkout
    if (order?.receiverJurisdictionId) {
      const preId = order.receiverJurisdictionId;
      api.get('/geography/jurisdictions', { params: { levelId: 3, size: 1, search: String(preId) } })
        .then(r => {
          const found = (r.data?.data ?? []).find((j: any) => j.id === preId);
          if (found) { setSelectedJur({ id: found.id, name: found.name }); setJurSearch(found.name); }
        }).catch(() => {});
    }
  };

  const searchJurisdictions = async (q: string) => {
    if (!q.trim()) { setJurisdictions([]); return; }
    setJurLoading(true);
    try {
      const res = await api.get('/geography/jurisdictions', { params: { levelId: 3, search: q, size: 30 } });
      const items = res.data?.data ?? [];
      setJurisdictions(items.map((j: any) => ({ id: j.id, name: j.name })));
    } catch {
      setJurisdictions([]);
    } finally {
      setJurLoading(false);
    }
  };

  const handleJurSearchChange = (val: string) => {
    setJurSearch(val);
    setSelectedJur(null);
    if (jurSearchTimer.current) clearTimeout(jurSearchTimer.current);
    jurSearchTimer.current = setTimeout(() => searchJurisdictions(val), 400);
  };

  const confirmShip = async () => {
    if (!selectedJur || !shipModal.orderId) return;
    try {
      const res = await api.post(`/admin/orders/${shipModal.orderId}/ship`, {
        receiverJurisdictionId: selectedJur.id,
        serviceTypeCode,
      });
      const updated = res.data;
      setOrders(orders.map(o => o.id === shipModal.orderId ? { ...o, ...updated } : o));
      if (selectedOrder?.id === shipModal.orderId) setSelectedOrder({ ...selectedOrder, ...updated });
      showNotification(`UzPost ga yuborildi. Tracking: ${updated.trackingNumber || '—'}`, 'success');
      setShipModal({ open: false, orderId: null });
    } catch (error: any) {
      showNotification(error?.response?.data?.message || 'UzPost ga yuborishda xatolik', 'error');
    }
  };

  const cancelShipment = async (id: number) => {
    try {
      const res = await api.post(`/admin/orders/${id}/cancel-shipment`);
      const updated = res.data;
      setOrders(orders.map(o => o.id === id ? { ...o, ...updated } : o));
      if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, ...updated });
      showNotification('UzPost dan bekor qilindi', 'success');
    } catch (error: any) {
      showNotification(error?.response?.data?.message || 'UzPost bekor qilishda xatolik', 'error');
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

              {/* Order management — admin only confirms or cancels */}
              <div className="status-management">
                <h3>Buyurtmani boshqarish</h3>
                <div className="status-actions">
                  <button
                    className="btn-status btn-info"
                    disabled={selectedOrder.status === 'CONFIRMED' || selectedOrder.status === 'SHIPPED'
                      || selectedOrder.status === 'DELIVERED' || selectedOrder.status === 'RECEIVED'}
                    onClick={() => requestConfirm(selectedOrder.id, 'CONFIRMED')}
                  >
                    <FaCheck /> Tasdiqlash
                  </button>
                  <button
                    className="btn-status btn-danger"
                    disabled={selectedOrder.status === 'CANCELLED' || selectedOrder.status === 'RECEIVED'
                      || selectedOrder.status === 'SHIPPED' || selectedOrder.status === 'DELIVERED'}
                    onClick={() => updateStatus(selectedOrder.id, 'CANCELLED')}
                  >
                    <FaBan /> Bekor qilish
                  </button>
                </div>
              </div>

              {/* UzPost — separate section */}
              <div className="status-management" style={{ marginTop: '1rem', borderTop: '1px solid #2d3250', paddingTop: '1rem' }}>
                <h3><FaTruck /> UzPost pochta</h3>
                {selectedOrder.trackingNumber && (
                  <p style={{ fontSize: '13px', color: '#8b92a7', marginBottom: '8px' }}>
                    Tracking: <code>{selectedOrder.trackingNumber}</code>
                    {selectedOrder.shippingStatus && (
                      <span style={{ marginLeft: '8px', color: '#4ade80' }}>({selectedOrder.shippingStatus})</span>
                    )}
                  </p>
                )}
                <div className="status-actions">
                  <button
                    className="btn-status btn-secondary"
                    disabled={!!selectedOrder.trackingNumber
                      || (selectedOrder.status !== 'CONFIRMED' && selectedOrder.status !== 'PREPARING')}
                    onClick={() => openShipModal(selectedOrder.id)}
                    title={selectedOrder.trackingNumber ? 'Allaqachon yuborilgan' : ''}
                  >
                    <FaTruck /> UzPostga yuborish
                  </button>
                  <button
                    className="btn-status btn-danger"
                    disabled={!selectedOrder.trackingNumber}
                    onClick={() => cancelShipment(selectedOrder.id)}
                    title={!selectedOrder.trackingNumber ? 'Hali yuborilmagan' : ''}
                  >
                    <FaBan /> UzPost bekor qilish
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: '#8b92a7', marginTop: '6px' }}>
                  Holat (SHIPPED → DELIVERED) UzPost dan avtomatik yangilanadi (har 30 daqiqada)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {shipModal.open && (
        <div className="modal-overlay" onClick={() => setShipModal({ open: false, orderId: null })}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2><FaTruck /> UzPost ga yuborish</h2>
              <button className="modal-close" onClick={() => setShipModal({ open: false, orderId: null })}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Qabul qiluvchi tumani / shahri *
                </label>
                <div className="search-wrapper" style={{ marginBottom: '6px' }}>
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Tuman yoki shahar nomini kiriting..."
                    value={jurSearch}
                    onChange={e => handleJurSearchChange(e.target.value)}
                    autoFocus
                  />
                </div>
                {jurLoading && <p style={{ color: '#8b92a7', fontSize: '13px' }}>Qidirilmoqda...</p>}
                {!jurLoading && jurisdictions.length > 0 && (
                  <div style={{ border: '1px solid #2d3250', borderRadius: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    {jurisdictions.map(j => (
                      <div
                        key={j.id}
                        onClick={() => { setSelectedJur(j); setJurSearch(j.name); setJurisdictions([]); }}
                        style={{
                          padding: '8px 12px', cursor: 'pointer', fontSize: '14px',
                          background: selectedJur?.id === j.id ? '#2d3250' : 'transparent',
                        }}
                      >
                        {j.name} <span style={{ color: '#8b92a7', fontSize: '12px' }}>#{j.id}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!jurLoading && jurSearch.length > 1 && jurisdictions.length === 0 && !selectedJur && (
                  <p style={{ color: '#8b92a7', fontSize: '13px' }}>Natija topilmadi</p>
                )}
                {selectedJur && (
                  <p style={{ color: '#4ade80', fontSize: '13px', marginTop: '4px' }}>
                    ✓ Tanlandi: {selectedJur.name} (ID: {selectedJur.id})
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Xizmat turi</label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={serviceTypeCode}
                  onChange={e => setServiceTypeCode(e.target.value)}
                >
                  <option value="PARCEL">PARCEL — Pochta jo'natmasi</option>
                  <option value="LETTER">LETTER — Xat</option>
                  <option value="BANDEROL">BANDEROL — Banderol</option>
                  <option value="EMS">EMS — Tezkor pochta</option>
                </select>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', padding: '1rem' }}>
              <button className="btn-status btn-danger" onClick={() => setShipModal({ open: false, orderId: null })}>
                <FaTimes /> Bekor qilish
              </button>
              <button className="btn-status btn-secondary" disabled={!selectedJur} onClick={confirmShip}>
                <FaTruck /> Yuborish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
