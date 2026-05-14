import { useEffect, useState } from 'react';
import { FaCreditCard, FaPlus, FaEdit, FaTrash, FaSearch, FaTimes, FaSave } from 'react-icons/fa';
import api from '../services/api';
import './Payments.css';

interface PaymentCard {
  id: number;
  label: string;
  cardNumber: string;
  cardHolder: string;
  bankName?: string;
  phone?: string;
  paymeUrl?: string;
  clickUrl?: string;
  isActive: boolean;
}

const initialCard: Omit<PaymentCard, 'id'> = {
  label: '',
  cardNumber: '',
  cardHolder: '',
  bankName: '',
  phone: '',
  paymeUrl: '',
  clickUrl: '',
  isActive: true,
};

export default function Payments() {
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<PaymentCard | null>(null);
  const [formData, setFormData] = useState<Omit<PaymentCard, 'id'> | PaymentCard>(initialCard);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const response = await api.get('/admin/payment-cards');
      setCards(response.data || []);
    } catch (error) {
      console.error('Error fetching payment cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (card?: PaymentCard) => {
    if (card) {
      setSelectedCard(card);
      setFormData({ ...card });
    } else {
      setSelectedCard(null);
      setFormData(initialCard);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Karta o'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/admin/payment-cards/${id}`);
      setCards(cards.filter(card => card.id !== id));
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('Kartani o\'chirishda xatolik');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.label.trim()) {
      alert('Karta nomi majburiy');
      return;
    }
    
    const hasUrl = (formData.paymeUrl && formData.paymeUrl.trim() !== '') || (formData.clickUrl && formData.clickUrl.trim() !== '');

    if (!hasUrl) {
      if (!formData.cardNumber.trim()) {
        alert('Agar Payme/Click havola bo\'lmasa, karta raqami majburiy');
        return;
      }
      if (!formData.cardHolder.trim()) {
        alert('Agar Payme/Click havola bo\'lmasa, karta egasi majburiy');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let response: any;
      if (selectedCard) {
        response = await api.put(`/admin/payment-cards/${selectedCard.id}`, formData);
        setCards(cards.map(card => card.id === selectedCard.id ? response.data : card));
      } else {
        response = await api.post('/admin/payment-cards', formData);
        setCards([response.data, ...cards]);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error saving card:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Xatolik yuz berdi";
      alert(errorMsg);
    } finally {
      setTimeout(() => setIsSubmitting(false), 500);
    }
  };

  const filteredCards = cards.filter(card => {
    const q = searchTerm.toLowerCase();
    return (
      card.label?.toLowerCase().includes(q) ||
      card.cardNumber?.toLowerCase().includes(q) ||
      card.cardHolder?.toLowerCase().includes(q) ||
      card.bankName?.toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="page-container"><p>Yuklanmoqda...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><FaCreditCard /> To'lov kartalari</h1>
          <p>To'lov uchun kartalarni boshqaring ({cards.length} ta)</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <FaPlus /> Yangi karta
        </button>
      </div>

      <div className="page-toolbar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Kartalarni qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nomi</th>
              <th>Karta raqami</th>
              <th>Ega</th>
              <th>Bank</th>
              <th>Telefon</th>
              <th>Holat</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filteredCards.map(card => (
              <tr key={card.id}>
                <td><strong>{card.label}</strong></td>
                <td className="mono">{card.cardNumber}</td>
                <td>{card.cardHolder}</td>
                <td>{card.bankName || '-'}</td>
                <td>{card.phone || '-'}</td>
                <td>
                  <span className={`status-pill ${card.isActive ? 'active' : 'inactive'}`}>
                    {card.isActive ? 'Aktiv' : 'Noaktiv'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon btn-edit" onClick={() => handleOpenModal(card)}><FaEdit /></button>
                    <button className="btn-icon btn-delete" onClick={() => handleDelete(card.id)}><FaTrash /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCards.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Kartalar topilmadi</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedCard ? 'Kartani tahrirlash' : 'Yangi karta qo\'shish'}</h2>
              <button className="close-btn" onClick={handleCloseModal}><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Karta nomi</label>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={e => setFormData({ ...formData, label: e.target.value })}
                />
              </div>
              {(!formData.paymeUrl && !formData.clickUrl) && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Karta raqami</label>
                    <input
                      type="text"
                      value={formData.cardNumber}
                      onChange={e => setFormData({ ...formData, cardNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Karta egasi</label>
                    <input
                      type="text"
                      value={formData.cardHolder}
                      onChange={e => setFormData({ ...formData, cardHolder: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label>Bank nomi</label>
                  <input
                    type="text"
                    value={formData.bankName || ''}
                    onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Telefon (ixtiyoriy)</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Payme URL (ixtiyoriy)</label>
                  <input
                    type="text"
                    value={formData.paymeUrl || ''}
                    onChange={e => setFormData({ ...formData, paymeUrl: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Click URL (ixtiyoriy)</label>
                  <input
                    type="text"
                    value={formData.clickUrl || ''}
                    onChange={e => setFormData({ ...formData, clickUrl: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Holat</label>
                <select
                  value={String(formData.isActive)}
                  onChange={e => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                >
                  <option value="true">Aktiv</option>
                  <option value="false">Noaktiv</option>
                </select>
              </div>
              <div className="form-actions">
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
