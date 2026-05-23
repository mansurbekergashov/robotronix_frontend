import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS  = 900000; // 15 daqiqa

const CourseDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [course, setCourse]             = useState(null);
    const [loading, setLoading]           = useState(true);
    const [isEnrolling, setIsEnrolling]   = useState(false);
    const [paymentState, setPaymentState] = useState(null); // null | 'waiting' | 'confirmed' | 'timeout'
    const [paymentUrl, setPaymentUrl]     = useState(null);
    const [enrollId, setEnrollId]         = useState(null);
    const pollingRef    = useRef(null);
    const pollTimeoutRef = useRef(null);

    const stopPolling = () => {
        if (pollingRef.current)    { clearInterval(pollingRef.current);  pollingRef.current    = null; }
        if (pollTimeoutRef.current){ clearTimeout(pollTimeoutRef.current); pollTimeoutRef.current = null; }
    };

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await api.get(`/courses/${id}`);
                setCourse(res.data);
            } catch {
                navigate('/courses');
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
        return () => stopPolling();
    }, [id, navigate]);

    const startPolling = (eid) => {
        stopPolling();
        pollingRef.current = setInterval(async () => {
            try {
                const res = await api.get('/courses/my-enrollments');
                const enr = (res.data || []).find(e => e.id === eid);
                if (enr?.paymentConfirmed) {
                    stopPolling();
                    setPaymentState('confirmed');
                }
            } catch (_) {}
        }, POLL_INTERVAL_MS);

        pollTimeoutRef.current = setTimeout(() => {
            stopPolling();
            setPaymentState(prev => prev === 'waiting' ? 'timeout' : prev);
        }, POLL_TIMEOUT_MS);
    };

    const handleEnroll = async () => {
        if (!isAuthenticated) {
            navigate(`/login?redirect=/courses/${id}`);
            return;
        }
        setIsEnrolling(true);
        try {
            const res = await api.post(`/courses/${id}/enroll`, { paymentMethod: 'PAYME' });
            const { id: eid, paymentUrl: url } = res.data;

            setEnrollId(eid);
            setPaymentUrl(url);
            setPaymentState('waiting');
            window.open(url, '_blank');
            startPolling(eid);
        } catch (error) {
            alert('Kursga yozilishda xatolik: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsEnrolling(false);
        }
    };

    if (loading) return <div className="loading">Yuklanmoqda...</div>;
    if (!course)  return <div className="error">Kurs topilmadi</div>;

    // ─── To'lov kutilmoqda holati ─────────────────────────────────────────────

    if (paymentState === 'waiting') {
        return (
            <div className="course-detail-container">
                <div className="course-header">
                    <div className="container">
                        <nav className="breadcrumb">
                            <Link to="/courses">Kurslar</Link> › {course.title}
                        </nav>
                    </div>
                </div>
                <div className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '20px' }}>💳</div>
                    <h2>Payme to'lov oynasi ochildi</h2>
                    <p style={{ color: '#6b7280', marginBottom: '12px' }}>
                        Yangi tabda Payme sahifasini ko'ring va to'lovni amalga oshiring.
                    </p>
                    <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                        To'lov tasdiqlangandan so'ng bu sahifa avtomatik yangilanadi...
                    </p>
                    <div style={{
                        width: '40px', height: '40px',
                        border: '4px solid #e5e7eb', borderTopColor: '#33cccc',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 24px'
                    }} />
                    <button
                        className="btn-primary"
                        onClick={() => window.open(paymentUrl, '_blank')}
                        style={{ marginRight: '12px' }}
                    >
                        Payme sahifasini qayta ochish
                    </button>
                    <button
                        onClick={() => { stopPolling(); setPaymentState(null); }}
                        style={{ background: '#374151', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        Bekor qilish
                    </button>
                </div>
            </div>
        );
    }

    if (paymentState === 'confirmed') {
        return (
            <div className="course-detail-container">
                <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
                    <div style={{ fontSize: '4rem', color: '#10b981', marginBottom: '20px' }}>✅</div>
                    <h2>To'lov muvaffaqiyatli amalga oshirildi!</h2>
                    <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                        Kursga yozildingiz. Tez orada operatorlarimiz siz bilan bog'lanadi.
                    </p>
                    <Link to="/courses" className="btn-primary">Kurslarga qaytish</Link>
                </div>
            </div>
        );
    }

    if (paymentState === 'timeout') {
        return (
            <div className="course-detail-container">
                <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏰</div>
                    <h2>To'lov vaqti tugadi</h2>
                    <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                        15 daqiqa ichida to'lov tasdiqlanmadi. Qaytadan urinib ko'ring.
                    </p>
                    <button
                        className="btn-primary"
                        onClick={() => { setPaymentState(null); setEnrollId(null); setPaymentUrl(null); }}
                    >
                        Qaytadan yozilish
                    </button>
                </div>
            </div>
        );
    }

    // ─── Asosiy kurs sahifasi ─────────────────────────────────────────────────

    return (
        <div className="course-detail-container">
            <div
                className="course-header"
                style={{ backgroundImage: `url(${course.imageUrl || '/assets/images/placeholder.svg'})` }}
                data-aos="fade-down"
            >
                <div className="container">
                    <nav className="breadcrumb" data-aos="fade-right" data-aos-delay="200">
                        <Link to="/courses">Kurslar</Link>{' '}
                        <i className="fas fa-chevron-right" style={{ fontSize: '10px', margin: '0 8px' }} />{' '}
                        {course.title}
                    </nav>
                    <h1 data-aos="fade-up" data-aos-delay="300">{course.title}</h1>
                    <div className="course-badges" data-aos="fade-up" data-aos-delay="400">
                        <span className="badge"><i className="fas fa-layer-group" /> {course.category}</span>
                        <span className="badge"><i className="fas fa-clock" /> {course.duration}</span>
                    </div>
                </div>
            </div>

            <div className="course-content-grid container">
                <main className="course-main" data-aos="fade-right" data-aos-delay="500">
                    <div className="section-title-wrap">
                        <h2><i className="fas fa-info-circle" /> Kurs haqida</h2>
                    </div>
                    <p className="description">{course.description}</p>

                    {course.syllabus && (
                        <div className="syllabus" data-aos="fade-up">
                            <h3><i className="fas fa-list-ul" /> Kurs dasturi</h3>
                            <pre>{course.syllabus}</pre>
                        </div>
                    )}
                </main>

                <aside className="course-sidebar" data-aos="fade-left" data-aos-delay="500">
                    <div className="enrollment-card">
                        <div className="price-label">Kurs narxi:</div>
                        <div className="price">{course.price?.toLocaleString() || '0'} so'm</div>

                        {/* Payme to'lov info */}
                        <div style={{
                            background: 'rgba(16,185,129,.1)',
                            border: '1px solid rgba(16,185,129,.3)',
                            borderRadius: '8px',
                            padding: '12px',
                            marginTop: '12px',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <span style={{ fontSize: '1.4rem' }}>💳</span>
                            <div>
                                <div style={{ fontWeight: 600, color: '#10b981', fontSize: '14px' }}>
                                    Payme orqali to'lov
                                </div>
                                <div style={{ fontSize: '12px', color: '#6ee7b7' }}>
                                    Yozilgandan so'ng Payme sahifasi ochiladi
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleEnroll}
                            className="btn-primary btn-large btn-full"
                            disabled={isEnrolling}
                        >
                            {isEnrolling ? (
                                <><i className="fas fa-spinner fa-spin" /> Yozilmoqda...</>
                            ) : (
                                <><i className="fas fa-user-plus" /> Kursga yozilish</>
                            )}
                        </button>

                        <ul className="course-features">
                            <li><i className="fas fa-certificate" /> Sertifikat beriladi</li>
                            <li><i className="fas fa-laptop-code" /> Amaliy loyihalar</li>
                            <li><i className="fas fa-headset" /> Mentor yordami</li>
                            <li><i className="fas fa-infinity" /> Umrbod kirish</li>
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CourseDetailPage;
