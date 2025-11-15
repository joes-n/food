import api from './api';

export const uploadService = {
  async uploadImage(file: File, restaurantId: string): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('restaurantId', restaurantId);

    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      return {
        url: response.data.data.url,
        filename: response.data.data.filename,
      };
    } else {
      throw new Error(response.data.error || 'Upload failed');
    }
  },
};