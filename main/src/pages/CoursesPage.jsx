import { useState, useEffect } from 'react';
import api from '../services/api';
import CourseCard from '../components/courses/CourseCard';

const CoursesPage = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('kids');

    const fetchCourses = async () => {
        try {
            const response = await api.get('/courses');
            const data = Array.isArray(response.data) ? response.data : [];
            setCourses(data);
        } catch (error) {
            console.error('Error fetching courses:', error);
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') fetchCourses();
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);

    const filteredCourses = Array.isArray(courses) ? courses.filter(course => course.category === activeTab) : [];

    if (loading) return <div className="loading">Yuklanmoqda...</div>;

    return (
        <section className="courses-page courses">
            <div className="container">
                <div className="section-header" data-aos="fade-up">
                    <h2 className="section-title">O'quv kurslarimiz</h2>
                    <p className="section-subtitle">Kelajak texnologiyalarini biz bilan o'rganing</p>
                </div>

                <div className="course-tabs" data-aos="fade-up" data-aos-delay="100">
                    <button
                        className={`tab-btn ${activeTab === 'kids' ? 'active' : ''}`}
                        onClick={() => setActiveTab('kids')}
                    >
                        <i className="fas fa-child"></i> Bolalar uchun
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('teachers')}
                    >
                        <i className="fas fa-chalkboard-teacher"></i> O'qituvchilar uchun
                    </button>
                </div>

                <div className="courses-content">
                    <div className="courses-grid">
                        {filteredCourses.length > 0 ? (
                            filteredCourses.map((course, index) => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    data-aos="fade-up"
                                    data-aos-delay={(index + 1) * 100}
                                />
                            ))
                        ) : (
                            <div className="empty-state" data-aos="fade-up">
                                <i className="fas fa-book-open"></i>
                                <p>Bu bo'limda hozircha kurslar mavjud emas.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CoursesPage;
