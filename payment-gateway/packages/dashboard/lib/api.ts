import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const authAPI = {
  register: async (data: { email: string; password: string; businessName: string; walletAddress: string }) => {
    const response = await api.post('/merchants/register', data);
    return response.data.data || response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/merchants/login', data);
    return response.data.data || response.data;
  },

  getProfile: async () => {
    const response = await api.get('/merchants/me');
    return response.data.data || response.data;
  },

  regenerateAPIKey: async () => {
    const response = await api.post('/merchants/api-key/regenerate');
    return response.data.data || response.data;
  },
};

export const paymentsAPI = {
  getStats: async () => {
    const response = await api.get('/merchants/stats');
    return response.data.data || response.data;
  },

  getPayments: async (page = 1, limit = 10) => {
    const response = await api.get(`/merchants/payments?page=${page}&limit=${limit}`);
    return response.data.data || response.data;
  },

  createPayment: async (data: {
    orderId: string;
    amount: string;
    currency: string;
    callbackUrl?: string;
    returnUrl?: string;
    metadata?: any;
  }) => {
    const apiKey = localStorage.getItem('apiKey');
    const response = await axios.post(`${API_URL}/api/v1/payments`, data, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    return response.data.data || response.data;
  },
};

export default api;
