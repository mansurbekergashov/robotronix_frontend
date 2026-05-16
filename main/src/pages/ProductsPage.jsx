import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/products/ProductCard';

const ProductsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const { data: products, loading } = useFetch('/products');
    const { addToCart } = useCart();

    const filteredProducts = (products || []).filter(p =>
        p.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(debouncedSearch.toLowerCase()))
    );

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
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="skeleton-card" />)
                    ) : filteredProducts.length > 0 ? (
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
