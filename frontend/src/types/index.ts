// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tenantId: string;
  aiOptOut: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: any;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  tenant: Tenant;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: string;
}

// Competency Types
export interface ProficiencyLevelSummary {
  id: string;
  name: string;
  numericLevel: number;
  sortOrder?: number;
  description?: string;
}

export interface Competency {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  type: 'TECHNICAL' | 'BEHAVIORAL' | 'LEADERSHIP' | 'FUNCTIONAL';
  category: string | null;
  aiGenerated: boolean;
  sourceJobDescription: string | null;
  createdAt: string;
  updatedAt: string;
  proficiencyLevels?: ProficiencyLevelSummary[];
}

export interface CompetencyLevel {
  id: string;
  competencyId: string;
  level: number;
  name: string;
  description: string;
  indicators: string[];
}

// Role Profile Types
export interface RoleProfile {
  id: string;
  tenantId: string;
  title: string;
  department: string;
  description: string | null;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Goal Types
export interface Goal {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  type: 'INDIVIDUAL' | 'TEAM' | 'ORGANIZATIONAL';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  aiGenerated: boolean;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// Skill Gap Types
export interface SkillGap {
  competencyId: string;
  competencyName: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  recommendations: string[];
}

// IDP Types
export interface IDP {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
  startDate: string;
  endDate: string;
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}
