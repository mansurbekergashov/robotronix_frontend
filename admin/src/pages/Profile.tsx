import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profile';
import {
  FaUserCircle, FaCamera, FaEdit, FaUser, FaCog, FaEnvelope, FaPhone,
  FaIdCard, FaCalendarAlt, FaClock, FaShieldAlt, FaBolt, FaLock,
  FaTrashAlt, FaCheckCircle, FaExclamationCircle
} from 'react-icons/fa';
import { useConfirm } from '../hooks/useConfirm';
import './Profile.css';


const Profile: React.FC = () => {
  const { user, updateProfile, refreshUser } = useAuth();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [editForm, setEditForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: ''
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const resizeImage = (file: File, maxSize = 800): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          let { width, height } = img;
          if (width <= maxSize && height <= maxSize) {
            resolve(file);
            return;
          }
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.85);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateProfile(editForm);
      setIsEditing(false);
      showNotification('Profil muvaffaqiyatli yangilandi', 'success');
    } catch (error: any) {
      console.error('Profilni yangilashda xatolik:', error);
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await profileService.changePassword(passwordForm);
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      showNotification('Parol muvaffaqiyatli o\'zgartirildi', 'success');
    } catch (error: any) {
      console.error('Parolni o\'zgartirishda xatolik:', error);
      showNotification(error.message, 'error');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Faqat rasm fayllari qabul qilinadi', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showNotification('Fayl hajmi 10MB dan oshmasligi kerak', 'error');
      return;
    }

    try {
      setLoading(true);
      const resizedFile = await resizeImage(file, 800);
      await profileService.uploadAvatar(resizedFile);
      await refreshUser();
      showNotification('Avatar muvaffaqiyatli yuklandi', 'success');
    } catch (error: any) {
      console.error('Avatar yuklashda xatolik:', error);
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!(await confirm({ message: "Avatarni o'chirishni xohlaysizmi?", danger: false }))) return;

    try {
      setLoading(true);
      await profileService.deleteAvatar();
      await refreshUser();
      showNotification('Avatar muvaffaqiyatli o\'chirildi', 'success');
    } catch (error: any) {
      console.error('Avatar o\'chirishda xatolik:', error);
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-error">
        <FaExclamationCircle />
        <p>Profil ma'lumotlarini yuklashda xatolik</p>
      </div>
    );
  }

  const profile = user as any; // Cast for additional fields like createdAt, updatedAt if needed

  const avatarUrl = profile.avatarUrl
    ? (profile.avatarUrl.startsWith('http') ? profile.avatarUrl : profile.avatarUrl)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=0066ff&color=fff&size=150`;

  return (
    <div className="profile-container">
      <div className="page-header">
        <h1><FaUserCircle /> Profil</h1>
        <p>Shaxsiy ma'lumotlaringizni boshqaring</p>
      </div>

      <div className="profile-layout">
        {/* Profile Card */}
        <div className="profile-main-card">
          <div className="profile-cover">
            <div className="profile-cover-gradient"></div>
          </div>
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper">
              <img src={avatarUrl} alt="Avatar" className="profile-avatar-img" />
              <button
                className="avatar-edit-btn"
                onClick={() => avatarInputRef.current?.click()}
                title="Rasmni o'zgartirish"
              >
                <FaCamera />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarUpload}
              />
            </div>
            <div className="profile-header-info">
              <h2 className="profile-name">{profile.fullName}</h2>
              <p className="profile-email">
                <FaEnvelope /> {profile.email}
              </p>
              <span className="profile-role-badge">
                <FaShieldAlt /> {profile.role}
              </span>
            </div>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="profile-info-grid">
          {/* Personal Info Card */}
          <div className="info-card">
            <div className="info-card-header">
              <h3><FaUser /> Shaxsiy Ma'lumotlar</h3>
              <button
                className="btn-icon-edit"
                onClick={() => setIsEditing(!isEditing)}
                title="Tahrirlash"
              >
                <FaEdit />
              </button>
            </div>
            <div className="info-card-body">
              {isEditing ? (
                <form onSubmit={handleUpdateProfile}>
                  <div className="form-group">
                    <label>To'liq ism</label>
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      required
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Telefon</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      pattern="^\+998[0-9]{9}$"
                      placeholder="+998901234567"
                      className="form-control"
                    />
                    <small>Format: +998XXXXXXXXX</small>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                      Bekor qilish
                    </button>
                    <button type="submit" className="btn-primary">
                      Saqlash
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="info-row">
                    <div className="info-label">
                      <FaIdCard />
                      <span>To'liq ism</span>
                    </div>
                    <div className="info-value">{profile.fullName}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">
                      <FaEnvelope />
                      <span>Email</span>
                    </div>
                    <div className="info-value">{profile.email}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">
                      <FaPhone />
                      <span>Telefon</span>
                    </div>
                    <div className="info-value">{profile.phone || 'Kiritilmagan'}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Account Info Card */}
          <div className="info-card">
            <div className="info-card-header">
              <h3><FaCog /> Hisob Ma'lumotlari</h3>
            </div>
            <div className="info-card-body">
              <div className="info-row">
                <div className="info-label">
                  <FaCalendarAlt />
                  <span>Ro'yxatdan o'tgan</span>
                </div>
                <div className="info-value">{profile.createdAt}</div>
              </div>
              <div className="info-row">
                <div className="info-label">
                  <FaClock />
                  <span>Oxirgi yangilanish</span>
                </div>
                <div className="info-value">{profile.updatedAt}</div>
              </div>
              <div className="info-row">
                <div className="info-label">
                  <FaShieldAlt />
                  <span>Hisob holati</span>
                </div>
                <div className="info-value">
                  <span className="status-badge status-active">
                    <FaCheckCircle /> Faol
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="info-card actions-card">
            <div className="info-card-header">
              <h3><FaBolt /> Tezkor Amallar</h3>
            </div>
            <div className="info-card-body">
              <button className="action-btn" onClick={() => setShowPasswordModal(true)}>
                <FaLock />
                <span>Parolni o'zgartirish</span>
              </button>
              {profile.avatarUrl && (
                <button className="action-btn danger" onClick={handleDeleteAvatar}>
                  <FaTrashAlt />
                  <span>Avatarni o'chirish</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Parolni O'zgartirish</h3>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>Joriy parol</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Yangi parol</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                  className="form-control"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowPasswordModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn-primary">
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type} show`}>
          {notification.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
};

export default Profile;
