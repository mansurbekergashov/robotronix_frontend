import { useState } from 'react'
import useFetch from '../../hooks/useFetch'
import CourseCard from '../courses/CourseCard'

const Courses = () => {
    const [activeTab, setActiveTab] = useState('kids')
    const { data: courses, loading } = useFetch('/courses')

    const kidsCourses = (courses || []).filter(c => c.category === 'kids' || !c.category)
    const teacherCourses = (courses || []).filter(c => c.category === 'teachers')

    return (
        <section id="courses" className="courses">
            <div className="container">
                <div className="section-header" data-aos="fade-up">
                    <h2 className="section-title">Kurslarimiz</h2>
                    <p className="section-subtitle">
                        4 yoshdan boshlab barcha yoshdagilar uchun
                    </p>
                </div>

                <div className="course-tabs" data-aos="fade-up">
                    <button
                        className={`tab-btn ${activeTab === 'kids' ? 'active' : ''}`}
                        onClick={() => setActiveTab('kids')}
                    >
                        Bolalar uchun
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('teachers')}
                    >
                        O'qituvchilar uchun
                    </button>
                </div>

                <div className="courses-content">
                    {loading ? (
                        <div className="skeleton-grid">
                            {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
                        </div>
                    ) : (
                        <>
                            <div className={`tab-content ${activeTab === 'kids' ? 'active' : ''}`} id="kids">
                                <div className="courses-grid">
                                    {kidsCourses.length > 0 ? (
                                        kidsCourses.map((course, index) => (
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

                            <div className={`tab-content ${activeTab === 'teachers' ? 'active' : ''}`} id="teachers">
                                <div className="courses-grid">
                                    {teacherCourses.length > 0 ? (
                                        teacherCourses.map((course, index) => (
                                            <CourseCard
                                                key={course.id}
                                                course={course}
                                                data-aos="fade-up"
                                                data-aos-delay={(index + 1) * 100}
                                            />
                                        ))
                                    ) : (
                                        <div className="empty-state" data-aos="fade-up">
                                            <i className="fas fa-chalkboard-teacher"></i>
                                            <p>Bu bo'limda hozircha kurslar mavjud emas.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    )
}

export default Courses
