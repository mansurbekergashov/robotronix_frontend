import { memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getFileUrl } from '../../utils';

const ProductCard = memo(({ product, onAddToCart }) => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleAction = () => {
        if (!isAuthenticated) {
            navigate(`/login?redirect=/products/${product.id}`);
        } else {
            onAddToCart(product);
        }
    };

    return (
        <div className="product-card" data-aos="fade-up">
            <div className="product-image">
                <img src={getFileUrl(product.imageUrl)} alt={product.title} />
                {product.badge && (
                    <div className="product-badge new">
                        {product.badge}
                    </div>
                )}
            </div>
            <div className="product-content">
                <h3 className="product-title">{product.title}</h3>
                <p className="product-description">{product.description}</p>
                {product.features && Array.isArray(product.features) && product.features.length > 0 && (
                    <div className="product-features">
                        {product.features.map((feature, idx) => (
                            <span key={idx} className="feature-tag">{feature}</span>
                        ))}
                    </div>
                )}
                <div className="product-price">
                    <span className="price-main">{product.price ? parseFloat(product.price).toLocaleString() : '0'} so'm</span>
                    {product.oldPrice && (
                        <span className="price-old">{parseFloat(product.oldPrice).toLocaleString()} so'm</span>
                    )}
                </div>
                <div className="product-actions">
                    <button className="btn-primary btn-full" onClick={handleAction}>
                        <i className="fas fa-shopping-cart"></i>
                        Sotib olish
                    </button>
                    <Link to={`/products/${product.id}`} className="btn-outline btn-full">Batafsil</Link>
                </div>
            </div>
        </div>
    );
};

});

export default ProductCard;
