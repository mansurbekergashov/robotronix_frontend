import api from './api';

export interface Profile {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  email: string;
  phone: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const profileService = {
  async getProfile(): Promise<Profile> {
    const response = await api.get('/profile');
    return response.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<Profile> {
    const response = await api.put('/profile', data);
    return response.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await api.post('/profile/change-password', data);
    return response.data;
  },

  async uploadAvatar(file: File): Promise<Profile> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  },

  async deleteAvatar(): Promise<{ message: string }> {
    const response = await api.delete('/profile/avatar');
    return response.data;
  }
};
