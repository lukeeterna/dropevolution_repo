// src/services/apiService.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// Creazione di una istanza axios con configurazione base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondi di timeout
});

// Interceptor per aggiungere il token JWT ad ogni richiesta
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor per gestire gli errori comuni
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Gestione dell'errore di autenticazione
    if (error.response && error.response.status === 401) {
      // Token scaduto o non valido
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Reindirizza alla pagina di login se non è già lì
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Gestione degli errori generici
    const errorMessage = error.response?.data?.error?.message || 'Si è verificato un errore. Riprova più tardi.';
    console.error('API Error:', error.response?.data || error.message);
    
    return Promise.reject({
      status: error.response?.status,
      message: errorMessage,
      code: error.response?.data?.error?.code,
      details: error.response?.data?.error?.details,
      originalError: error
    });
  }
);

// Definizione dei servizi API organizzati per entità/feature
const apiService = {
  // Autenticazione
  auth: {
    login: (email, password) => apiClient.post('/auth/login', { email, password }),
    refreshToken: (refreshToken) => apiClient.post('/auth/refresh', { refresh_token: refreshToken }),
    logout: () => apiClient.post('/auth/logout'),
    forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
    resetPassword: (token, newPassword) => apiClient.post('/auth/reset-password', { token, new_password: newPassword }),
  },
  
  // Utenti
  users: {
    getCurrent: () => apiClient.get('/users/me'),
    updateProfile: (userData) => apiClient.put('/users/me', userData),
    changePassword: (oldPassword, newPassword) => 
      apiClient.post('/users/me/change-password', { old_password: oldPassword, new_password: newPassword }),
  },
  
  // Prodotti
  products: {
    getAll: (params) => apiClient.get('/products', { params }),
    getOne: (id) => apiClient.get(`/products/${id}`),
    create: (productData) => apiClient.post('/products', productData),
    update: (id, productData) => apiClient.put(`/products/${id}`, productData),
    delete: (id) => apiClient.delete(`/products/${id}`),
  },
  
  // Ordini
  orders: {
    getAll: (params) => apiClient.get('/orders', { params }),
    getOne: (id) => apiClient.get(`/orders/${id}`),
    create: (orderData) => apiClient.post('/orders', orderData),
    update: (id, orderData) => apiClient.put(`/orders/${id}`, orderData),
    cancel: (id, reason) => apiClient.post(`/orders/${id}/cancel`, { reason }),
  },
  
  // Esempio di endpoint per funzionalità specifiche
  dashboard: {
    getStats: () => apiClient.get('/dashboard/stats'),
    getChartData: (period) => apiClient.get('/dashboard/chart', { params: { period } }),
  },
};

export default apiService;
