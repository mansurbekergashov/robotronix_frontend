import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getFileUrl } from '../../utils'

const Products = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const { addToCart } = useCart()
    const { isAuthenticated } = useAuth()
    const navigate = useNavigate()

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products')
            const data = Array.isArray(response.data) ? response.data : []
            setProducts(data.slice(0, 3)) // Show first 3 on homepage
        } catch (error) {
            console.error('Error fetching products:', error)
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProducts()

        // Refetch when user tabs back to the page
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchProducts()
            }
        }
        document.addEventListener('visibilitychange', handleVisibility)
        return () => document.removeEventListener('visibilitychange', handleVisibility)
    }, [])

    const handleAction = (product) => {
        if (!isAuthenticated) {
            navigate(`/login?redirect=/products/${product.id}`)
        } else {
            addToCart(product)
        }
    }

    return (
        <section id="products" className="products">
            <div className="container">
                <div className="section-header" data-aos="fade-up">
                    <h2 className="section-title">Mahsulotlarimiz</h2>
                    <p className="section-subtitle">
                        Ta'lim uchun maxsus tayyorlangan to'plamlar
                    </p>
                </div>

                <div className="products-grid">
                    {loading ? (
                        <div className="empty-state" data-aos="fade-up">
                            <i className="fas fa-spinner fa-spin"></i>
                            <p>Yuklanmoqda...</p>
                        </div>
                    ) : products.length > 0 ? (
                        products.map((product, index) => (
                            <div
                                key={product.id}
                                className="product-card"
                                data-aos="fade-up"
                                data-aos-delay={(index + 1) * 100}
                            >
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
                                    <button className="btn-primary btn-full" onClick={() => handleAction(product)}>
                                        <i className="fas fa-shopping-cart"></i>
                                        Sotib olish
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state" data-aos="fade-up">
                            <i className="fas fa-box-open"></i>
                            <p>Hozircha mahsulotlar mavjud emas</p>
                        </div>
                    )}
                </div>

                <div className="products-cta" data-aos="fade-up">
                    <Link to="/products" className="btn-outline btn-large">
                        Barcha mahsulotlarni ko'rish
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default Products
