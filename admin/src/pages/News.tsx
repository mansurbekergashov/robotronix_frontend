import { useState, useEffect, useMemo, useRef } from 'react';
import {
  FaNewspaper, FaBullhorn, FaPlus, FaEdit, FaTrash, FaSearch,
  FaFilter, FaThumbtack, FaEye, FaEyeSlash, FaTimes, FaImage,
  FaGlobe, FaUsers, FaCalendarAlt, FaChevronDown
} from 'react-icons/fa';
import api from '../services/api';
import './News.css';

interface NewsItem {
  id?: number;
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  type: 'NEWS' | 'ANNOUNCEMENT';
  audience: 'ALL' | 'MAIN_SITE' | 'USER_PANEL';
  isPinned: boolean;
  isPublished: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

const emptyItem: NewsItem = {
  title: '',
  summary: '',
  content: '',
  imageUrl: '',
  type: 'NEWS',
  audience: 'ALL',
  isPinned: false,
  isPublished: true,
};

export default function News() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<NewsItem>(emptyItem);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = async () => {
    try {
      const res = await api.get('/admin/news');
      setItems(res.data);
    } catch (err) {
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchType = typeFilter ? item.type === typeFilter : true;
      const matchSearch = searchTerm
        ? item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
        : true;
      return matchType && matchSearch;
    });
  }, [items, typeFilter, searchTerm]);

  const openCreateModal = () => {
    setEditItem({ ...emptyItem });
    setImageFile(null);
    setImagePreview('');
    setModalOpen(true);
  };

  const openEditModal = (item: NewsItem) => {
    setEditItem({ ...item });
    setImageFile(null);
    setImagePreview(item.imageUrl || '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditItem(emptyItem);
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!editItem.title.trim() || !editItem.content.trim()) {
      alert('Sarlavha va matn kiritilishi shart!');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      const newsBlob = new Blob([JSON.stringify({
        title: editItem.title,
        summary: editItem.summary,
        content: editItem.content,
        type: editItem.type,
        audience: editItem.audience,
        isPinned: editItem.isPinned,
        isPublished: editItem.isPublished,
        imageUrl: editItem.imageUrl || null,
      })], { type: 'application/json' });
      formData.append('news', newsBlob);

      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editItem.id) {
        await api.put(`/admin/news/${editItem.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/admin/news', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      closeModal();
      fetchItems();
    } catch (err) {
      console.error('Error saving news:', err);
      alert('Saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/admin/news/${id}`);
      setDeleteId(null);
      fetchItems();
    } catch (err) {
      console.error('Error deleting news:', err);
      alert("O'chirishda xatolik");
    }
  };

  const getTypeInfo = (type: string) => {
    if (type === 'ANNOUNCEMENT') return { icon: <FaBullhorn />, label: "E'lon", color: '#f59e0b' };
    return { icon: <FaNewspaper />, label: 'Yangilik', color: '#3b82f6' };
  };

  const getAudienceInfo = (audience: string) => {
    switch (audience) {
      case 'MAIN_SITE': return { icon: <FaGlobe />, label: 'Asosiy sayt' };
      case 'USER_PANEL': return { icon: <FaUsers />, label: 'User panel' };
      default: return { icon: <FaGlobe />, label: 'Barchasi' };
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('uz-UZ', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return <div className="page-container"><p>Yuklanmoqda...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><FaNewspaper /> Yangiliklar va E'lonlar</h1>
          <p>Yangiliklar va e'lonlarni boshqarish ({filtered.length} ta)</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <FaPlus /> Yangi qo'shish
        </button>
      </div>

      <div className="page-toolbar news-toolbar">
        <div className="toolbar-left">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Qidiruv..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="toolbar-right">
          <div className="filter-group">
            <FaFilter className="filter-icon" />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Barchasi</option>
              <option value="NEWS">Yangiliklar</option>
              <option value="ANNOUNCEMENT">E'lonlar</option>
            </select>
          </div>
        </div>
      </div>

      <div className="news-grid">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <FaNewspaper style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} />
            <p>Hech qanday yangilik yoki e'lon topilmadi</p>
          </div>
        ) : (
          filtered.map(item => {
            const typeInfo = getTypeInfo(item.type);
            const audienceInfo = getAudienceInfo(item.audience);
            const isExpanded = expandedId === item.id;

            return (
              <div key={item.id} className={`news-card ${!item.isPublished ? 'unpublished' : ''}`}>
                {item.imageUrl && (
                  <div className="news-card-image">
                    <img src={item.imageUrl} alt={item.title} />
                    {item.isPinned && (
                      <span className="news-pin-badge"><FaThumbtack /> Pin</span>
                    )}
                  </div>
                )}
                {!item.imageUrl && item.isPinned && (
                  <span className="news-pin-badge floating"><FaThumbtack /> Pin</span>
                )}

                <div className="news-card-body">
                  <div className="news-card-meta">
                    <span className="news-type-badge" style={{ background: `${typeInfo.color}20`, color: typeInfo.color }}>
                      {typeInfo.icon} {typeInfo.label}
                    </span>
                    <span className="news-audience-badge">
                      {audienceInfo.icon} {audienceInfo.label}
                    </span>
                    {!item.isPublished && (
                      <span className="news-draft-badge"><FaEyeSlash /> Qoralama</span>
                    )}
                  </div>

                  <h3 className="news-card-title">{item.title}</h3>
                  {item.summary && <p className="news-card-summary">{item.summary}</p>}

                  {isExpanded && (
                    <div className="news-card-content">
                      <p>{item.content}</p>
                    </div>
                  )}

                  <div className="news-card-footer">
                    <span className="news-date">
                      <FaCalendarAlt /> {formatDate(item.publishedAt || item.createdAt)}
                    </span>
                    <div className="news-card-actions">
                      <button
                        className="btn-icon btn-expand"
                        onClick={() => setExpandedId(isExpanded ? null : (item.id ?? null))}
                        title={isExpanded ? 'Yopish' : "To'liq ko'rish"}
                      >
                        <FaChevronDown className={isExpanded ? 'rotated' : ''} />
                      </button>
                      <button className="btn-icon btn-edit" onClick={() => openEditModal(item)} title="Tahrirlash">
                        <FaEdit />
                      </button>
                      <button className="btn-icon btn-delete" onClick={() => setDeleteId(item.id ?? null)} title="O'chirish">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="news-modal-overlay" onClick={closeModal}>
          <div className="news-modal" onClick={e => e.stopPropagation()}>
            <div className="news-modal-header">
              <h2>{editItem.id ? 'Tahrirlash' : 'Yangi qo\'shish'}</h2>
              <button className="btn-close" onClick={closeModal}><FaTimes /></button>
            </div>

            <div className="news-modal-body">
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Sarlavha *</label>
                  <input
                    type="text"
                    value={editItem.title}
                    onChange={e => setEditItem({ ...editItem, title: e.target.value })}
                    placeholder="Sarlavhani kiriting..."
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Qisqa xulosa</label>
                <input
                  type="text"
                  value={editItem.summary}
                  onChange={e => setEditItem({ ...editItem, summary: e.target.value })}
                  placeholder="Qisqacha tavsif..."
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>To'liq matn *</label>
                <textarea
                  value={editItem.content}
                  onChange={e => setEditItem({ ...editItem, content: e.target.value })}
                  placeholder="To'liq matni..."
                  className="form-textarea"
                  rows={6}
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Turi</label>
                  <select
                    value={editItem.type}
                    onChange={e => setEditItem({ ...editItem, type: e.target.value as 'NEWS' | 'ANNOUNCEMENT' })}
                    className="form-select"
                  >
                    <option value="NEWS">📰 Yangilik</option>
                    <option value="ANNOUNCEMENT">📢 E'lon</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label>Auditoriya</label>
                  <select
                    value={editItem.audience}
                    onChange={e => setEditItem({ ...editItem, audience: e.target.value as 'ALL' | 'MAIN_SITE' | 'USER_PANEL' })}
                    className="form-select"
                  >
                    <option value="ALL">🌐 Barchasi</option>
                    <option value="MAIN_SITE">🏠 Asosiy sayt</option>
                    <option value="USER_PANEL">👤 Foydalanuvchi panel</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={editItem.isPinned}
                    onChange={e => setEditItem({ ...editItem, isPinned: e.target.checked })}
                  />
                  <span><FaThumbtack /> Yuqoriga pin qilish</span>
                </label>
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={editItem.isPublished}
                    onChange={e => setEditItem({ ...editItem, isPublished: e.target.checked })}
                  />
                  <span><FaEye /> Nashr qilish</span>
                </label>
              </div>

              <div className="form-group">
                <label>Rasm</label>
                <div className="image-upload-area" onClick={() => fileInputRef.current?.click()}>
                  {imagePreview ? (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <button className="remove-image-btn" onClick={(e) => {
                        e.stopPropagation();
                        setImageFile(null);
                        setImagePreview('');
                        setEditItem({ ...editItem, imageUrl: '' });
                      }}>
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <FaImage />
                      <p>Rasm yuklash uchun bosing</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <div className="news-modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Bekor qilish</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saqlanmoqda...' : (editItem.id ? 'Saqlash' : 'Yaratish')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId !== null && (
        <div className="news-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="news-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon"><FaTrash /></div>
            <h3>O'chirmoqchimisiz?</h3>
            <p>Bu amalni qaytarib bo'lmaydi</p>
            <div className="confirm-actions">
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>Bekor qilish</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteId)}>O'chirish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
