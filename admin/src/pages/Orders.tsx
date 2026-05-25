import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaEye, FaTimes, FaCheck, FaBoxOpen, FaTruck, FaBan, FaSearch, FaComments, FaTrash, FaTag, FaPrint } from 'react-icons/fa';
import api from '../services/api';
import { syncService } from '../services/SyncService';
import { useConfirm } from '../hooks/useConfirm';
import './Orders.css';

interface OrderData {
  id: number;
  user?: { id: number; fullName: string; phone: string; email: string };
  items?: { product?: { title: string; weightGrams?: number }; quantity: number; price: number }[];
  totalAmount: number;
  paymentConfirmed?: boolean;
  status: string;
  shippingAddress: string;
  contactPhone: string;
  createdAt: string;
  trackingNumber?: string;
  shippingStatus?: string;
  receiverJurisdictionId?: number;
  postalIndex?: string;
}

interface TrackingHistoryItem {
  createdAt: string;
  statusName: string;
  officeName?: string;
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

  // Checkbox selection for batch label printing
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // UzPost ship modal state
  const [shipModal, setShipModal] = useState<{ open: boolean; orderId: number | null }>({ open: false, orderId: null });
  const [jurSearch, setJurSearch] = useState('');
  const [jurisdictions, setJurisdictions] = useState<{ id: number; name: string }[]>([]);
  const [jurLoading, setJurLoading] = useState(false);
  const [selectedJur, setSelectedJur] = useState<{ id: number; name: string } | null>(null);
  const [serviceTypeCode, setServiceTypeCode] = useState('PARCEL');
  const [serviceTypes, setServiceTypes] = useState<{ id: number; code: string; name: string }[]>([]);
  const [paymentType, setPaymentType] = useState('CREDIT_BALANCE');
  const [postalIndex, setPostalIndex] = useState('');
  const jurSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Edit mode for order delivery details inside ship modal
  const [shipEditMode, setShipEditMode] = useState(false);
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [shipEditSaving, setShipEditSaving] = useState(false);

  // UzPost tracking history
  const [trackingHistory, setTrackingHistory] = useState<TrackingHistoryItem[] | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchOrders = useCallback(async () => {
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
  }, [filterStatus, searchTerm]);

  // Refetch when filters change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fetchTracking = useCallback(async (orderId: number) => {
    setTrackingLoading(true);
    setTrackingHistory(null);
    try {
      const res = await api.get(`/admin/orders/${orderId}/tracking`);
      const histories: TrackingHistoryItem[] = res.data?.data?.histories ?? [];
      setTrackingHistory(histories);
    } catch {
      setTrackingHistory([]);
    } finally {
      setTrackingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedOrder?.trackingNumber) {
      fetchTracking(selectedOrder.id);
    } else {
      setTrackingHistory(null);
    }
  }, [selectedOrder?.id, selectedOrder?.trackingNumber, fetchTracking]);

  // Real-time sync — subscribe once on mount, use ref to always call latest fetchOrders
  const fetchOrdersRef = useRef(fetchOrders);
  useEffect(() => {
    fetchOrdersRef.current = fetchOrders;
  });

  useEffect(() => {
    const unsub = syncService.subscribe('ORDER', () => {
      fetchOrdersRef.current();
    });
    return unsub;
  }, []);

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
    setPaymentType('CREDIT_BALANCE');
    setPostalIndex(order?.postalIndex || '');
    setShipEditMode(false);
    setEditAddress(order?.shippingAddress || '');
    setEditPhone(order?.contactPhone || '');
    setShipModal({ open: true, orderId: id });

    // Load service types from UzPost
    api.get('/geography/service-types')
      .then((r: any) => {
        const list: any[] = r.data?.data?.list ?? [];
        if (list.length > 0) {
          setServiceTypes(list.map((t: any) => ({ id: t.id, code: t.code, name: t.name || t.nameRu || t.code })));
        } else {
          setServiceTypes([]);
        }
      })
      .catch(() => setServiceTypes([]));
    // Pre-fill if order already has a jurisdiction from user checkout
    if (order?.receiverJurisdictionId) {
      const preId = order.receiverJurisdictionId;
      api.get('/geography/jurisdictions', { params: { levelId: 3, size: 1, search: String(preId) } })
        .then(r => {
          const found = (r.data?.data ?? []).find((j: any) => j.id === preId);
          if (found) {
            setSelectedJur({ id: found.id, name: found.name });
            setJurSearch(found.name);
            // Only auto-lookup postal index if not already stored on order
            if (!order?.postalIndex) {
              fetchPostalIndex(found.name, '');
            }
          }
        }).catch(() => {});
    }
  };

  const fetchPostalIndex = async (name: string, hierarchyPath: string) => {
    try {
      const res = await api.get('/geography/postal-index', {
        params: { jurisdictionName: name, hierarchyPath }
      });
      if (res.data?.found) {
        setPostalIndex(res.data.postalIndex);
      }
    } catch {
      // silent — postal index is optional
    }
  };

  const searchJurisdictions = async (q: string) => {
    if (!q.trim()) { setJurisdictions([]); return; }
    setJurLoading(true);
    try {
      const res = await api.get('/geography/jurisdictions', { params: { levelId: 3, search: q, size: 30 } });
      const items = res.data?.data ?? [];
      setJurisdictions(items);
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

  const saveOrderDetails = async () => {
    if (!shipModal.orderId) return;
    setShipEditSaving(true);
    try {
      const res = await api.patch(`/admin/orders/${shipModal.orderId}`, {
        shippingAddress: editAddress.trim(),
        contactPhone: editPhone.trim(),
        receiverJurisdictionId: selectedJur?.id ?? null,
        postalIndex: postalIndex.trim() || null,
      });
      const updated = res.data;
      setOrders(orders.map(o => o.id === shipModal.orderId ? { ...o, ...updated } : o));
      if (selectedOrder?.id === shipModal.orderId) setSelectedOrder({ ...selectedOrder, ...updated });
      setShipEditMode(false);
      showNotification("Ma'lumotlar saqlandi", 'success');
    } catch {
      showNotification("Saqlashda xatolik yuz berdi", 'error');
    } finally {
      setShipEditSaving(false);
    }
  };

  const confirmShip = async () => {
    if (!selectedJur || !shipModal.orderId) return;
    try {
      const res = await api.post(`/admin/orders/${shipModal.orderId}/ship`, {
        receiverJurisdictionId: selectedJur.id,
        serviceTypeCode,
        paymentType,
        postalIndex: postalIndex.trim() || undefined,
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

  const printLabel = async (id: number) => {
    try {
      showNotification('Yorliq yuklanmoqda...', 'info');
      const res = await api.get(`/admin/orders/${id}/label`);
      const labelData: string | undefined = res.data?.data;
      if (!labelData) { showNotification('Yorliq topilmadi. UzPost ID mavjud emas.', 'error'); return; }
      openLabelData(labelData);
    } catch {
      showNotification('Yorliqni yuklashda xatolik yuz berdi', 'error');
    }
  };

  const openLabelData = (labelData: string) => {
    if (labelData.startsWith('http')) {
      window.open(labelData, '_blank');
    } else {
      const binary = atob(labelData);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  };

  const printBatchLabels = async () => {
    const shippedIds = orders
      .filter(o => selectedIds.has(o.id) && o.trackingNumber)
      .map(o => o.id);
    if (shippedIds.length === 0) {
      showNotification("Tanlangan buyurtmalarda jo'natilgan buyurtma yo'q", 'error');
      return;
    }
    try {
      showNotification(`${shippedIds.length} ta buyurtma yorlig'i yuklanmoqda...`, 'info');
      const res = await api.post('/admin/orders/labels', shippedIds);
      const labelData: string | undefined = res.data?.data;
      if (!labelData) {
        showNotification('Yorliq topilmadi', 'error');
        return;
      }
      openLabelData(labelData);
    } catch {
      showNotification('Yorliqlarni yuklashda xatolik yuz berdi', 'error');
    }
  };

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const shippedOrders = orders.filter(o => o.trackingNumber);
  const allShippedSelected = shippedOrders.length > 0 && shippedOrders.every(o => selectedIds.has(o.id));
  const someSelected = selectedIds.size > 0;
  const selectedShippedCount = orders.filter(o => selectedIds.has(o.id) && o.trackingNumber).length;

  const toggleSelectAll = () => {
    if (allShippedSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(shippedOrders.map(o => o.id)));
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; class: string; icon: React.ReactElement }> = {
      PENDING: { label: 'Kutilmoqda', class: 'badge-warning', icon: <FaBoxOpen /> },
      PAYMENT_WAITING: { label: "To'lov kutilmoqda", class: 'badge-info', icon: <FaBoxOpen /> },
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
          <button
            className="btn-status"
            style={{
              background: someSelected && selectedShippedCount > 0
                ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${someSelected && selectedShippedCount > 0 ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)'}`,
              color: someSelected && selectedShippedCount > 0 ? '#c4b5fd' : '#8b92a7',
              cursor: selectedShippedCount > 0 ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              transition: 'all 0.2s',
            }}
            disabled={selectedShippedCount === 0}
            onClick={printBatchLabels}
            title={selectedShippedCount === 0 ? "Jo'natilgan buyurtmalarni tanlang" : `${selectedShippedCount} ta yorliq chop etish`}
          >
            <FaPrint />
            Manzil yorlig'i
            {selectedShippedCount > 0 && (
              <span style={{ background: '#7c3aed', color: 'white', borderRadius: '12px', padding: '1px 8px', fontSize: '12px' }}>
                {selectedShippedCount}
              </span>
            )}
          </button>
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
                <option value="PAYMENT_WAITING">To'lov kutilmoqda</option>
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
              <th style={{ width: '40px', padding: '12px 8px' }}>
                <input
                  type="checkbox"
                  checked={allShippedSelected}
                  ref={el => { if (el) el.indeterminate = !allShippedSelected && shippedOrders.some(o => selectedIds.has(o.id)); }}
                  onChange={toggleSelectAll}
                  title="Barcha jo'natilganlarni tanlash"
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
              </th>
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
              const isSelected = selectedIds.has(order.id);
              const canSelect = !!order.trackingNumber;

              return (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="clickable-row"
                  style={isSelected ? { background: 'rgba(139,92,246,0.08)' } : undefined}
                >
                  <td style={{ padding: '12px 8px' }} onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!canSelect}
                      onChange={e => { e.stopPropagation(); toggleSelect(order.id, e as any); }}
                      onClick={e => e.stopPropagation()}
                      title={canSelect ? 'Yorliq uchun tanlash' : "Bu buyurtma hali jo'natilmagan"}
                      style={{ cursor: canSelect ? 'pointer' : 'not-allowed', width: '16px', height: '16px', opacity: canSelect ? 1 : 0.35 }}
                    />
                  </td>
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
                        onClick={(e) => { e.stopPropagation(); handleStartChat(order); }}
                        title="Habar yuborish"
                      >
                        <FaComments />
                      </button>
                      <button
                        className="btn-icon btn-view"
                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                        title="Batafsil"
                      >
                        <FaEye />
                      </button>
                      {order.trackingNumber && (
                        <button
                          className="btn-icon"
                          style={{ color: '#c4b5fd' }}
                          onClick={(e) => { e.stopPropagation(); printLabel(order.id); }}
                          title="Manzil yorlig'ini chop etish"
                        >
                          <FaTag />
                        </button>
                      )}
                      <button
                        className="btn-icon btn-delete"
                        onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }}
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
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Buyurtmalar hali yo'q</td></tr>
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
                  <p><strong>Manzil:</strong> {selectedOrder.shippingAddress || 'Ko\'rsatilmagan'}{selectedOrder.postalIndex ? <span style={{ marginLeft: 8, color: '#4ade80', fontSize: '12px' }}>📮 {selectedOrder.postalIndex}</span> : null}</p>
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
                    className="btn-status"
                    style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd' }}
                    disabled={!selectedOrder.trackingNumber}
                    onClick={() => printLabel(selectedOrder.id)}
                    title={!selectedOrder.trackingNumber ? 'Buyurtma hali yuborilmagan' : 'Manzil yorlig\'ini chop etish'}
                  >
                    <FaTag /> Manzil yorlig'i
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

              {/* UzPost tracking history timeline */}
              {selectedOrder.trackingNumber && (
                <div className="status-management" style={{ marginTop: '1rem', borderTop: '1px solid #2d3250', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0 }}>Kuzatuv tarixi (UzPost)</h3>
                    <button
                      className="btn-icon"
                      onClick={() => fetchTracking(selectedOrder.id)}
                      title="Yangilash"
                      style={{ color: '#8b92a7', fontSize: '13px', padding: '4px 10px' }}
                    >
                      ↻ Yangilash
                    </button>
                  </div>
                  {trackingLoading ? (
                    <p style={{ color: '#8b92a7', fontSize: '13px' }}>Yuklanmoqda...</p>
                  ) : !trackingHistory || trackingHistory.length === 0 ? (
                    <p style={{ color: '#8b92a7', fontSize: '13px' }}>Tarix mavjud emas</p>
                  ) : (
                    <div style={{ position: 'relative', paddingLeft: '20px' }}>
                      <div style={{ position: 'absolute', left: '7px', top: '6px', bottom: '6px', width: '2px', background: 'rgba(99,102,241,0.3)' }} />
                      {trackingHistory.map((item, idx) => (
                        <div key={idx} style={{ position: 'relative', marginBottom: '14px', paddingLeft: '16px' }}>
                          <div style={{
                            position: 'absolute', left: '-6px', top: '5px',
                            width: '10px', height: '10px', borderRadius: '50%',
                            background: idx === 0 ? '#4ade80' : '#6366f1',
                            border: '2px solid #1e2640',
                          }} />
                          <div style={{ fontSize: '11px', color: '#8b92a7', marginBottom: '2px' }}>
                            {item.createdAt ? new Date(item.createdAt).toLocaleString('uz-UZ') : '—'}
                          </div>
                          <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: idx === 0 ? 600 : 400 }}>
                            {item.statusName || '—'}
                            {item.officeName && <span style={{ color: '#8b92a7', fontWeight: 400 }}> — {item.officeName}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
              {/* Order summary for admin review */}
              {(() => {
                const order = orders.find(o => o.id === shipModal.orderId);
                if (!order) return null;
                const weightG = order.items?.reduce((sum: number, it: any) =>
                  sum + (it.product?.weightGrams ?? 500) * (it.quantity ?? 1), 0) ?? 0;
                return (
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '14px', marginBottom: '1rem', fontSize: '13px', lineHeight: '1.7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <strong style={{ fontSize: '14px' }}>Buyurtma ma'lumotlari</strong>
                      {!shipEditMode ? (
                        <button
                          onClick={() => setShipEditMode(true)}
                          style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', color: '#93c5fd', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          ✏️ Tahrirlash
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={saveOrderDetails}
                            disabled={shipEditSaving}
                            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#4ade80', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            {shipEditSaving ? '...' : '✓ Saqlash'}
                          </button>
                          <button
                            onClick={() => { setShipEditMode(false); setEditAddress(order.shippingAddress || ''); setEditPhone(order.contactPhone || ''); }}
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Bekor
                          </button>
                        </div>
                      )}
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ color: '#8b92a7', paddingRight: '12px', whiteSpace: 'nowrap' }}>Mijoz ismi:</td>
                          <td><strong>{order.user?.fullName || '—'}</strong></td>
                        </tr>
                        <tr>
                          <td style={{ color: '#8b92a7', paddingRight: '12px' }}>Email:</td>
                          <td>{order.user?.email || '—'}</td>
                        </tr>
                        <tr>
                          <td style={{ color: '#8b92a7', paddingRight: '12px', paddingTop: '4px' }}>Telefon:</td>
                          <td style={{ paddingTop: '4px' }}>
                            {shipEditMode ? (
                              <input
                                value={editPhone}
                                onChange={e => setEditPhone(e.target.value)}
                                style={{ background: '#1e2640', border: '1px solid #4ade80', color: 'white', borderRadius: '4px', padding: '3px 8px', fontSize: '13px', width: '180px' }}
                                placeholder="+998xxxxxxxxx"
                              />
                            ) : (order.contactPhone || order.user?.phone || '—')}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ color: '#8b92a7', paddingRight: '12px', paddingTop: '4px', verticalAlign: 'top' }}>Manzil:</td>
                          <td style={{ paddingTop: '4px' }}>
                            {shipEditMode ? (
                              <textarea
                                value={editAddress}
                                onChange={e => setEditAddress(e.target.value)}
                                rows={2}
                                style={{ background: '#1e2640', border: '1px solid #4ade80', color: 'white', borderRadius: '4px', padding: '3px 8px', fontSize: '13px', width: '100%', resize: 'vertical' }}
                                placeholder="To'liq manzil..."
                              />
                            ) : (order.shippingAddress || '—')}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ color: '#8b92a7', paddingRight: '12px', paddingTop: '4px' }}>To'lov holati:</td>
                          <td style={{ paddingTop: '4px' }}>
                            {order.paymentConfirmed
                              ? <span style={{ color: '#4ade80' }}>✓ Payme orqali to'langan</span>
                              : <span style={{ color: '#f59e0b' }}>⏳ To'lov kutilmoqda</span>}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ color: '#8b92a7', paddingRight: '12px', paddingTop: '4px' }}>Jami summa:</td>
                          <td style={{ paddingTop: '4px' }}><strong>{(order.totalAmount || 0).toLocaleString()} so'm</strong></td>
                        </tr>
                        <tr>
                          <td style={{ color: '#8b92a7', paddingRight: '12px', paddingTop: '4px' }}>Og'irlik (taxm.):</td>
                          <td style={{ paddingTop: '4px' }}>{weightG >= 1000 ? `${(weightG/1000).toFixed(2)} kg` : `${weightG} g`}</td>
                        </tr>
                        <tr>
                          <td style={{ color: '#8b92a7', paddingRight: '12px', paddingTop: '4px' }}>Tuman/Shahar:</td>
                          <td style={{ paddingTop: '4px' }}>
                            {shipEditMode ? (
                              <div>
                                <div className="search-wrapper" style={{ marginBottom: '4px' }}>
                                  <FaSearch className="search-icon" />
                                  <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Tuman yoki shahar..."
                                    value={jurSearch}
                                    onChange={e => handleJurSearchChange(e.target.value)}
                                  />
                                </div>
                                {jurLoading && <span style={{ color: '#8b92a7', fontSize: '12px' }}>Qidirilmoqda...</span>}
                                {!jurLoading && jurisdictions.length > 0 && (
                                  <div style={{ border: '1px solid #2d3250', borderRadius: '6px', maxHeight: '140px', overflowY: 'auto', marginBottom: '4px' }}>
                                    {jurisdictions.map((j: any) => {
                                      const path = Array.isArray(j.hierarchy) && j.hierarchy.length
                                        ? j.hierarchy.map((h: any) => h.name).join(' > ') : '';
                                      return (
                                        <div key={j.id} onClick={() => { setSelectedJur({ id: j.id, name: j.name }); setJurSearch(j.name); setJurisdictions([]); fetchPostalIndex(j.name, path); }}
                                          style={{ padding: '6px 10px', cursor: 'pointer', background: selectedJur?.id === j.id ? '#2d3250' : 'transparent' }}>
                                          <div style={{ fontSize: '13px' }}>{j.name}</div>
                                          {path && <div style={{ fontSize: '11px', color: '#8b92a7' }}>{path}</div>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                {!jurLoading && jurSearch.length > 1 && jurisdictions.length === 0 && !selectedJur && (
                                  <span style={{ color: '#8b92a7', fontSize: '12px' }}>Natija topilmadi</span>
                                )}
                                {selectedJur && <span style={{ color: '#4ade80', fontSize: '12px' }}>✓ {selectedJur.name}</span>}
                              </div>
                            ) : (
                              selectedJur ? <span style={{ color: '#4ade80' }}>✓ {selectedJur.name}</span> : <span style={{ color: '#8b92a7' }}>—</span>
                            )}
                          </td>
                        </tr>
                        {(postalIndex || order.postalIndex) && (
                          <tr>
                            <td style={{ color: '#8b92a7', paddingRight: '12px', paddingTop: '4px' }}>Pochta indeksi:</td>
                            <td style={{ paddingTop: '4px' }}><code style={{ color: '#4ade80' }}>{postalIndex || order.postalIndex}</code></td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {order.items && order.items.length > 0 && (
                      <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                        <div style={{ color: '#8b92a7', marginBottom: '6px' }}>Mahsulotlar:</div>
                        {order.items.map((it: any, i: number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#e2e8f0', marginBottom: '3px' }}>
                            <span>{it.productName || it.product?.title || 'Mahsulot'}</span>
                            <span style={{ color: '#8b92a7' }}>{it.quantity} x {(it.price || 0).toLocaleString()} so'm</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Jo'natma turi (UzPost)</label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={serviceTypeCode}
                  onChange={e => setServiceTypeCode(e.target.value)}
                >
                  {serviceTypes.length > 0
                    ? serviceTypes.map(t => (
                        <option key={t.code} value={t.code}>{t.code} — {t.name}</option>
                      ))
                    : (
                        <>
                          <option value="PARCEL">PARCEL — Pochta jo'natmasi</option>
                          <option value="LETTER">LETTER — Xat</option>
                          <option value="BANDEROL">BANDEROL — Banderol</option>
                          <option value="EMS">EMS — Tezkor pochta</option>
                        </>
                      )
                  }
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>To'lov turi</label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={paymentType}
                  onChange={e => setPaymentType(e.target.value)}
                >
                  <option value="CREDIT_BALANCE">Naqd pulsiz (hisobdan)</option>
                  <option value="CASH">Naqd pul</option>
                  <option value="CASH_ON_DELIVERY">Yetkazilganda to'lov</option>
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
