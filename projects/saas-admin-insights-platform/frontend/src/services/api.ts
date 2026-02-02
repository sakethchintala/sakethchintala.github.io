import axios, { AxiosError, AxiosResponse } from 'axios';
import type {
  ApiResponse,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
  AnalyticsOverview,
  AIInsight,
  AuditLog,
} from '../types';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        
        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API
// ============================================

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await api.post('/auth/register', data);
    const { user, tokens } = response.data.data as any;
    localStorage.setItem('accessToken', tokens.accessToken);
    return { user, accessToken: tokens.accessToken };
  },
  
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response: AxiosResponse<ApiResponse<AuthResponse>> = await api.post('/auth/login', credentials);
    const { user, accessToken } = response.data.data!;
    localStorage.setItem('accessToken', accessToken);
    return { user, accessToken };
  },
  
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
  },
  
  getCurrentUser: async (): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get('/auth/me');
    return response.data.data!;
  },
};

// ============================================
// ANALYTICS API
// ============================================

export const analyticsApi = {
  getOverview: async (): Promise<AnalyticsOverview> => {
    const response: AxiosResponse<ApiResponse<AnalyticsOverview>> = await api.get('/analytics/overview');
    return response.data.data!;
  },
  
  getTrends: async () => {
    const response = await api.get('/analytics/trends');
    return response.data.data;
  },
};

// ============================================
// AI API
// ============================================

export const aiApi = {
  getInsights: async (limit?: number): Promise<AIInsight[]> => {
    const response: AxiosResponse<ApiResponse<AIInsight[]>> = await api.get('/ai/insights', {
      params: { limit },
    });
    return response.data.data!;
  },
  
  generateInsights: async (): Promise<AIInsight[]> => {
    const response: AxiosResponse<ApiResponse<AIInsight[]>> = await api.post('/ai/generate');
    return response.data.data!;
  },
  
  chat: async (message: string): Promise<string> => {
    const response: AxiosResponse<ApiResponse<{ response: string }>> = await api.post('/ai/chat', { message });
    return response.data.data!.response;
  },
};

// ============================================
// USERS API
// ============================================

export const usersApi = {
  getUsers: async (page = 1, limit = 20) => {
    const response = await api.get('/users', { params: { page, limit } });
    return response.data;
  },
};

// ============================================
// AUDIT API
// ============================================

export const auditApi = {
  getLogs: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    resource?: string;
  }): Promise<{ logs: AuditLog[]; meta: any }> => {
    const response: AxiosResponse<ApiResponse<AuditLog[]>> = await api.get('/audit', { params });
    return {
      logs: response.data.data!,
      meta: response.data.meta,
    };
  },
};

export default api;
