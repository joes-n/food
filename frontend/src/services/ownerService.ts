import api from './api';

export const ownerService = {
  // Get my restaurants
  async getMyRestaurants() {
    const response = await api.get('/restaurants/my/all');
    return response.data.data;
  },

  // Update restaurant
  async updateRestaurant(id: string, data: any) {
    const response = await api.put(`/restaurants/${id}`, data);
    return response.data;
  },

  // Get menu items for restaurant
  async getMenuItems(restaurantId: string, categoryId?: string) {
    const params = { restaurantId };
    if (categoryId) params.categoryId = categoryId;
    const response = await api.get('/menu-items', { params });
    return response.data;
  },

  // Create menu item
  async createMenuItem(data: any) {
    const response = await api.post('/menu-items', data);
    return response.data;
  },

  // Update menu item
  async updateMenuItem(id: string, data: any) {
    const response = await api.put(`/menu-items/${id}`, data);
    return response.data;
  },

  // Delete menu item
  async deleteMenuItem(id: string) {
    const response = await api.delete(`/menu-items/${id}`);
    return response.data;
  },

  // Get restaurant orders
  async getRestaurantOrders(restaurantId: string, status?: string) {
    const params = { restaurantId };
    if (status) params.status = status;
    const response = await api.get(`/orders/manage/restaurant/${restaurantId}`, { params });
    return response.data;
  },

  // Accept order
  async acceptOrder(orderId: string) {
    const response = await api.post(`/orders/manage/${orderId}/accept`);
    return response.data;
  },

  // Reject order
  async rejectOrder(orderId: string) {
    const response = await api.post(`/orders/manage/${orderId}/reject`);
    return response.data;
  },

  // Update order status
  async updateOrderStatus(orderId: string, status: string) {
    const response = await api.put(`/orders/manage/${orderId}/status`, { status });
    return response.data;
  },

  // Get restaurant stats
  async getRestaurantStats(restaurantId: string) {
    const response = await api.get(`/stats/${restaurantId}`);
    return response.data;
  },
};