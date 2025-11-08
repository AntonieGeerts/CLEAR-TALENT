import axios, { AxiosInstance, AxiosError } from 'axios';

// @ts-ignore - Vite env vars
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'https://clear-talent-production.up.railway.app/api/v1';

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
    // Backend wraps response in { success, data, timestamp }
    return response.data.data;
  }

  async register(data: { email: string; password: string; name: string; role?: string }) {
    const response = await this.api.post('/auth/register', data);
    // Backend wraps response in { success, data, timestamp }
    return response.data.data;
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    // Backend wraps response in { success, data, timestamp }
    return response.data.data;
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

  async generateCompetenciesByCategory(data: {
    category: 'CORE' | 'LEADERSHIP' | 'FUNCTIONAL';
    count?: number;
    companyContext?: {
      companyName: string;
      industry: string;
      companySize?: string;
      companyValues?: string;
      companyDescription?: string;
    };
  }) {
    const response = await this.api.post('/ai/competencies/generate-by-category', data);
    return response.data;
  }

  async generateAssessmentQuestions(competencyId: string, count?: number, autoSave = true) {
    const response = await this.api.post(
      `/ai/competencies/${competencyId}/generate-assessment-questions`,
      { count: count || 5, autoSave }
    );
    return response.data;
  }

  // Competency Questions
  async getCompetencyQuestions(competencyId: string) {
    const response = await this.api.get(`/competencies/${competencyId}/questions`);
    return response.data;
  }

  async createCompetencyQuestion(competencyId: string, data: {
    statement: string;
    type: 'BEHAVIORAL' | 'SITUATIONAL' | 'TECHNICAL' | 'KNOWLEDGE';
    examples?: string[];
    proficiencyLevelId?: string | null;
    ratingOptions?: Record<string, string>;
    weight?: number;
    scoreMin?: number;
    scoreMax?: number;
    scoringSystemId?: string | null;
  }) {
    const response = await this.api.post(`/competencies/${competencyId}/questions`, data);
    return response.data;
  }

  async updateCompetencyQuestion(questionId: string, data: {
    statement?: string;
    type?: 'BEHAVIORAL' | 'SITUATIONAL' | 'TECHNICAL' | 'KNOWLEDGE';
    examples?: string[];
    proficiencyLevelId?: string | null;
    ratingOptions?: Record<string, string>;
    weight?: number;
    scoreMin?: number;
    scoreMax?: number;
    scoringSystemId?: string | null;
  }) {
    const response = await this.api.put(`/competencies/questions/${questionId}`, data);
    return response.data;
  }

  async deleteCompetencyQuestion(questionId: string) {
    const response = await this.api.delete(`/competencies/questions/${questionId}`);
    return response.data;
  }

  // Scoring Systems
  async getScoringSystems() {
    const response = await this.api.get('/scoring-systems');
    return response.data;
  }

  async getScoringSystem(id: string) {
    const response = await this.api.get(`/scoring-systems/${id}`);
    return response.data;
  }

  async getDefaultScoringSystem() {
    const response = await this.api.get('/scoring-systems/default');
    return response.data;
  }

  async createScoringSystem(data: {
    systemId: string;
    name: string;
    description: string;
    config: any;
  }) {
    const response = await this.api.post('/scoring-systems', data);
    return response.data;
  }

  async updateScoringSystem(id: string, data: {
    name?: string;
    description?: string;
    config?: any;
    isActive?: boolean;
  }) {
    const response = await this.api.put(`/scoring-systems/${id}`, data);
    return response.data;
  }

  async setDefaultScoringSystem(id: string) {
    const response = await this.api.post(`/scoring-systems/${id}/set-default`);
    return response.data;
  }

  async deleteScoringSystem(id: string) {
    const response = await this.api.delete(`/scoring-systems/${id}`);
    return response.data;
  }

  async calculateScore(systemId: string, questionScores: Array<{
    questionId: string;
    score: number;
    weight?: number;
  }>) {
    const response = await this.api.post(`/scoring-systems/${systemId}/calculate`, {
      questionScores
    });
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
    seniority?: string;
    description?: string;
  }) {
    const response = await this.api.post('/role-profiles', data);
    return response.data;
  }

  async updateRoleProfile(id: string, data: {
    title?: string;
    department?: string;
    seniority?: string;
    description?: string;
  }) {
    const response = await this.api.put(`/role-profiles/${id}`, data);
    return response.data;
  }

  async deleteRoleProfile(id: string) {
    const response = await this.api.delete(`/role-profiles/${id}`);
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
    roleContext?: string;
    roleProfileId?: string;
  }) {
    const response = await this.api.post('/ai/generate-goals', data);
    return response.data;
  }

  async createGoal(data: {
    title: string;
    description?: string;
    type: string;
    status: string;
    progress: number;
    targetDate?: string;
  }) {
    const response = await this.api.post('/goals', data);
    return response.data;
  }

  async updateGoal(id: string, data: {
    title?: string;
    description?: string;
    type?: string;
    status?: string;
    progress?: number;
    targetDate?: string;
  }) {
    const response = await this.api.put(`/goals/${id}`, data);
    return response.data;
  }

  async deleteGoal(id: string) {
    const response = await this.api.delete(`/goals/${id}`);
    return response.data;
  }

  // Skill Gaps
  async analyzeSkillGaps(data: {
    employeeId: string;
    context?: string;
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
    context?: string;
    skillGaps?: any[];
    goals?: any[];
  }) {
    const response = await this.api.post('/ai/generate-idp', data);
    return response.data;
  }

  async createIDP(data: {
    title: string;
    startDate: string;
    targetDate?: string;
  }) {
    const response = await this.api.post('/idps', data);
    return response.data;
  }

  async deleteIDP(id: string) {
    const response = await this.api.delete(`/idps/${id}`);
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

  // ============================================================================
  // TENANT MANAGEMENT (System Admin)
  // ============================================================================

  async getTenants(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    const response = await this.api.get(`/tenants?${queryParams.toString()}`);
    return response.data.data;
  }

  async getTenant(id: string) {
    const response = await this.api.get(`/tenants/${id}`);
    return response.data.data;
  }

  async getTenantStats() {
    const response = await this.api.get('/tenants/stats');
    return response.data.data;
  }

  async createTenant(data: {
    name: string;
    slug: string;
    adminEmail: string;
    adminPassword: string;
    adminFirstName: string;
    adminLastName: string;
    logo?: string;
    primaryColor?: string;
  }) {
    const response = await this.api.post('/tenants', data);
    return response.data.data;
  }

  async updateTenant(id: string, data: {
    name?: string;
    isActive?: boolean;
    onboardingStatus?: string;
    logo?: string;
    primaryColor?: string;
  }) {
    const response = await this.api.put(`/tenants/${id}`, data);
    return response.data.data;
  }

  async deactivateTenant(id: string) {
    const response = await this.api.post(`/tenants/${id}/deactivate`);
    return response.data.data;
  }

  // ============================================================================
  // USER MANAGEMENT (within Tenant - System Admin)
  // ============================================================================

  async createUserForTenant(tenantId: string, data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: string;
    department?: string;
    position?: string;
  }) {
    const response = await this.api.post(`/tenants/${tenantId}/users`, data);
    return response.data.data;
  }

  async updateUser(userId: string, data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    department?: string;
    position?: string;
  }) {
    const response = await this.api.put(`/users/${userId}`, data);
    return response.data.data;
  }

  async deleteUser(userId: string) {
    const response = await this.api.delete(`/users/${userId}`);
    return response.data;
  }

  async resetUserPassword(userId: string, newPassword: string) {
    const response = await this.api.post(`/users/${userId}/reset-password`, { newPassword });
    return response.data;
  }

  // ============================================================================
  // ORGANIZATIONAL GOALS
  // ============================================================================

  async getOrganizationalGoals(params?: {
    level?: string;
    department?: string;
    parentId?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.level) queryParams.append('level', params.level);
    if (params?.department) queryParams.append('department', params.department);
    if (params?.parentId) queryParams.append('parentId', params.parentId);

    const response = await this.api.get(`/organizational-goals?${queryParams.toString()}`);
    return response.data.data;
  }

  async getOrganizationalGoalsTree() {
    const response = await this.api.get('/organizational-goals/tree');
    return response.data.data;
  }

  async getOrganizationalGoalsByLevel(parentId?: string) {
    const queryParams = new URLSearchParams();
    if (parentId) queryParams.append('parentId', parentId);

    const response = await this.api.get(`/organizational-goals/by-level?${queryParams.toString()}`);
    return response.data.data;
  }

  async getOrganizationalGoal(id: string) {
    const response = await this.api.get(`/organizational-goals/${id}`);
    return response.data.data;
  }

  async getGoalAlignmentReport() {
    const response = await this.api.get('/organizational-goals/alignment-report');
    return response.data.data;
  }

  async createOrganizationalGoal(data: {
    title: string;
    description?: string;
    level: string;
    department?: string;
    parentId?: string;
    weight?: number;
    targetDate?: string;
  }) {
    const response = await this.api.post('/organizational-goals', data);
    return response.data.data;
  }

  async updateOrganizationalGoal(id: string, data: {
    title?: string;
    description?: string;
    department?: string;
    weight?: number;
    targetDate?: string;
    status?: string;
  }) {
    const response = await this.api.put(`/organizational-goals/${id}`, data);
    return response.data.data;
  }

  async deleteOrganizationalGoal(id: string) {
    const response = await this.api.delete(`/organizational-goals/${id}`);
    return response.data;
  }

  async deleteAllOrganizationalGoals() {
    const response = await this.api.delete('/organizational-goals/all');
    return response.data;
  }

  async generateStrategicGoalsAI(data: {
    organizationName: string;
    industry: string;
    organizationDescription: string;
  }) {
    const response = await this.api.post('/organizational-goals/generate-ai', data);
    return response.data.data;
  }

  async createGoalsFromAI(data: {
    goals: any[];
  }) {
    const response = await this.api.post('/organizational-goals/create-from-ai', data);
    return response.data.data;
  }

  async generateKPIsForGoal(data: {
    goalId: string;
    goalTitle: string;
    goalDescription: string;
    additionalContext?: string;
  }) {
    const response = await this.api.post('/organizational-goals/generate-kpis', data);
    return response.data.data;
  }

  async updateGoalKPIs(goalId: string, data: {
    kpis: any[];
  }) {
    const response = await this.api.put(`/organizational-goals/${goalId}/kpis`, data);
    return response.data.data;
  }

  // ============================================================================
  // PERFORMANCE IMPROVEMENT PLANS (PIPs)
  // ============================================================================

  async getPIPs(params?: { status?: string; employeeId?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId);

    const response = await this.api.get(`/pips?${queryParams.toString()}`);
    return response.data.data;
  }

  async getPIP(id: string) {
    const response = await this.api.get(`/pips/${id}`);
    return response.data.data;
  }

  async createPIP(data: {
    employeeId: string;
    startDate: string;
    endDate: string;
    objectives: any[];
  }) {
    const response = await this.api.post('/pips', data);
    return response.data.data;
  }

  async updatePIP(id: string, data: {
    status?: string;
    objectives?: any[];
    finalOutcome?: string;
  }) {
    const response = await this.api.put(`/pips/${id}`, data);
    return response.data.data;
  }

  async addPIPCheckIn(id: string, data: {
    date: string;
    notes: string;
    progress: number;
    actionItems?: string[];
  }) {
    const response = await this.api.post(`/pips/${id}/check-in`, data);
    return response.data.data;
  }

  async completePIP(id: string, data: {
    finalOutcome: string;
    successful: boolean;
  }) {
    const response = await this.api.post(`/pips/${id}/complete`, data);
    return response.data.data;
  }

  // ============================================================================
  // COMPETENCY ASSESSMENTS
  // ============================================================================

  async createAssessment(data: { competencyIds: string[] }) {
    const response = await this.api.post('/assessments', data);
    return response.data;
  }

  async getAssessment(id: string) {
    const response = await this.api.get(`/assessments/${id}`);
    return response.data;
  }

  async submitAssessmentResponse(assessmentId: string, data: {
    questionId: string;
    rating: number;
    comment?: string;
  }) {
    const response = await this.api.post(`/assessments/${assessmentId}/responses`, data);
    return response.data;
  }

  async completeAssessment(assessmentId: string) {
    const response = await this.api.post(`/assessments/${assessmentId}/complete`);
    return response.data;
  }

  async getMyAssessments() {
    const response = await this.api.get('/assessments/my-assessments');
    return response.data;
  }

  async getAssessmentResults(assessmentId: string) {
    const response = await this.api.get(`/assessments/${assessmentId}/results`);
    return response.data;
  }

  // ============================================================================
  // RBAC (Role-Based Access Control)
  // ============================================================================

  async getRoles() {
    const response = await this.api.get('/rbac/roles');
    return response.data;
  }

  async getRole(roleId: string) {
    const response = await this.api.get(`/rbac/roles/${roleId}`);
    return response.data;
  }

  async createRole(data: {
    name: string;
    key: string;
    description?: string;
    permissionIds: string[];
  }) {
    const response = await this.api.post('/rbac/roles', data);
    return response.data;
  }

  async updateRole(roleId: string, data: {
    name?: string;
    description?: string;
  }) {
    const response = await this.api.put(`/rbac/roles/${roleId}`, data);
    return response.data;
  }

  async deleteRole(roleId: string) {
    const response = await this.api.delete(`/rbac/roles/${roleId}`);
    return response.data;
  }

  async assignRolePermissions(roleId: string, permissionIds: string[]) {
    const response = await this.api.put(`/rbac/roles/${roleId}/permissions`, {
      permissionIds,
    });
    return response.data;
  }

  async getPermissions() {
    const response = await this.api.get('/rbac/permissions');
    return response.data;
  }

  // ============================================================================
  // STAFF MANAGEMENT
  // ============================================================================

  async getStaff(params?: {
    status?: string;
    role?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await this.api.get('/staff', { params });
    return response.data;
  }

  async inviteStaff(data: {
    email: string;
    firstName: string;
    lastName: string;
    roleId: string;
    additionalRoleIds?: string[];
    metadata?: Record<string, any>;
  }) {
    const response = await this.api.post('/staff/invite', data);
    return response.data;
  }

  async updateStaffMembership(membershipId: string, data: {
    primaryRoleId?: string;
    additionalRoleIds?: string[];
    status?: string;
    metadata?: Record<string, any>;
  }) {
    const response = await this.api.put(`/staff/${membershipId}`, data);
    return response.data;
  }

  async removeStaffMember(membershipId: string) {
    const response = await this.api.delete(`/staff/${membershipId}`);
    return response.data;
  }

  async resendInvitation(invitationId: string) {
    const response = await this.api.post(`/staff/invitations/${invitationId}/resend`);
    return response.data;
  }

  async revokeInvitation(invitationId: string) {
    const response = await this.api.delete(`/staff/invitations/${invitationId}`);
    return response.data;
  }

  async acceptInvitation(data: {
    token: string;
    password: string;
  }) {
    const response = await this.api.post('/staff/accept-invitation', data);
    return response.data;
  }

  // ============================================================================
  // AUDIT LOGS
  // ============================================================================

  async getAuditLogs(params?: {
    eventType?: string;
    actorUserId?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await this.api.get('/audit/logs', { params });
    return response.data;
  }

  async getResourceAuditTrail(resourceType: string, resourceId: string) {
    const response = await this.api.get(`/audit/resources/${resourceType}/${resourceId}`);
    return response.data;
  }

  async exportAuditLogs(params?: {
    eventType?: string;
    actorUserId?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
    format?: string;
  }) {
    const response = await this.api.get('/audit/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }
}

export const apiService = new ApiService();
