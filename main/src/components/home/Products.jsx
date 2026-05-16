import { Link } from 'react-router-dom'
import useFetch from '../../hooks/useFetch'
import ProductCard from '../products/ProductCard'
import { useCart } from '../../context/CartContext'

const Products = () => {
    const { data: products, loading } = useFetch('/products', {
        transform: (data) => data.slice(0, 3)
    })
    const { addToCart } = useCart()

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
                        [1, 2, 3].map(i => <div key={i} className="skeleton-card" />)
                    ) : (products || []).length > 0 ? (
                        products.map((product, index) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={addToCart}
                                data-aos="fade-up"
                                data-aos-delay={(index + 1) * 100}
                            />
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
