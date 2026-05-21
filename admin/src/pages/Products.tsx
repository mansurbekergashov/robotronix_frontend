import { useState, useEffect, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBox, FaTimes, FaSave } from 'react-icons/fa';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import './Products.css';

interface ProductData {
  id: number;
  title: string;
  description: string;
  price: number;
  oldPrice?: number;
  paymentCardId?: number | null;
  imageUrl: string;
  badge?: string;
}

interface PaymentCardOption {
  id: number;
  label: string;
  cardNumber: string;
  cardHolder: string;
  bankName?: string;
  phone?: string;
  isActive: boolean;
}

const initialProduct: Omit<ProductData, 'id'> = {
  title: '',
  description: '',
  price: 0,
  oldPrice: 0,
  paymentCardId: null,
  imageUrl: '',
  badge: ''
};

export default function Products() {
  const toast = useToast();
  const confirm = useConfirm();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [formData, setFormData] = useState<Omit<ProductData, 'id'> | ProductData>(initialProduct);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [paymentCards, setPaymentCards] = useState<PaymentCardOption[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    fetchProducts();
    fetchPaymentCards();
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/admin/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentCards = async () => {
    try {
      const response = await api.get('/admin/payment-cards');
      setPaymentCards(response.data || []);
    } catch (error) {
      console.error('Error fetching payment cards:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirm({ message: "Mahsulotni o'chirishni tasdiqlaysizmi?" }))) return;
    try {
      await api.delete(`/admin/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error("O'chirishda xatolik yuz berdi");
    }
  };

  const handleOpenModal = (product?: ProductData) => {
    setImageFile(null);
    if (product) {
      setSelectedProduct(product);
      setFormData({ ...product });
    } else {
      setSelectedProduct(null);
      setFormData(initialProduct);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);

    // Basic validation
    if (!formData.title.trim()) {
      submittingRef.current = false;
      setIsSubmitting(false);
      toast.warning("Mahsulot nomi kiritilishi shart");
      return;
    }
    try {
      const data = new FormData();
      const { id, ...productPayload } = formData as ProductData;
      const productBlob = new Blob([JSON.stringify(productPayload)], { type: 'application/json' });
      data.append('product', productBlob);
      if (imageFile) {
        data.append('image', imageFile);
      }

      if (selectedProduct) {
        await api.put(`/admin/products/${selectedProduct.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/admin/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      await fetchProducts();
      setIsModalOpen(false);
      setImageFile(null);
    } catch (error: any) {
      console.error('Error saving product:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Xatolik yuz berdi";
      toast.error(errorMsg);
    } finally {
      submittingRef.current = false;
      setTimeout(() => setIsSubmitting(false), 500);
    }
  };

  const filteredProducts = products.filter(product =>
    product.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="page-container"><p>Yuklanmoqda...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><FaBox /> Mahsulotlar</h1>
          <p>Barcha mahsulotlarni boshqaring ({products.length} ta)</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <FaPlus /> Yangi mahsulot
        </button>
      </div>

      <div className="page-toolbar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Mahsulotlarni qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="products-grid">
        {filteredProducts.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-image">
              <img src={product.imageUrl || `/default-image.svg`} alt={product.title} onError={(e) => {
                e.currentTarget.src = `/default-image.svg`;
              }} />
              {product.badge && (
                <span className="stock-badge in-stock">{product.badge}</span>
              )}
            </div>
            <div className="product-content">
              <h3>{product.title}</h3>
              <p>{product.description}</p>
              <div className="product-footer">
                <span className="product-price">{(product.price || 0).toLocaleString()} so'm</span>
                <div className="action-buttons">
                  <button className="btn-icon btn-edit" onClick={() => handleOpenModal(product)}><FaEdit /></button>
                  <button className="btn-icon btn-delete" onClick={() => handleDelete(product.id)}><FaTrash /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#8b92a7' }}>Mahsulotlar topilmadi</p>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedProduct ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo\'shish'}</h2>
              <button className="close-btn" onClick={handleCloseModal}><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Rasm (preview)</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <img
                    src={imagePreview || formData.imageUrl || `/default-image.svg`}
                    alt="Preview"
                    style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)' }}
                    onError={(e) => { e.currentTarget.src = `/default-image.svg`; }}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={!formData.imageUrl && !imageFile}
                    onClick={() => {
                      setImageFile(null);
                      setFormData({ ...formData, imageUrl: '' });
                    }}
                    title="Rasmni olib tashlash (default rasm qo'yiladi)"
                  >
                    <FaTimes /> Rasmni o'chirish
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Mahsulot nomi</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Narxi (so'm)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Eski narxi (so'm)</label>
                  <input
                    type="number"
                    value={formData.oldPrice}
                    onChange={e => setFormData({ ...formData, oldPrice: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Nishon (Badge)</label>
                <input
                  type="text"
                  placeholder="Masalan: Yangi, Chegirma"
                  value={formData.badge}
                  onChange={e => setFormData({ ...formData, badge: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Naqd to'lov kartasi <span style={{fontSize:'12px',color:'#8b92a7',fontWeight:'normal'}}>(ixtiyoriy — Payme avtomatik)</span></label>
                <select
                  value={formData.paymentCardId ?? ''}
                  onChange={e => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    setFormData({ ...formData, paymentCardId: value });
                  }}
                >
                  <option value="">Tanlanmagan (Payme)</option>
                  {paymentCards.map(card => (
                    <option key={card.id} value={card.id}>
                      {card.label} • {card.cardNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Rasm URL (agar bo'sh bo'lsa, fayl yuklang)</label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Rasm fayli</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setImageFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Tavsif</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button className="close-btn btn-secondary" onClick={handleCloseModal}><FaTrash />Bekor qilish</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <><FaSave /> Saqlanmoqda...</> : <><FaSave /> Saqlash</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
