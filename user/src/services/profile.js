// Profile Service
import { API_BASE_URL } from '../config.js';

export class ProfileService {
    async getProfile() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Profil ma\'lumotlarini olishda xatolik');
        }

        return await response.json();
    }

    async updateProfile(data) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Profilni yangilashda xatolik');
        }

        return await response.json();
    }

    async changePassword(data) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/profile/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Parolni o\'zgartirishda xatolik');
        }

        return await response.json();
    }

    async uploadAvatar(file) {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/api/profile/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Avatar yuklashda xatolik');
        }

        return await response.json();
    }

    async deleteAvatar() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/profile/avatar`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Avatar o\'chirishda xatolik');
        }

        return await response.json();
    }
}
