import { memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getFileUrl } from '../../utils';

const CourseCard = memo(({ course }) => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleEnroll = (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate(`/login?redirect=/courses/${course.id}`);
        } else {
            navigate(`/courses/${course.id}`);
        }
    };

    return (
        <div className="course-card" data-aos="fade-up">
            <div className="course-image">
                <img src={getFileUrl(course.imageUrl)} alt={course.title} />
                {course.ageGroup && (
                    <div className="course-badge">{course.ageGroup}</div>
                )}
            </div>
            <div className="course-content">
                <h3 className="course-title">{course.title}</h3>
                <p className="course-description">{course.description ? course.description.substring(0, 100) + '...' : ' '}</p>
                <div className="course-meta">
                    {course.duration && (
                        <span className="course-duration">
                            <i className="fas fa-clock"></i> {course.duration}
                        </span>
                    )}
                    <span className="course-price">
                        <i className="fas fa-tag"></i> {course.price ? parseFloat(course.price).toLocaleString() : '0'} so'm
                    </span>
                </div>
                <div className="course-actions">
                    <button onClick={handleEnroll} className="btn-primary btn-full">Yozilish</button>
                    <Link to={`/courses/${course.id}`} className="btn-outline btn-full">Batafsil</Link>
                </div>
            </div>
        </div>
    );
});

export default CourseCard;
