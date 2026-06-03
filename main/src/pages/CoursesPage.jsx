import { useState } from 'react';
import useFetch from '../hooks/useFetch';
import CourseCard from '../components/courses/CourseCard';

const CoursesPage = () => {
    const [activeTab, setActiveTab] = useState('all_courses');
    const { data: courses, loading } = useFetch('/courses');

    const filteredCourses = activeTab === 'all_courses'
        ? (courses || [])
        : (courses || []).filter(c => c.category === activeTab);

    return (
        <section className="courses-page courses">
            <div className="container">
                <div className="section-header" data-aos="fade-up">
                    <h2 className="section-title">O'quv kurslarimiz</h2>
                    <p className="section-subtitle">Kelajak texnologiyalarini biz bilan o'rganing</p>
                </div>

                <div className="course-tabs" data-aos="fade-up" data-aos-delay="100">
                    <button
                        className={`tab-btn ${activeTab === 'all_courses' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all_courses')}
                    >
                        <i className="fas fa-list"></i> Barcha kurslar
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        <i className="fas fa-users"></i> Barcha uchun
                    </button>
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
                        {loading ? (
                            [1, 2, 3].map(i => <div key={i} className="skeleton-card" />)
                        ) : filteredCourses.length > 0 ? (
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
