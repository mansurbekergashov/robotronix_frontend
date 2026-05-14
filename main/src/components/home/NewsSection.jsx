import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { getFileUrl } from '../../utils'
import '../../styles/news.css'

const filters = [
    { key: 'ALL', label: 'Barchasi' },
    { key: 'ANNOUNCEMENT', label: "E'lonlar" },
    { key: 'NEWS', label: 'Yangiliklar' },
]

const formatDate = (value) => {
    if (!value) return ''
    return new Date(value).toLocaleDateString('uz-UZ', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    })
}

const NewsSection = ({ preview = false }) => {
    const [items, setItems] = useState([])
    const [activeFilter, setActiveFilter] = useState('ALL')
    const [loading, setLoading] = useState(true)
    const [selectedItem, setSelectedItem] = useState(null)

    useEffect(() => {
        let mounted = true

        const fetchItems = async () => {
            try {
                const response = await api.get('/public/news', {
                    params: {
                        audience: 'MAIN_SITE',
                        limit: preview ? 6 : 24,
                    },
                })
                if (mounted) {
                    setItems(Array.isArray(response.data) ? response.data : [])
                }
            } catch (error) {
                if (mounted) {
                    setItems([])
                }
                console.error("Yangiliklarni yuklashda xatolik:", error)
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        fetchItems()
        return () => {
            mounted = false
        }
    }, [preview])

    const filteredItems = useMemo(() => {
        if (activeFilter === 'ALL') {
            return items
        }
        return items.filter((item) => item.type === activeFilter)
    }, [activeFilter, items])

    const visibleItems = preview ? filteredItems.slice(0, 3) : filteredItems

    return (
        <section id="news" className={`news-section ${preview ? 'is-preview' : 'is-page'}`}>
            <div className="container">
                <div className="section-header news-header" data-aos="fade-up">
                    <h2 className="section-title">E&apos;lonlar va yangiliklar</h2>
                    <p className="section-subtitle">
                        Robotronix markazidagi muhim yangiliklar, tadbirlar va foydali e&apos;lonlar bilan tanishing
                    </p>
                </div>

                <div className="news-toolbar" data-aos="fade-up">
                    <div className="news-filters">
                        {filters.map((filter) => (
                            <button
                                key={filter.key}
                                type="button"
                                className={`news-filter-btn ${activeFilter === filter.key ? 'active' : ''}`}
                                onClick={() => setActiveFilter(filter.key)}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                    {preview && (
                        <Link to="/news" className="btn-outline">
                            Barchasini ko&apos;rish
                        </Link>
                    )}
                </div>

                {loading ? (
                    <div className="news-empty-state" data-aos="fade-up">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Yangiliklar yuklanmoqda...</p>
                    </div>
                ) : visibleItems.length > 0 ? (
                    <div className="news-grid">
                        {visibleItems.map((item, index) => (
                            <article
                                key={item.id}
                                className="news-card"
                                data-aos="fade-up"
                                data-aos-delay={index * 100}
                                onClick={() => setSelectedItem(item)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="news-card-media">
                                    {item.imageUrl ? (
                                        <img src={getFileUrl(item.imageUrl)} alt={item.title} />
                                    ) : (
                                        <div className="news-card-placeholder">
                                            <i className={`fas ${item.type === 'ANNOUNCEMENT' ? 'fa-bullhorn' : 'fa-newspaper'}`}></i>
                                        </div>
                                    )}
                                    <div className="news-card-badges">
                                        <span className={`news-type-badge ${item.type === 'ANNOUNCEMENT' ? 'announcement' : 'news'}`}>
                                            {item.type === 'ANNOUNCEMENT' ? "E'lon" : 'Yangilik'}
                                        </span>
                                        {item.isPinned && <span className="news-pinned-badge">Muhim</span>}
                                    </div>
                                </div>

                                <div className="news-card-body">
                                    <div className="news-meta">
                                        <span>
                                            <i className="fas fa-calendar-alt"></i>
                                            {formatDate(item.publishedAt || item.createdAt)}
                                        </span>
                                        <span>
                                            <i className="fas fa-globe"></i>
                                            {item.audience === 'USER_PANEL'
                                                ? 'Panel'
                                                : item.audience === 'MAIN_SITE'
                                                    ? 'Sayt'
                                                    : 'Hamma uchun'}
                                        </span>
                                    </div>
                                    <h3>{item.title}</h3>
                                    <p>{item.summary || item.content}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="news-empty-state" data-aos="fade-up">
                        <i className="fas fa-bell-slash"></i>
                        <p>Hozircha bu bo&apos;limda ma&apos;lumot mavjud emas</p>
                    </div>
                )}

                {/* News Detail Modal */}
                {selectedItem && (
                    <div className="news-modal-overlay active" onClick={() => setSelectedItem(null)}>
                        <div className="news-modal-content" onClick={(e) => e.stopPropagation()}>
                            <button className="news-modal-close" onClick={() => setSelectedItem(null)}>
                                <i className="fas fa-times"></i>
                            </button>
                            
                            {selectedItem.imageUrl && (
                                <div className="news-modal-image">
                                    <img src={getFileUrl(selectedItem.imageUrl)} alt={selectedItem.title} />
                                </div>
                            )}
                            
                            <div className="news-modal-body">
                                <div className="news-modal-meta">
                                    <span className={`news-type-badge ${selectedItem.type === 'ANNOUNCEMENT' ? 'announcement' : 'news'}`}>
                                        <i className={`fas ${selectedItem.type === 'ANNOUNCEMENT' ? 'fa-bullhorn' : 'fa-newspaper'}`}></i>&nbsp;
                                        {selectedItem.type === 'ANNOUNCEMENT' ? "E'lon" : 'Yangilik'}
                                    </span>
                                    <span className="news-modal-date">
                                        <i className="fas fa-calendar-alt"></i>&nbsp;
                                        {formatDate(selectedItem.publishedAt || selectedItem.createdAt)}
                                    </span>
                                </div>
                                <h2 className="news-modal-title">{selectedItem.title}</h2>
                                {selectedItem.summary && (
                                    <p className="news-modal-summary">{selectedItem.summary}</p>
                                )}
                                <div className="news-modal-text">
                                    {selectedItem.content}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

export default NewsSection
