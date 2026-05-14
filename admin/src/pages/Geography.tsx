import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaChevronRight, FaMapMarkerAlt, FaBuilding, FaCity } from 'react-icons/fa';
import api from '../services/api';
import './Geography.css';

interface PostLocation {
    id: number;
    region: string;
    district: string;
    branchName: string;
    address: string;
    postIndex: string;
}

export default function Geography() {
    const [locations, setLocations] = useState<PostLocation[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Selection state for the hierarchy
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'region' | 'district' | 'location'>('region');
    const [editingLocation, setEditingLocation] = useState<PostLocation | null>(null);
    
    const [formData, setFormData] = useState({
        region: '',
        district: '',
        branchName: '',
        address: '',
        postIndex: ''
    });

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/geography');
            setLocations(response.data || []);
        } catch (error) {
            console.error('Error fetching locations:', error);
            alert('Manzillarni yuklashda xatolik! Backend ishlayotganiga ishonch hosil qiling.');
        } finally {
            setLoading(false);
        }
    };

    // Derived data for columns
    const regions = Array.from(new Set(locations.map(loc => loc.region))).sort();
    
    const districtsForRegion = selectedRegion 
        ? Array.from(new Set(locations.filter(loc => loc.region === selectedRegion).map(loc => loc.district))).sort() 
        : [];
        
    const locationsForDistrict = (selectedRegion && selectedDistrict)
        ? locations.filter(loc => loc.region === selectedRegion && loc.district === selectedDistrict).sort((a,b) => (a.branchName||'').localeCompare(b.branchName||''))
        : [];

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingLocation) {
                await api.put(`/admin/geography/${editingLocation.id}`, formData);
            } else {
                await api.post('/admin/geography', formData);
            }
            setIsModalOpen(false);
            fetchLocations();
        } catch (error) {
            console.error('Error saving location:', error);
            alert('Saqlashda xatolik yuz berdi!');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Rostdan ham bu manzilni o'chirmoqchimisiz?")) {
            try {
                await api.delete(`/admin/geography/${id}`);
                fetchLocations();
            } catch (error) {
                console.error('Error deleting location:', error);
                alert("O'chirishda xatolik!");
            }
        }
    };

    const handleDeleteDistrict = async (district: string) => {
        if (window.confirm(`Rostdan ham "${district}" tumanini va uning ichidagi barcha pochta manzillarini o'chirmoqchimisiz?`)) {
            const locsToDelete = locations.filter(loc => loc.region === selectedRegion && loc.district === district);
            for (const loc of locsToDelete) {
                await api.delete(`/admin/geography/${loc.id}`);
            }
            if (selectedDistrict === district) setSelectedDistrict(null);
            fetchLocations();
        }
    };

    const handleDeleteRegion = async (region: string) => {
        if (window.confirm(`Rostdan ham "${region}" ni va uning ichidagi barcha ma'lumotlarni o'chirmoqchimisiz?`)) {
            const locsToDelete = locations.filter(loc => loc.region === region);
            for (const loc of locsToDelete) {
                await api.delete(`/admin/geography/${loc.id}`);
            }
            if (selectedRegion === region) {
                setSelectedRegion(null);
                setSelectedDistrict(null);
            }
            fetchLocations();
        }
    };

    const openAddModal = (type: 'region' | 'district' | 'location') => {
        setModalType(type);
        setEditingLocation(null);
        
        // Pre-fill based on hierarchy
        setFormData({
            region: type === 'region' ? '' : (selectedRegion || ''),
            district: (type === 'region' || type === 'district') ? '' : (selectedDistrict || ''),
            branchName: type === 'location' ? '' : 'Yangi hudud',
            address: type === 'location' ? '' : 'Manzil kiritilmagan',
            postIndex: type === 'location' ? '' : '000000'
        });
        setIsModalOpen(true);
    };

    const openEditModal = (loc: PostLocation) => {
        setModalType('location');
        setEditingLocation(loc);
        setFormData({
            region: loc.region,
            district: loc.district,
            branchName: loc.branchName || '',
            address: loc.address || '',
            postIndex: loc.postIndex || ''
        });
        setIsModalOpen(true);
    };

    if (loading) {
        return <div className="geography-page"><div className="loading">Yuklanmoqda...</div></div>;
    }

    return (
        <div className="geography-page">
            <div className="page-header">
                <h2><FaMapMarkerAlt /> Pochta Manzillari (Daraxtsimon)</h2>
            </div>

            <div className="geo-tree-container">
                {/* COLUMN 1: VILOYATLAR */}
                <div className="geo-column">
                    <div className="geo-col-header">
                        <h3><FaCity /> Viloyatlar</h3>
                        <button className="btn-icon-add" onClick={() => openAddModal('region')} title="Yangi viloyat qo'shish"><FaPlus /></button>
                    </div>
                    <div className="geo-list">
                        {regions.length === 0 && <div className="empty-state">Viloyatlar yo'q</div>}
                        {regions.map(region => (
                            <div 
                                key={region} 
                                className={`geo-list-item ${selectedRegion === region ? 'active' : ''}`}
                                onClick={() => { setSelectedRegion(region); setSelectedDistrict(null); }}
                            >
                                <span className="item-name">{region}</span>
                                <div className="item-actions">
                                    <button className="btn-icon delete" onClick={(e) => { e.stopPropagation(); handleDeleteRegion(region); }}><FaTrash /></button>
                                    <FaChevronRight className="chevron" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COLUMN 2: TUMANLAR */}
                <div className="geo-column">
                    <div className="geo-col-header">
                        <h3><FaBuilding /> Tuman / Shahar</h3>
                        {selectedRegion && (
                            <button className="btn-icon-add" onClick={() => openAddModal('district')} title="Yangi tuman qo'shish"><FaPlus /></button>
                        )}
                    </div>
                    <div className="geo-list">
                        {!selectedRegion && <div className="empty-state">Viloyatni tanlang</div>}
                        {selectedRegion && districtsForRegion.length === 0 && <div className="empty-state">Tumanlar yo'q</div>}
                        {selectedRegion && districtsForRegion.map(district => (
                            <div 
                                key={district} 
                                className={`geo-list-item ${selectedDistrict === district ? 'active' : ''}`}
                                onClick={() => setSelectedDistrict(district)}
                            >
                                <span className="item-name">{district}</span>
                                <div className="item-actions">
                                    <button className="btn-icon delete" onClick={(e) => { e.stopPropagation(); handleDeleteDistrict(district); }}><FaTrash /></button>
                                    <FaChevronRight className="chevron" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COLUMN 3: POCHTA MANZILLARI */}
                <div className="geo-column wide">
                    <div className="geo-col-header">
                        <h3><FaMapMarkerAlt /> Pochta Filiallari (Aniq manzil)</h3>
                        {selectedDistrict && (
                            <button className="btn-icon-add" onClick={() => openAddModal('location')} title="Yangi pochta filiali qo'shish"><FaPlus /></button>
                        )}
                    </div>
                    <div className="geo-list">
                        {!selectedDistrict && <div className="empty-state">Tumanni tanlang</div>}
                        {selectedDistrict && locationsForDistrict.length === 0 && <div className="empty-state">Pochta filiallari yo'q</div>}
                        {selectedDistrict && locationsForDistrict.map(loc => (
                            <div key={loc.id} className="geo-location-card">
                                <div className="loc-info">
                                    <h4>{loc.branchName || 'Nomsiz filial'}</h4>
                                    <p className="loc-address">{loc.address}</p>
                                    <span className="badge badge-primary">Indeks: {loc.postIndex}</span>
                                </div>
                                <div className="loc-actions">
                                    <button className="btn-icon edit" onClick={() => openEditModal(loc)}><FaEdit /></button>
                                    <button className="btn-icon delete" onClick={() => handleDelete(loc.id)}><FaTrash /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content geography-modal">
                        <h3>
                            {modalType === 'region' ? 'Yangi Viloyat qo\'shish' : 
                             modalType === 'district' ? 'Yangi Tuman qo\'shish' : 
                             editingLocation ? 'Pochta manzilini tahrirlash' : 'Yangi Pochta manzilini qo\'shish'}
                        </h3>
                        <form onSubmit={handleSave}>
                            {/* Region is required for all */}
                            <div className="form-group">
                                <label>Viloyat / Respublika*</label>
                                <input 
                                    type="text" 
                                    required
                                    disabled={modalType !== 'region' && !!selectedRegion}
                                    value={formData.region}
                                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                                    placeholder="Masalan: Farg'ona vil."
                                />
                            </div>

                            {/* District is required for district and location */}
                            {(modalType === 'district' || modalType === 'location') && (
                                <div className="form-group">
                                    <label>Tuman / Shahar*</label>
                                    <input 
                                        type="text" 
                                        required
                                        disabled={modalType === 'location' && !!selectedDistrict}
                                        value={formData.district}
                                        onChange={(e) => setFormData({...formData, district: e.target.value})}
                                        placeholder="Masalan: Uchko'prik tumani"
                                    />
                                </div>
                            )}

                            {/* These are only for locations */}
                            {modalType === 'location' && (
                                <>
                                    <div className="form-group">
                                        <label>Pochta Bo'limi (Filial) nomi</label>
                                        <input 
                                            type="text" 
                                            value={formData.branchName}
                                            onChange={(e) => setFormData({...formData, branchName: e.target.value})}
                                            placeholder="Masalan: Uchko'prik TPAB"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Aniq manzil</label>
                                        <textarea 
                                            value={formData.address}
                                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                                            placeholder="Masalan: Navro'z shoh ko'chasi, 48-uy"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Pochta Indeksi (6 raqam)*</label>
                                        <input 
                                            type="text" 
                                            required
                                            pattern="\d{6}"
                                            title="6 xonali raqam bo'lishi kerak"
                                            value={formData.postIndex}
                                            onChange={(e) => setFormData({...formData, postIndex: e.target.value})}
                                            placeholder="Masalan: 151600"
                                        />
                                    </div>
                                </>
                            )}
                            
                            {/* If creating a region or district, we still need at least one dummy/empty postIndex to save it as a PostLocation, since we don't have separate Region/District tables */}
                            {modalType !== 'location' && (
                                <div style={{display: 'none'}}>
                                     <input type="text" value="000000" readOnly />
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                                    Bekor qilish
                                </button>
                                <button type="submit" className="btn-primary">
                                    Saqlash
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
