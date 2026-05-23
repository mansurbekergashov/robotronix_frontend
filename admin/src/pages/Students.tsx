import { useState, useEffect, useRef } from 'react';
import { FaUserGraduate, FaSearch, FaChevronLeft, FaTimes, FaDownload } from 'react-icons/fa';
import api from '../services/api';
import { downloadFromApi } from '../utils/download';
import { useToast } from '../hooks/useToast';
import './Students.css';

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

export default function Students() {
  const toast = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'CONFIRMED' | 'COMPLETED'>('CONFIRMED');
  const expectedTabRef = useRef<string>('CONFIRMED');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<EnrollmentResponse | null>(null);

  const statusLabels: Record<string, string> = {
    PENDING: "Kutilmoqda",
    CONFIRMED: "O'qimoqda",
    COMPLETED: "Bitirgan",
    REJECTED: "Rad etilgan",
    CANCELLED: "Bekor qilingan",
  };

  const getStudentInitial = (student?: UserDetail) => {
    const name = student?.fullName?.trim();
    if (name) return name.charAt(0).toUpperCase();
    const email = student?.email?.trim();
    if (email) return email.charAt(0).toUpperCase();
    return '?';
  };

  useEffect(() => {
    fetchCourses();
  }, []);

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

  const fetchStudents = async (courseId: number, statusTab: string) => {
    expectedTabRef.current = statusTab;
    const thisTab = statusTab;
    try {
      setLoading(true);
      const response = await api.get(`/admin/courses/${courseId}/students?status=${statusTab}`);
      if (expectedTabRef.current === thisTab) {
        setEnrollments(response.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      if (expectedTabRef.current === thisTab) {
        setLoading(false);
      }
    }
  };

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setSearchTerm('');
    fetchStudents(course.id, tab);
  };

  const handleTabChange = (newTab: 'CONFIRMED' | 'COMPLETED') => {
    setTab(newTab);
    if (selectedCourse) {
      fetchStudents(selectedCourse.id, newTab);
    }
  };

  const handleBack = () => {
    setSelectedCourse(null);
    setEnrollments([]);
    setSearchTerm('');
  };

  const handleExport = async () => {
    if (!selectedCourse) return;
    try {
      const params = new URLSearchParams();
      params.set('status', tab);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      const endpoint = `/admin/courses/${selectedCourse.id}/students/export?${params.toString()}`;
      const filename = `students_course_${selectedCourse.id}_${tab}.csv`;
      await downloadFromApi(endpoint, filename, 'text/csv;charset=utf-8');
    } catch (error) {
      console.error('Export students failed:', error);
      toast.error('Export qilishda xatolik yuz berdi');
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      setLoading(true);
      await api.put(`/admin/enrollments/${id}/status`, { status });
      // Remove from current list or update status
      setEnrollments(prev => prev.filter(e => e.id !== id));
      setSelectedStudent(null);
      toast.success("O'quvchi holati muvaffaqiyatli yangilandi!");
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Holatni yangilashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const filteredEnrollments = enrollments.filter(e => 
    e.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !selectedCourse && courses.length === 0) {
    return <div className="page-container"><p>Yuklanmoqda...</p></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><FaUserGraduate /> O'quvchilar</h1>
          <p>Kurslardagi o'quvchilarni boshqarish</p>
        </div>
        <button className="btn-secondary" onClick={handleExport} disabled={!selectedCourse || enrollments.length === 0}>
          <FaDownload /> Excelga yuklash
        </button>
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
                <p>O'quvchilarni ko'rish <FaSearch style={{marginLeft: 5, fontSize: 12}}/></p>
              </div>
            </div>
          ))}
          {courses.length === 0 && <p className="no-data">Kurslar topilmadi.</p>}
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
                <p>
                  {tab === 'CONFIRMED'
                    ? "O‘qib turgan o‘quvchilar ro‘yxati"
                    : "Kursni tugatgan (bitirgan) o‘quvchilar ro‘yxati"}
                </p>
              </div>
            </div>

            <div className="course-banner-stats">
              <div className="stat-chip">
                <span className="stat-label">Jami</span>
                <span className="stat-value">{enrollments.length}</span>
              </div>
              <div className="stat-chip">
                <span className="stat-label">Ko‘rsatilmoqda</span>
                <span className="stat-value">{filteredEnrollments.length}</span>
              </div>
            </div>
          </div>
          
          <div className="students-header">
            <h3 className="section-title">Holat bo‘yicha</h3>
            
            <div className="tabs">
              <button 
                className={`tab ${tab === 'CONFIRMED' ? 'active' : ''}`}
                onClick={() => handleTabChange('CONFIRMED')}
              >
                O'qib turganlar
              </button>
              <button 
                className={`tab ${tab === 'COMPLETED' ? 'active' : ''}`}
                onClick={() => handleTabChange('COMPLETED')}
              >
                Bitirganlar
              </button>
            </div>
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
             <div className="loading-state">Yuklanmoqda...</div>
          ) : (
            <div className="students-grid">
              {filteredEnrollments.map(enrollment => (
                <div key={enrollment.id} className="student-card" onClick={() => setSelectedStudent(enrollment)}>
                  <div className="student-avatar">
                    {getStudentInitial(enrollment.user)}
                  </div>
                  <div className="student-info">
                    <div className="student-title-row">
                      <h3>{enrollment.user?.fullName || 'Ism kiritilmagan'}</h3>
                      <span className={`status-badge status-${String(enrollment.status || tab).toLowerCase()}`}>
                        {statusLabels[enrollment.status] || enrollment.status || '-'}
                      </span>
                    </div>
                    <p className="student-sub">{enrollment.user?.email || '-'}</p>
                    {enrollment.user?.phone && (
                      <p className="student-sub">{enrollment.user.phone}</p>
                    )}
                  </div>
                </div>
              ))}
              {filteredEnrollments.length === 0 && <p className="no-data">Ma'lumot topilmadi.</p>}
            </div>
          )}
        </div>
      )}

      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content student-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>O'quvchi ma'lumotlari</h2>
              <button className="close-btn" onClick={() => setSelectedStudent(null)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <div className="student-detail-row">
                <strong>Ism:</strong> <span>{selectedStudent.user?.fullName || '-'}</span>
              </div>
              <div className="student-detail-row">
                <strong>Email:</strong> <span>{selectedStudent.user?.email || '-'}</span>
              </div>
              <div className="student-detail-row">
                <strong>Telefon:</strong> <span>{selectedStudent.user?.phone || '-'}</span>
              </div>
              <div className="student-detail-row">
                <strong>Boshlagan sanasi:</strong> 
                <span>{selectedStudent.enrolledAt ? new Date(selectedStudent.enrolledAt).toLocaleString() : '-'}</span>
              </div>
              <div className="student-detail-row">
                <strong>Holati:</strong> 
                <span className={`status-badge status-${selectedStudent.status.toLowerCase()}`}>
                  {statusLabels[selectedStudent.status] || selectedStudent.status}
                </span>
              </div>
              
              {selectedStudent.status !== 'COMPLETED' && (
                <div className="modal-footer" style={{marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee'}}>
                  <button 
                    className="btn-primary" 
                    onClick={() => handleStatusUpdate(selectedStudent.id, 'COMPLETED')}
                    disabled={loading}
                  >
                    Kursni tugatdi (Bitirdi)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
