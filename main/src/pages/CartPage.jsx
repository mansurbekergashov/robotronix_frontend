import { useEffect, useRef, useState, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { getFileUrl } from '../utils';

const POLL_INTERVAL_MS  = 3000;
const POLL_TIMEOUT_MS   = 900000; // 15 daqiqa

const CartPage = () => {
    const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [isOrdering, setIsOrdering]     = useState(false);
    const [orderData, setOrderData]        = useState({ detailAddress: '', contactPhone: '' });
    const [paymentState, setPaymentState]  = useState(null); // null | 'waiting' | 'confirmed' | 'timeout'
    const [pendingOrderId, setPendingOrderId] = useState(null);
    const pollingRef = useRef(null);
    const pollTimeoutRef = useRef(null);

    // Jurisdiction (UzPost) state
    const [jurSearch, setJurSearch]                 = useState('');
    const [jurResults, setJurResults]               = useState([]);
    const [jurLoading, setJurLoading]               = useState(false);
    const [selectedJur, setSelectedJur]             = useState(null); // { id, name }
    const [postalIndex, setPostalIndex]             = useState('');
    const jurTimer = useRef(null);

    const stopPolling = () => {
        if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
        if (pollTimeoutRef.current) { clearTimeout(pollTimeoutRef.current); pollTimeoutRef.current = null; }
    };

    useEffect(() => () => stopPolling(), []);

    const startPolling = (orderId) => {
        stopPolling();
        pollingRef.current = setInterval(async () => {
            try {
                const res = await api.get('/orders/my');
                const order = (res.data || []).find(o => o.id === orderId);
                if (!order) return;
                if (order.paymentConfirmed) {
                    stopPolling();
                    setPaymentState('confirmed');
                    clearCart();
                }
            } catch (_) { /* tarmoq xatolarini e'tiborsiz qoldirish */ }
        }, POLL_INTERVAL_MS);

        pollTimeoutRef.current = setTimeout(() => {
            stopPolling();
            setPaymentState(prev => prev === 'waiting' ? 'timeout' : prev);
        }, POLL_TIMEOUT_MS);
    };

    const searchJur = useCallback(async (q) => {
        if (!q || q.length < 2) { setJurResults([]); return; }
        setJurLoading(true);
        try {
            const res = await api.get('/geography/jurisdictions', { params: { levelId: 3, search: q, size: 20 } });
            setJurResults(res.data?.data ?? []);
        } catch { setJurResults([]); }
        finally { setJurLoading(false); }
    }, []);

    const handleJurInput = (val) => {
        setJurSearch(val);
        setSelectedJur(null);
        setPostalIndex('');
        if (jurTimer.current) clearTimeout(jurTimer.current);
        jurTimer.current = setTimeout(() => searchJur(val), 350);
    };

    const selectJurisdiction = async (jur, hierarchyPath = '') => {
        setSelectedJur({ id: jur.id, name: jur.name });
        setJurSearch(jur.name);
        setJurResults([]);
        // Auto-detect postal index
        try {
            const res = await api.get('/geography/postal-index', {
                params: { jurisdictionName: jur.name, hierarchyPath }
            });
            if (res.data?.found) setPostalIndex(res.data.postalIndex);
        } catch { /* silent */ }
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate('/login?redirect=/cart');
            return;
        }

        if (!selectedJur) { alert("Shahar yoki tumaningizni tanlang"); return; }

        const detailAddress   = orderData.detailAddress.trim();
        const contactPhone    = orderData.contactPhone.trim();
        const shippingAddress = `${selectedJur.name}, ${detailAddress}`;

        if (!detailAddress)   { alert("Ko'cha va uy raqamini kiriting"); return; }
        if (!contactPhone)    { alert("Telefon raqamini kiriting");      return; }

        setIsOrdering(true);
        try {
            const items = cartItems.map(item => ({
                productId: item.product.id,
                quantity:  item.quantity
            }));

            const res = await api.post('/orders', {
                items, shippingAddress, contactPhone,
                receiverJurisdictionId: selectedJur.id,
                postalIndex: postalIndex || undefined,
            });
            const { id: orderId, paymentUrl } = res.data;

            setPendingOrderId(orderId);
            setPaymentState('waiting');
            window.open(paymentUrl, '_blank');
            startPolling(orderId);
        } catch (error) {
            alert('Buyurtma berishda xatolik: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsOrdering(false);
        }
    };

    // ─── To'lov kutilmoqda holati ─────────────────────────────────────────────

    if (paymentState === 'waiting') {
        return (
            <div className="cart-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>💳</div>
                <h2>Payme to'lov oynasi ochildi</h2>
                <p style={{ color: '#6b7280', marginBottom: '12px' }}>
                    Yangi tabda Payme sahifasini ko'ring va to'lovni amalga oshiring.
                </p>
                <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                    To'lov tasdiqlangandan so'ng bu sahifa avtomatik yangilanadi...
                </p>
                <div className="spinner" style={{
                    width: '40px', height: '40px',
                    border: '4px solid #e5e7eb',
                    borderTopColor: '#33cccc',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 24px'
                }} />
                <button
                    className="btn-secondary"
                    onClick={() => {
                        const url = pendingOrderId
                            ? `/orders/${pendingOrderId}/payment-url` : null;
                        if (url) api.get(url).then(r => window.open(r.data.paymentUrl, '_blank')).catch(() => {});
                    }}
                    style={{ marginRight: '12px' }}
                >
                    Payme sahifasini qayta ochish
                </button>
                <button
                    className="btn-cancel"
                    onClick={() => { stopPolling(); setPaymentState(null); }}
                    style={{ background: '#374151', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                    Bekor qilish
                </button>
            </div>
        );
    }

    if (paymentState === 'confirmed') {
        return (
            <div className="cart-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '4rem', color: '#10b981', marginBottom: '20px' }}>✅</div>
                <h2>To'lov muvaffaqiyatli amalga oshirildi!</h2>
                <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                    Buyurtmangiz tasdiqlandi. Tez orada yetkazib beriladi.
                </p>
                <button className="btn-primary" onClick={() => navigate('/')}>
                    Bosh sahifaga qaytish
                </button>
            </div>
        );
    }

    if (paymentState === 'timeout') {
        return (
            <div className="cart-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏰</div>
                <h2>To'lov vaqti tugadi</h2>
                <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                    15 daqiqa ichida to'lov tasdiqlanmadi. Qaytadan urinib ko'ring.
                </p>
                <button
                    className="btn-primary"
                    onClick={() => {
                        setPaymentState(null);
                        setPendingOrderId(null);
                    }}
                >
                    Qaytadan buyurtma berish
                </button>
            </div>
        );
    }

    // ─── Bo'sh savat ──────────────────────────────────────────────────────────

    if (!cartItems.length) {
        return (
            <div className="cart-empty">
                <h2>Savatingiz bo'sh</h2>
                <p>Xaridni boshlash uchun mahsulotlar bo'limiga o'ting.</p>
                <Link to="/products" className="btn-primary">Mahsulotlarni ko'rish</Link>
            </div>
        );
    }

    // ─── Asosiy savat va checkout ─────────────────────────────────────────────

    return (
        <div className="cart-container">
            <h1>Savat</h1>
            <div className="cart-grid">
                <div className="cart-items">
                    {cartItems.map((item) => (
                        <div key={item.product.id} className="cart-item">
                            <img src={getFileUrl(item.product.imageUrl)} alt={item.product.title} />
                            <div className="item-info">
                                <h3>{item.product.title}</h3>
                                <p>{item.product.price?.toLocaleString() || '0'} so'm</p>
                            </div>
                            <div className="item-quantity">
                                <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                                <span>{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                            </div>
                            <div className="item-total">
                                {((item.product.price || 0) * item.quantity).toLocaleString()} so'm
                            </div>
                            <button onClick={() => removeFromCart(item.product.id)} className="btn-remove">×</button>
                        </div>
                    ))}
                </div>

                <div className="cart-summary">
                    <h3>Buyurtma tafsilotlari</h3>
                    <div className="summary-row">
                        <span>Jami:</span>
                        <span>{getCartTotal()?.toLocaleString() || '0'} so'm</span>
                    </div>

                    <form onSubmit={handlePlaceOrder} className="checkout-form">
                        {/* Jurisdiction search */}
                        <div className="form-group" style={{ position: 'relative' }}>
                            <label>Shahar / tuman (UzPost):</label>
                            <input
                                type="text"
                                value={jurSearch}
                                onChange={(e) => handleJurInput(e.target.value)}
                                placeholder="Tuman yoki shaharni qidiring..."
                                autoComplete="off"
                                style={{ width: '100%' }}
                            />
                            {jurLoading && (
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Qidirilmoqda...</div>
                            )}
                            {jurResults.length > 0 && !selectedJur && (
                                <div style={{
                                    position: 'absolute', zIndex: 999, background: '#1e2235',
                                    border: '1px solid #374151', borderRadius: '8px',
                                    width: '100%', maxHeight: '180px', overflowY: 'auto', top: '100%', left: 0,
                                }}>
                                    {jurResults.map(j => {
                                        const path = Array.isArray(j.hierarchy) && j.hierarchy.length
                                            ? j.hierarchy.map(h => h.name).join(' > ') : '';
                                        return (
                                            <div
                                                key={j.id}
                                                onClick={() => selectJurisdiction(j, path)}
                                                style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #2d3250' }}
                                            >
                                                <div style={{ fontSize: '14px' }}>{j.name}</div>
                                                {path && <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{path}</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {selectedJur && (
                                <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
                                    ✓ Tanlandi: {selectedJur.name}
                                    {postalIndex && (
                                        <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                                            (indeks: {postalIndex})
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Detail address */}
                        <div className="form-group">
                            <label>Ko'cha va uy raqami:</label>
                            <input
                                type="text"
                                required
                                value={orderData.detailAddress}
                                onChange={(e) => setOrderData({ ...orderData, detailAddress: e.target.value })}
                                placeholder="Ko'cha nomi, uy/kvartira raqami"
                            />
                        </div>

                        <div className="form-group">
                            <label>Telefon raqami:</label>
                            <input
                                type="tel"
                                required
                                value={orderData.contactPhone}
                                onChange={(e) => setOrderData({ ...orderData, contactPhone: e.target.value })}
                                placeholder="+998 90 123 45 67"
                            />
                        </div>

                        <div className="payment-info-box" style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>💳</span>
                            <div>
                                <div style={{ fontWeight: 600, color: '#166534' }}>Payme orqali to'lov</div>
                                <div style={{ fontSize: '13px', color: '#15803d' }}>
                                    Buyurtma bergandan so'ng Payme to'lov sahifasi avtomatik ochiladi
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary btn-full"
                            disabled={isOrdering || !isAuthenticated}
                        >
                            {isOrdering
                                ? 'Buyurtma yaratilmoqda...'
                                : isAuthenticated
                                    ? '🛒 Buyurtma berish va Payme orqali to\'lash'
                                    : 'To\'lash uchun tizimga kiring'}
                        </button>
                        {!isAuthenticated && (
                            <Link to="/login?redirect=/cart" className="btn-secondary btn-full"
                                  style={{ display: 'block', textAlign: 'center', marginTop: '8px' }}>
                                Kirish
                            </Link>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
