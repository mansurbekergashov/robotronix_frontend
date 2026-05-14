import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { getFileUrl } from '../utils';

const CartPage = () => {
    const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isOrdering, setIsOrdering] = useState(false);
    const [orderData, setOrderData] = useState({
        shippingAddress: '',
        contactPhone: ''
    });
    const [paymentCards, setPaymentCards] = useState([]);
    const [receiptFile, setReceiptFile] = useState(null);

    const paymentCardIds = [...new Set(cartItems.map(item => item.product?.paymentCardId).filter(Boolean))];
    const paymentCardIssue = paymentCardIds.length === 0
        ? "To'lov kartasi tanlanmagan. Iltimos, admin bilan bog'laning."
        : paymentCardIds.length > 1
            ? "Savatda bir nechta to'lov kartasi mavjud. Har bir kartaga alohida buyurtma bering."
            : null;
    const paymentCardId = paymentCardIds[0];
    const paymentCard = paymentCards.find(card => String(card.id) === String(paymentCardId));

    useEffect(() => {
        const fetchCards = async () => {
            if (!isAuthenticated) return;
            try {
                const response = await api.get('/payment-cards');
                setPaymentCards(response.data || []);
            } catch (error) {
                console.error('Error fetching payment cards:', error);
            }
        };
        fetchCards();
    }, [isAuthenticated]);

    if (cartItems.length === 0 || !Array.isArray(cartItems)) {
        return (
            <div className="cart-empty">
                <h2>Savatingiz bo'sh</h2>
                <p>Xaridni boshlash uchun mahsulotlar bo'limiga o'ting.</p>
                <Link to="/products" className="btn-primary">Mahsulotlarni ko'rish</Link>
            </div>
        );
    }

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate('/login?redirect=/cart');
            return;
        }

        try {
            setIsOrdering(true);
            const items = cartItems.map(item => ({
                productId: item.product.id,
                quantity: item.quantity
            }));

            if (paymentCardIssue) {
                alert(paymentCardIssue);
                return;
            }

            if (!receiptFile) {
                alert("Iltimos, to'lov chekini yuklang");
                return;
            }

            const payload = new FormData();
            payload.append('order', new Blob([JSON.stringify({
                items,
                ...orderData
            })], { type: 'application/json' }));
            payload.append('receipt', receiptFile);

            await api.post('/orders', payload);

            alert('Buyurtmangiz muvaffaqiyatli qabul qilindi!');
            clearCart();
            navigate('/');
        } catch (error) {
            alert('Buyurtma berishda xatolik yuz berdi: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsOrdering(false);
        }
    };

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
                        <div className="form-group">
                            <label>Yetkazib berish manzili:</label>
                            <input
                                type="text"
                                required
                                value={orderData.shippingAddress}
                                onChange={(e) => setOrderData({ ...orderData, shippingAddress: e.target.value })}
                                placeholder="Shahar, tuman, ko'cha..."
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
                        <div className="form-group">
                            <label>To'lov kartasi:</label>
                            <div className="payment-card-info">
                                {!isAuthenticated ? (
                                    <div className="loading-note">Kartani ko'rish uchun tizimga kiring</div>
                                ) : paymentCardIssue ? (
                                    <div className="warning-text">{paymentCardIssue}</div>
                                ) : paymentCard ? (
                                    <>
                                        <div><strong>{paymentCard.label}</strong></div>
                                        <div>Karta raqami: {paymentCard.cardNumber}</div>
                                        <div>Ega: {paymentCard.cardHolder}</div>
                                        {paymentCard.bankName && <div>Bank: {paymentCard.bankName}</div>}
                                        {paymentCard.phone && <div>Telefon: {paymentCard.phone}</div>}
                                    </>
                                ) : (
                                    <div className="loading-note">Yuklanmoqda...</div>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>To'lov cheki (majburiy):</label>
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf,image/*,application/pdf"
                                required
                                disabled={!!paymentCardIssue}
                                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                            />
                        </div>
                        <button type="submit" className="btn-primary btn-full" disabled={isOrdering}>
                            {isOrdering ? 'Yuborilmoqda...' : 'Buyurtma berish'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
