import { useState, useEffect, useRef } from 'react';
import { FaUsers, FaPlus, FaEdit, FaTrash, FaImage, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import './Team.css';

interface TeamMember {
  id?: number;
  name: string;
  position: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

const emptyMember: TeamMember = {
  name: '',
  position: '',
  imageUrl: '',
  displayOrder: 0,
  isActive: true,
};

export default function Team() {
  const toast = useToast();
  const confirm = useConfirm();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember>(emptyMember);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/admin/team');
      setMembers(res.data);
    } catch {
      toast.error('Hodimlar yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const openCreate = () => {
    setEditMember({ ...emptyMember });
    setImageFile(null);
    setImagePreview('');
    setModalOpen(true);
  };

  const openEdit = (m: TeamMember) => {
    setEditMember({ ...m });
    setImageFile(null);
    setImagePreview(m.imageUrl || '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!editMember.name.trim()) { toast.error('Ism kiritilishi shart'); return; }
    if (!editMember.position.trim()) { toast.error('Lavozim kiritilishi shart'); return; }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('member', new Blob([JSON.stringify({
        name: editMember.name.trim(),
        position: editMember.position.trim(),
        displayOrder: editMember.displayOrder,
        isActive: editMember.isActive,
      })], { type: 'application/json' }));
      if (imageFile) formData.append('image', imageFile);

      if (editMember.id) {
        await api.put(`/admin/team/${editMember.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Hodim yangilandi');
      } else {
        await api.post('/admin/team', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Hodim qo\'shildi');
      }
      closeModal();
      fetchMembers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: TeamMember) => {
    const ok = await confirm(`"${m.name}" ni o'chirishni tasdiqlaysizmi?`);
    if (!ok) return;
    try {
      await api.delete(`/admin/team/${m.id}`);
      toast.success('Hodim o\'chirildi');
      fetchMembers();
    } catch {
      toast.error('O\'chirishda xatolik');
    }
  };

  const toggleActive = async (m: TeamMember) => {
    try {
      const formData = new FormData();
      formData.append('member', new Blob([JSON.stringify({
        name: m.name,
        position: m.position,
        displayOrder: m.displayOrder,
        isActive: !m.isActive,
      })], { type: 'application/json' }));
      await api.put(`/admin/team/${m.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchMembers();
    } catch {
      toast.error('Xatolik yuz berdi');
    }
  };

  return (
    <div className="team-admin-page">
      <div className="team-admin-header">
        <div className="team-admin-title">
          <FaUsers className="team-admin-title-icon" />
          <div>
            <h1>Jamoa a'zolari</h1>
            <p>Bosh sahifadagi karusel uchun hodimlar</p>
          </div>
        </div>
        <button className="btn-add-member" onClick={openCreate}>
          <FaPlus /> Hodim qo'shish
        </button>
      </div>

      {loading ? (
        <div className="team-loading">
          <div className="team-spinner" />
          <span>Yuklanmoqda...</span>
        </div>
      ) : members.length === 0 ? (
        <div className="team-empty">
          <FaUsers size={48} />
          <p>Hali hodim qo'shilmagan</p>
          <button className="btn-add-member" onClick={openCreate}><FaPlus /> Birinchi hodimni qo'shing</button>
        </div>
      ) : (
        <div className="team-grid">
          {members.map(m => (
            <div key={m.id} className={`team-member-card${!m.isActive ? ' inactive' : ''}`}>
              <div className="member-photo">
                {m.imageUrl ? (
                  <img src={m.imageUrl} alt={m.name} />
                ) : (
                  <div className="member-avatar">
                    <span>{m.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>
                  </div>
                )}
                <span className={`member-status-badge ${m.isActive ? 'active' : 'hidden'}`}>
                  {m.isActive ? 'Faol' : 'Yashirin'}
                </span>
              </div>
              <div className="member-info">
                <div className="member-order">#{m.displayOrder}</div>
                <h3 className="member-name">{m.name}</h3>
                <p className="member-position">{m.position}</p>
              </div>
              <div className="member-actions">
                <button className="action-btn toggle" onClick={() => toggleActive(m)} title={m.isActive ? 'Yashirish' : 'Ko\'rsatish'}>
                  {m.isActive ? <FaEyeSlash /> : <FaEye />}
                </button>
                <button className="action-btn edit" onClick={() => openEdit(m)} title="Tahrirlash">
                  <FaEdit />
                </button>
                <button className="action-btn delete" onClick={() => handleDelete(m)} title="O'chirish">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="team-modal-overlay" onClick={closeModal}>
          <div className="team-modal" onClick={e => e.stopPropagation()}>
            <div className="team-modal-header">
              <h2>{editMember.id ? 'Hodimni tahrirlash' : 'Yangi hodim qo\'shish'}</h2>
              <button className="modal-close" onClick={closeModal}><FaTimes /></button>
            </div>

            <div className="team-modal-body">
              <div className="photo-upload-area" onClick={() => fileInputRef.current?.click()}>
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="photo-preview" />
                ) : (
                  <div className="photo-placeholder">
                    <FaImage size={32} />
                    <span>Rasm yuklash</span>
                    <small>.jpg, .png, .webp — max 5MB</small>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ism Familiya *</label>
                  <input
                    type="text"
                    placeholder="Masalan: Shukurjon Abdullayev"
                    value={editMember.name}
                    onChange={e => setEditMember(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Lavozim *</label>
                  <input
                    type="text"
                    placeholder="Masalan: CEO & Asoschisi"
                    value={editMember.position}
                    onChange={e => setEditMember(p => ({ ...p, position: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tartib raqami</label>
                  <input
                    type="number"
                    min={0}
                    value={editMember.displayOrder}
                    onChange={e => setEditMember(p => ({ ...p, displayOrder: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="form-group form-group-toggle">
                  <label>Ko'rinish</label>
                  <button
                    type="button"
                    className={`toggle-btn ${editMember.isActive ? 'on' : 'off'}`}
                    onClick={() => setEditMember(p => ({ ...p, isActive: !p.isActive }))}
                  >
                    <span className="toggle-thumb" />
                    <span className="toggle-label">{editMember.isActive ? 'Faol' : 'Yashirin'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="team-modal-footer">
              <button className="btn-cancel" onClick={closeModal}>Bekor qilish</button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Saqlanmoqda...' : (editMember.id ? 'Yangilash' : 'Qo\'shish')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
