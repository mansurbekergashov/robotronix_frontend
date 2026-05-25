import { useState, useEffect, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBook, FaTimes, FaSave } from 'react-icons/fa';
import api, { generateIdempotencyKey } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import './Courses.css';

interface CourseData {
  id: number;
  title: string;
  description: string;
  price: number;
  duration: string;
  ageGroup: string;
  category: string;
  imageUrl: string;
  isOnline: boolean;
  telegramUrl?: string;
}

const initialCourse: Omit<CourseData, 'id'> = {
  title: '',
  description: '',
  price: 0,
  duration: '',
  ageGroup: '',
  category: '',
  imageUrl: '',
  isOnline: true,
  telegramUrl: ''
};


export default function Courses() {
  const toast = useToast();
  const confirm = useConfirm();
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);
  const [formData, setFormData] = useState<Omit<CourseData, 'id'> | CourseData>(initialCourse);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const formIdempotencyKey = useRef<string>('');

  useEffect(() => {
    fetchCourses();
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

  const handleDelete = async (id: number) => {
    if (!(await confirm({ message: "Kursni o'chirishni tasdiqlaysizmi?" }))) return;
    try {
      await api.delete(`/admin/courses/${id}`);
      setCourses(courses.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error("O'chirishda xatolik yuz berdi");
    }
  };

  const handleOpenModal = (course?: CourseData) => {
    formIdempotencyKey.current = generateIdempotencyKey();
    setImageFile(null);
    if (course) {
      setSelectedCourse(course);
      setFormData({ ...course });
    } else {
      setSelectedCourse(null);
      setFormData(initialCourse);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);

    // Basic validation
    if (!formData.title.trim()) {
      submittingRef.current = false;
      setIsSubmitting(false);
      toast.warning("Kurs nomi kiritilishi shart");
      return;
    }

    try {
      const data = new FormData();

      // Strip 'id' from formData before sending — backend gets id from the URL
      const { id: _id, ...coursePayload } = formData as CourseData;
      const courseBlob = new Blob([JSON.stringify(coursePayload)], { type: 'application/json' });
      data.append('course', courseBlob);

      if (imageFile) {
        data.append('image', imageFile);
      }

      if (selectedCourse) {
        await api.put(`/admin/courses/${selectedCourse.id}`, data, {
          headers: { 'X-Idempotency-Key': formIdempotencyKey.current }
        });
      } else {
        await api.post('/admin/courses', data, {
          headers: { 'X-Idempotency-Key': formIdempotencyKey.current }
        });
      }
      await fetchCourses();
      setIsModalOpen(false);
      setImageFile(null);
    } catch (error: any) {
      console.error('Error saving course:', error);
      if (error.response?.status === 409) {
        // Idempotency: backend already processed this exact request — treat as success
        await fetchCourses();
        setIsModalOpen(false);
        setImageFile(null);
        toast.success("Kurs muvaffaqiyatli saqlandi");
      } else {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || "Xatolik yuz berdi";
        toast.error(errorMsg);
      }
    } finally {
      submittingRef.current = false;
      setTimeout(() => setIsSubmitting(false), 500);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="page-container"><p>Yuklanmoqda...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><FaBook /> Kurslar</h1>
          <p>Barcha kurslarni boshqaring ({courses.length} ta)</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <FaPlus /> Yangi kurs
        </button>
      </div>

      <div className="page-toolbar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Kurslarni qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kurs nomi</th>
              <th>Narxi</th>
              <th>Davomiyligi</th>
              <th>Yosh guruhi</th>
              <th>Kategoriya</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.map((course) => (
              <tr key={course.id}>
                <td>
                  <div className="course-info" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={course.imageUrl || `/default-image.svg`}
                      alt={course.title}
                      style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}
                      onError={(e) => { (e.target as HTMLImageElement).src = `/default-image.svg`; }}
                    />
                    <strong>{course.title}</strong>
                  </div>
                </td>
                <td>{(course.price || 0).toLocaleString()} so'm</td>
                <td>{course.duration || '-'}</td>
                <td><span className="badge badge-info">{course.ageGroup || '-'}</span></td>
                <td>{course.category || '-'}</td>
                <td>
                  <span className={`status-tag ${course.isOnline ? 'online' : 'offline'}`}>
                    {course.isOnline ? 'Online' : 'Offline'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon btn-edit" onClick={() => handleOpenModal(course)}><FaEdit /></button>
                    <button className="btn-icon btn-delete" onClick={() => handleDelete(course.id)}><FaTrash /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCourses.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Kurslar topilmadi</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedCourse ? 'Kursni tahrirlash' : 'Yangi kurs qo\'shish'}</h2>
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
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = `/default-image.svg`; }}
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
                <label>Kurs nomi</label>
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
                  <label>Davomiyligi</label>
                  <input
                    type="text"
                    placeholder="Masalan: 3 oy"
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Yosh guruhi</label>
                  <input
                    type="text"
                    placeholder="Masalan: 7-15 yosh"
                    value={formData.ageGroup}
                    onChange={e => setFormData({ ...formData, ageGroup: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Kategoriya</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Tanlang...</option>
                    <option value="kids">Bolalar (Kids)</option>
                    <option value="teachers">O'qituvchilar (Teachers)</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Holati (Online/Oflayn)</label>
                  <select
                    value={String(formData.isOnline)}
                    onChange={e => setFormData({ ...formData, isOnline: e.target.value === 'true' })}
                  >
                    <option value="true">Online (Saytda ko'rinadi)</option>
                    <option value="false">Oflayn (Faqat markazda)</option>
                  </select>
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
              {formData.isOnline && (
                <div className="form-group slide-down">
                  <label>Telegram URL (Guruh yoki Kanal)</label>
                  <input
                    type="url"
                    placeholder="https://t.me/..."
                    value={formData.telegramUrl || ''}
                    onChange={e => setFormData({ ...formData, telegramUrl: e.target.value })}
                  />
                </div>
              )}
              <div className="form-group">
                <label>Rasm URL (ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                />
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
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Bekor qilish</button>
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
