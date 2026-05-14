import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getFileUrl } from '../utils';

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await api.get(`/products/${id}`);
                setProduct(response.data);
            } catch (error) {
                console.error('Error fetching product:', error);
                navigate('/products');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, navigate]);

    if (loading) return <div className="loading">Yuklanmoqda...</div>;
    if (!product) return <div className="error">Mahsulot topilmadi</div>;

    const handleAction = () => {
        if (!isAuthenticated) {
            navigate(`/login?redirect=/products/${id}`);
        } else {
            addToCart(product, quantity);
        }
    };

    return (
        <div className="product-detail-container">
            <div className="container">
                <nav className="breadcrumb" data-aos="fade-right">
                    <Link to="/">Bosh sahifa</Link> <i className="fas fa-chevron-right" style={{ fontSize: '10px', margin: '0 8px' }}></i>
                    <Link to="/products">Mahsulotlar</Link> <i className="fas fa-chevron-right" style={{ fontSize: '10px', margin: '0 8px' }}></i>
                    {product.title}
                </nav>

                <div className="product-detail-grid">
                    <div className="product-detail-image" data-aos="zoom-in" data-aos-duration="1000">
                        <img src={getFileUrl(product.imageUrl)} alt={product.title} />
                    </div>

                    <div className="product-detail-content" data-aos="fade-left" data-aos-delay="200">
                        <h1>{product.title}</h1>

                        <div className="price-section">
                            <span className="price">{product.price?.toLocaleString() || '0'} so'm</span>
                            {product.oldPrice && (
                                <span className="old-price">{product.oldPrice?.toLocaleString()} so'm</span>
                            )}
                        </div>

                        <div className="section-divider"></div>

                        <div className="product-info-block">
                            <h4><i className="fas fa-align-left"></i> Tavsif</h4>
                            <p className="description">{product.description}</p>
                        </div>

                        {product.features && Array.isArray(product.features) && product.features.length > 0 && (
                            <div className="features-list" data-aos="fade-up" data-aos-delay="400">
                                <h4><i className="fas fa-star"></i> Xususiyatlari:</h4>
                                <ul>
                                    {product.features.map((feature, idx) => (
                                        <li key={idx}>{feature}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="purchase-section" data-aos="fade-up" data-aos-delay="500">
                            <div className="purchase-options">
                                <div className="quantity-selector">
                                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                                        <i className="fas fa-minus"></i>
                                    </button>
                                    <span>{quantity}</span>
                                    <button onClick={() => setQuantity(q => q + 1)}>
                                        <i className="fas fa-plus"></i>
                                    </button>
                                </div>
                                <button onClick={handleAction} className="btn-primary btn-large btn-full">
                                    <i className="fas fa-shopping-cart"></i> Sotib olish
                                </button>
                            </div>

                            <div className="delivery-info">
                                <span><i className="fas fa-truck"></i> O'zbekiston bo'ylab yetkazib berish</span>
                                <span><i className="fas fa-shield-alt"></i> 1 yillik rasmiy kafolat</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
