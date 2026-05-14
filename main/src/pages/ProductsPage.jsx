import { useState, useEffect } from 'react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/products/ProductCard';

const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { addToCart } = useCart();

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            const data = Array.isArray(response.data) ? response.data : [];
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') fetchProducts();
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);

    const filteredProducts = Array.isArray(products) ? products.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : [];

    if (loading) return <div className="loading">Yuklanmoqda...</div>;

    return (
        <section className="products-page products">
            <div className="container">
                <div className="section-header" data-aos="fade-up">
                    <h2 className="section-title">Mahsulotlarimiz</h2>
                    <p className="section-subtitle">Robototexnika va elektronika uchun eng sara qismlar</p>
                </div>

                <div className="products-search" data-aos="fade-up" data-aos-delay="100">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Mahsulotlarni qidirish..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <i className="fas fa-search search-icon"></i>
                </div>

                <div className="products-grid">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((product, index) => (
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
                            <i className="fas fa-search"></i>
                            <p>So'rovingiz bo'yicha hech narsa topilmadi.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ProductsPage;
