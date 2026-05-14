import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaSearch, FaUsers, FaTimes, FaSave, FaUserShield, FaUser, FaComments, FaDownload } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { downloadFromApi } from '../utils/download';
import './Users.css';

interface UserData {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

const initialUser: Omit<UserData, 'id' | 'createdAt'> = {
  fullName: '',
  email: '',
  phone: '',
  role: 'USER',
  isActive: true
};

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<Omit<UserData, 'id' | 'createdAt'> | UserData>(initialUser);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await downloadFromApi('/admin/users/export', 'users.csv', 'text/csv;charset=utf-8');
    } catch (error) {
      console.error('Export users failed:', error);
      alert('Export qilishda xatolik yuz berdi');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Foydalanuvchini o'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Xatolik yuz berdi');
    }
  };

  const handleStartChat = (user: UserData) => {
    navigate('/chat', { state: { userId: user.id, email: user.email, fullName: user.fullName } });
  };

  const handleOpenModal = (user?: UserData) => {
    if (user) {
      setSelectedUser(user);
      setFormData({ ...user });
    } else {
      setSelectedUser(null);
      setFormData(initialUser);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        const response = await api.put(`/admin/users/${selectedUser.id}`, formData);
        setUsers(users.map(u => u.id === selectedUser.id ? response.data : u));
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error saving user:', error);
      alert(error.response?.data?.message || "Xatolik yuz berdi");
    }
  };

  const filteredUsers = users.filter(user =>
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="page-container"><p>Yuklanmoqda...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><FaUsers /> Foydalanuvchilar</h1>
          <p>Barcha foydalanuvchilarni boshqaring ({users.length} ta)</p>
        </div>
        <button className="btn-secondary" onClick={handleExport} disabled={users.length === 0}>
          <FaDownload /> Excelga yuklash
        </button>
      </div>

      <div className="page-toolbar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Foydalanuvchilarni qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <div className="users-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>To'liq ism</th>
                <th>Email</th>
                <th>Telefon</th>
                <th>Rol</th>
                <th>Holat</th>
                <th>Ro'yxatdan o'tgan</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} onClick={() => handleOpenModal(user)} className="clickable-row">
                  <td>{user.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {user.role === 'ADMIN' ? <FaUserShield style={{ color: '#0066ff' }} /> : <FaUser style={{ color: '#8b92a7' }} />}
                      {user.fullName}
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.phone || '-'}</td>
                  <td>
                    <span className={`badge ${user.role === 'ADMIN' ? 'badge-info' : 'badge-success'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {user.isActive ? 'Faol' : 'Nofaol'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString('uz-UZ')}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-message"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartChat(user);
                        }}
                        title="Habar yuborish"
                      >
                        <FaComments />
                      </button>
                      <button
                        className="btn-icon btn-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(user);
                        }}
                        title="Tahrirlash"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(user.id);
                        }}
                        title="O'chirish"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="users-cards">
          {filteredUsers.map((user) => {
            const dateText = new Date(user.createdAt).toLocaleDateString('uz-UZ')
            return (
              <div
                key={user.id}
                className="user-card clickable-row"
                onClick={() => handleOpenModal(user)}
              >
                <div className="user-card-top">
                  <div className="user-card-name">
                    {user.role === 'ADMIN' ? <FaUserShield style={{ color: '#0066ff' }} /> : <FaUser style={{ color: '#8b92a7' }} />}
                    <span>{user.fullName}</span>
                  </div>
                  <span className={`badge ${user.role === 'ADMIN' ? 'badge-info' : 'badge-success'}`}>
                    {user.role}
                  </span>
                </div>

                <div className="user-card-meta">
                  <div><b>ID:</b> {user.id}</div>
                  <div><b>Email:</b> {user.email}</div>
                  <div><b>Telefon:</b> {user.phone || '-'}</div>
                  <div><b>Ro'yxatdan:</b> {dateText}</div>
                </div>

                <div className="user-card-bottom">
                  <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {user.isActive ? 'Faol' : 'Nofaol'}
                  </span>

                  <div className="action-buttons">
                    <button
                      className="btn-icon btn-message"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartChat(user);
                      }}
                      title="Habar yuborish"
                    >
                      <FaComments />
                    </button>
                    <button
                      className="btn-icon btn-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(user);
                      }}
                      title="Tahrirlash"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(user.id);
                      }}
                      title="O'chirish"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredUsers.length === 0 && (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#8b92a7' }}>Foydalanuvchilar topilmadi</p>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Foydalanuvchini tahrirlash</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>To'liq ism</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  pattern="^\+998[0-9]{9}$"
                  placeholder="+998901234567"
                />
                <small>Format: +998XXXXXXXXX</small>
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'USER' | 'ADMIN' })}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn-primary">
                  <FaSave /> Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
