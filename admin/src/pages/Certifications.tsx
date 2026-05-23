import { useState, useEffect, useRef } from 'react';
import { FaCertificate, FaSearch, FaChevronLeft, FaUpload, FaTimes, FaCheckCircle, FaFileDownload, FaEye } from 'react-icons/fa';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import './Certifications.css';

interface Course {
  id: number;
  title: string;
  imageUrl: string;
}

interface UserDetail {
  id: number;
  fullName: string;
  email: string;
  phone: string;
}

interface EnrollmentResponse {
  id: number;
  userId: number;
  status: string;
  enrolledAt: string;
  user: UserDetail;
}

interface Certificate {
  id: number;
  userId: number;
  courseId: number;
  fileUrl: string;
  issuedAt: string;
}

export default function Certifications() {
  const toast = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [graduates, setGraduates] = useState<EnrollmentResponse[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Upload modal state
  const [uploadUser, setUploadUser] = useState<UserDetail | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const uploadingRef = useRef(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const getPublicFileUrl = (fileUrl?: string) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    const clean = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    return `${window.location.origin}${clean}`;
  };

  const formatIssuedAt = (issuedAt?: string) => {
    if (!issuedAt) return '';
    try {
      return new Date(issuedAt).toLocaleString('uz-UZ');
    } catch {
      return issuedAt;
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get('/admin/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseData = async (courseId: number) => {
    try {
      setLoading(true);
      const [gradsRes, certsRes] = await Promise.all([
        api.get(`/admin/courses/${courseId}/students?status=COMPLETED`),
        api.get(`/admin/courses/${courseId}/certificates`)
      ]);
      setGraduates(gradsRes.data);
      setCertificates(certsRes.data);
    } catch (error) {
      console.error('Error fetching graduates data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setSearchTerm('');
    fetchCourseData(course.id);
  };

  const handleBack = () => {
    setSelectedCourse(null);
    setGraduates([]);
    setCertificates([]);
    setSearchTerm('');
  };

  const handleOpenUpload = (user: UserDetail) => {
    setUploadUser(user);
    setFile(null);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !uploadUser || !selectedCourse) return;
    if (uploadingRef.current) return;
    uploadingRef.current = true;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('userId', uploadUser.id.toString());
      formData.append('courseId', selectedCourse.id.toString());
      formData.append('file', file);

      const response = await api.post('/admin/certificates/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update certificates list (upsert in UI)
      setCertificates(prev => {
        const next = prev.filter(c => !(c.userId === response.data.userId && c.courseId === response.data.courseId));
        return [...next, response.data];
      });
      setUploadUser(null);
      setFile(null);
      toast.success('Sertifikat muvaffaqiyatli yuklandi!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Sertifikat yuklashda xatolik yuz berdi');
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  };

  const filteredGraduates = graduates.filter(g => 
    g.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const issuedCount = filteredGraduates.filter(g => 
    certificates.some(c => c.userId === g.userId && (selectedCourse ? c.courseId === selectedCourse.id : true))
  ).length;

  if (loading && !selectedCourse && courses.length === 0) {
    return <div className="page-container"><p>Yuklanmoqda...</p></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><FaCertificate /> Sertifikatlash</h1>
          <p>Bitirgan o'quvchilarga sertifikat berish</p>
        </div>
      </div>

      {!selectedCourse ? (
        <div className="courses-grid">
          {courses.map(course => (
            <div key={course.id} className="course-card" onClick={() => handleCourseClick(course)}>
              <div className="course-image">
                <img src={course.imageUrl || '/default-image.svg'} alt={course.title} onError={(e) => {
                  e.currentTarget.src = '/default-image.svg';
                }}/>
              </div>
              <div className="course-content">
                <h3>{course.title}</h3>
                <p>Sertifikatlarni ko'rish <FaSearch style={{marginLeft: 5, fontSize: 12}}/></p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="students-view">
          <button className="btn-back" onClick={handleBack}><FaChevronLeft /> Ortga</button>

          <div className="course-banner">
            <div className="course-banner-main">
              <div className="course-banner-image">
                <img
                  src={selectedCourse.imageUrl || '/default-image.svg'}
                  alt={selectedCourse.title}
                  onError={(e) => {
                    e.currentTarget.src = '/default-image.svg';
                  }}
                />
              </div>
              <div className="course-banner-text">
                <h2>{selectedCourse.title}</h2>
                <p>Bitirgan o‘quvchilar va sertifikat berish jarayoni</p>
              </div>
            </div>

            <div className="course-banner-stats">
              <div className="stat-chip">
                <span className="stat-label">Bitiruvchilar</span>
                <span className="stat-value">{filteredGraduates.length}</span>
              </div>
              <div className="stat-chip">
                <span className="stat-label">Sertifikat berilgan</span>
                <span className="stat-value">{issuedCount}</span>
              </div>
            </div>
          </div>
          
          <div className="students-header">
            <h3 className="section-title">Bitiruvchilar ro‘yxati</h3>
          </div>

          <div className="page-toolbar">
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Ism yoki email bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
             <p>Yuklanmoqda...</p>
          ) : (
            <div className="certificates-list">
              {filteredGraduates.length === 0 && <p className="no-data">Ushbu kursda hozircha bitiruvchilar yo'q.</p>}
              {filteredGraduates.map(grad => {
                const cert = certificates.find(c => c.userId === grad.userId && (selectedCourse ? c.courseId === selectedCourse.id : true));
                const fileHref = cert?.fileUrl ? getPublicFileUrl(cert.fileUrl) : '';
                
                return (
                  <div key={grad.id} className="certificate-item">
                    <div className="cert-user-info">
                      <div className="cert-avatar">
                        {grad.user?.fullName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3>{grad.user?.fullName || 'Noma\'lum'}</h3>
                        <p>{grad.user?.email || '-'}</p>
                        {grad.user?.phone && <p className="cert-sub">{grad.user.phone}</p>}
                      </div>
                    </div>
                    
                    <div className="cert-action">
                      {cert ? (
                        <div className="cert-issued">
                          <div className="cert-issued-left">
                            <span className="success-text"><FaCheckCircle /> Berilgan</span>
                            {cert.issuedAt && (
                              <span className="issued-date">{formatIssuedAt(cert.issuedAt)}</span>
                            )}
                          </div>
                          <div className="cert-issued-actions">
                            <a
                              href={fileHref}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-icon btn-icon-view"
                              title="Ko‘rish"
                            >
                              <FaEye />
                            </a>
                            <a
                              href={fileHref}
                              className="btn-icon btn-icon-download"
                              title="Yuklab olish"
                              download
                              target="_blank"
                              rel="noreferrer"
                            >
                              <FaFileDownload />
                            </a>
                            <button className="btn-secondary btn-sm" onClick={() => handleOpenUpload(grad.user)}>
                              <FaUpload /> Qayta yuklash
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn-primary" onClick={() => handleOpenUpload(grad.user)}>
                          <FaUpload style={{marginRight: '0.5rem'}}/> Sertifikat berish
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {uploadUser && (
        <div className="modal-overlay" onClick={() => !uploading && setUploadUser(null)}>
          <div className="modal-content file-upload-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sertifikat yuklash</h2>
              {!uploading && <button className="close-btn" onClick={() => setUploadUser(null)}><FaTimes /></button>}
            </div>
            <form onSubmit={handleUploadSubmit} className="modal-body">
              <div className="form-group">
                <label>O'quvchi</label>
                <input type="text" value={uploadUser.fullName || uploadUser.email} disabled className="disabled-input" />
              </div>
              
              <div className="form-group">
                 <label>Fayl (Rasm yoki PDF)</label>
                 <div className="file-drop-area">
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      required
                      onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                    <div className="file-info">
                      <FaUpload size={24} style={{color: 'var(--text-secondary)', marginBottom: '0.5rem'}}/>
                      <p>{file ? file.name : 'Faylni tanlang yoki shu yerga tashlang'}</p>
                    </div>
                 </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setUploadUser(null)} disabled={uploading}>Bekor qilish</button>
                <button type="submit" className="btn-primary" disabled={!file || uploading}>
                  {uploading ? 'Yuklanmoqda...' : 'Sertifikatni yuklash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
