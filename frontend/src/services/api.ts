import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://clear-talent-production.up.railway.app/api/v1';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle response errors
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async register(data: { email: string; password: string; name: string; role?: string }) {
    const response = await this.api.post('/auth/register', data);
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  // Competencies
  async getCompetencies() {
    const response = await this.api.get('/competencies');
    return response.data;
  }

  async getCompetency(id: string) {
    const response = await this.api.get(`/competencies/${id}`);
    return response.data;
  }

  async createCompetency(data: {
    name: string;
    description: string;
    type: string;
    category?: string;
  }) {
    const response = await this.api.post('/competencies', data);
    return response.data;
  }

  async updateCompetency(id: string, data: any) {
    const response = await this.api.put(`/competencies/${id}`, data);
    return response.data;
  }

  async deleteCompetency(id: string) {
    const response = await this.api.delete(`/competencies/${id}`);
    return response.data;
  }

  async suggestCompetenciesFromJD(data: {
    jobDescription: string;
    roleTitle: string;
    department: string;
  }) {
    const response = await this.api.post('/ai/suggest-competencies', data);
    return response.data;
  }

  // Role Profiles
  async getRoleProfiles() {
    const response = await this.api.get('/role-profiles');
    return response.data;
  }

  async getRoleProfile(id: string) {
    const response = await this.api.get(`/role-profiles/${id}`);
    return response.data;
  }

  async createRoleProfile(data: {
    title: string;
    department: string;
    description?: string;
  }) {
    const response = await this.api.post('/role-profiles', data);
    return response.data;
  }

  // Goals
  async getGoals(employeeId?: string) {
    const url = employeeId ? `/goals?employeeId=${employeeId}` : '/goals';
    const response = await this.api.get(url);
    return response.data;
  }

  async generateGoals(data: {
    employeeId: string;
    roleProfileId?: string;
  }) {
    const response = await this.api.post('/ai/generate-goals', data);
    return response.data;
  }

  // Skill Gaps
  async analyzeSkillGaps(data: {
    employeeId: string;
    roleProfileId?: string;
  }) {
    const response = await this.api.post('/ai/analyze-skill-gaps', data);
    return response.data;
  }

  // IDPs
  async getIDPs(employeeId?: string) {
    const url = employeeId ? `/idps?employeeId=${employeeId}` : '/idps';
    const response = await this.api.get(url);
    return response.data;
  }

  async generateIDP(data: {
    employeeId: string;
    skillGaps: any[];
    goals?: any[];
  }) {
    const response = await this.api.post('/ai/generate-idp', data);
    return response.data;
  }

  // Learning Paths
  async generateLearningPath(data: {
    competencyId: string;
    currentLevel: number;
    targetLevel: number;
  }) {
    const response = await this.api.post('/ai/learning-path', data);
    return response.data;
  }

  // Sentiment Analysis
  async analyzeSentiment(data: {
    feedbackTexts: string[];
  }) {
    const response = await this.api.post('/ai/sentiment-analysis', data);
    return response.data;
  }
}

export const apiService = new ApiService();
