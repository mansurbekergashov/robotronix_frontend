import { useEffect, useMemo, useState } from 'react';
import { FaCertificate, FaDownload, FaExternalLinkAlt, FaSearch, FaTimes, FaUserCheck } from 'react-icons/fa';
import api from '../services/api';
import { downloadFromApi, downloadPublicFile } from '../utils/download';
import { useToast } from '../hooks/useToast';
import './CertificateHolders.css';

interface CertificateHolder {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  certificatesCount: number;
  lastIssuedAt?: string;
}

interface HolderUser {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
}

interface CertificateDto {
  id: number;
  userId: number;
  courseId: number;
  courseTitle?: string;
  fileUrl: string;
  issuedAt: string;
}

interface HolderDetailsResponse {
  user: HolderUser;
  certificates: CertificateDto[];
}

function formatDateTime(value?: string) {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString('uz-UZ');
}

function getInitial(name?: string, email?: string) {
  const first = (name || email || '?').trim().charAt(0);
  return (first || '?').toUpperCase();
}

function inferExtension(fileUrl?: string) {
  if (!fileUrl) return 'file';
  const clean = fileUrl.split('?')[0].split('#')[0];
  const part = clean.split('/').pop() || '';
  const ext = part.includes('.') ? part.split('.').pop() : '';
  if (!ext) return 'file';
  const safe = ext.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!safe || safe.length > 5) return 'file';
  return safe;
}

export default function CertificateHolders() {
  const toast = useToast();
  const [holders, setHolders] = useState<CertificateHolder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HolderDetailsResponse | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchHolders = async (query: string) => {
    try {
      setLoading(true);
      const qs = query ? `?search=${encodeURIComponent(query)}` : '';
      const response = await api.get(`/admin/certificates/holders${qs}`);
      setHolders(response.data || []);
    } catch (error) {
      console.error('Error fetching certificate holders:', error);
      setHolders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolders('');
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchHolders(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const openDetails = async (userId: number) => {
    try {
      setDetailsLoading(true);
      const response = await api.get(`/admin/certificates/holders/${userId}`);
      setSelected(response.data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching holder details:', error);
      toast.error("Ma'lumotlarni olishda xatolik yuz berdi");
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelected(null);
  };

  const totalCertificates = useMemo(() => {
    return holders.reduce((sum, h) => sum + (h.certificatesCount || 0), 0);
  }, [holders]);

  const handleExport = async () => {
    try {
      await downloadFromApi('/admin/certificates/export', 'certificates.csv', 'text/csv;charset=utf-8');
    } catch (error) {
      console.error('Export certificates failed:', error);
      toast.error('Export qilishda xatolik yuz berdi');
    }
  };

  if (loading) {
    return <div className="page-container"><p>Yuklanmoqda...</p></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><FaUserCheck /> Sertifikat olganlar</h1>
          <p>Foydalanuvchilar va ularning sertifikatlari ({holders.length} ta foydalanuvchi, {totalCertificates} ta sertifikat)</p>
        </div>
        <button className="btn-secondary" onClick={handleExport} disabled={holders.length === 0}>
          <FaDownload /> Excelga yuklash
        </button>
      </div>

      <div className="page-toolbar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Ism, email yoki telefon bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="holders-grid">
        {holders.map((h) => (
          <button
            key={h.userId}
            type="button"
            className="holder-card"
            onClick={() => openDetails(h.userId)}
            disabled={detailsLoading}
            title="Batafsil ko'rish"
          >
            <div className="holder-avatar">
              <span>{getInitial(h.fullName, h.email)}</span>
            </div>
            <div className="holder-main">
              <div className="holder-title-row">
                <div className="holder-name">{h.fullName || 'Nomaʼlum foydalanuvchi'}</div>
                <span className="holder-chip">
                  <FaCertificate /> {h.certificatesCount || 0}
                </span>
              </div>
              <div className="holder-sub">{h.email || '-'}</div>
              <div className="holder-sub">{h.phone || '-'}</div>
              <div className="holder-meta">
                <span className="meta-label">So'nggi sertifikat:</span>
                <span className="meta-value">{formatDateTime(h.lastIssuedAt)}</span>
              </div>
            </div>
          </button>
        ))}

        {holders.length === 0 && (
          <div className="no-data-card">
            <p>Sertifikat olgan foydalanuvchilar topilmadi</p>
          </div>
        )}
      </div>

      {isModalOpen && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sertifikatlar</h2>
              <button className="close-btn" onClick={closeModal}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <div className="holder-details-header">
                <div className="holder-details-avatar">
                  <span>{getInitial(selected.user?.fullName, selected.user?.email)}</span>
                </div>
                <div className="holder-details-info">
                  <h3>{selected.user?.fullName || '-'}</h3>
                  <p>{selected.user?.email || '-'}</p>
                  {selected.user?.phone && <p>{selected.user.phone}</p>}
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Kurs</th>
                      <th>Berilgan sana</th>
                      <th>Fayl</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.certificates || []).map((cert) => (
                      <tr key={cert.id}>
                        <td>{cert.courseTitle || `Course #${cert.courseId}`}</td>
                        <td>{formatDateTime(cert.issuedAt)}</td>
                        <td>
                          <div className="cert-actions">
                            <button
                              type="button"
                              className="btn-icon btn-view"
                              title="Preview"
                              onClick={() => window.open(cert.fileUrl, '_blank', 'noopener,noreferrer')}
                            >
                              <FaExternalLinkAlt />
                            </button>
                            <button
                              type="button"
                              className="btn-icon btn-edit"
                              title="Yuklab olish"
                              onClick={async () => {
                                try {
                                  const ext = inferExtension(cert.fileUrl);
                                  const filename = `certificate_${selected.user.id}_${cert.courseId}_${cert.id}.${ext}`;
                                  await downloadPublicFile(cert.fileUrl, filename);
                                } catch (e) {
                                  console.error('Certificate download failed:', e);
                                  toast.error('Faylni yuklab olishda xatolik yuz berdi');
                                }
                              }}
                            >
                              <FaDownload />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(selected.certificates || []).length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', color: '#8b92a7', padding: '24px' }}>
                          Sertifikatlar topilmadi
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

