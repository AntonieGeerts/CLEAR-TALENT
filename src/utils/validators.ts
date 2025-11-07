import { z } from 'zod';

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  department: z.string().optional(),
  position: z.string().optional(),
});

// Competency schemas
export const createCompetencySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  type: z.enum(['CORE', 'LEADERSHIP', 'FUNCTIONAL', 'TECHNICAL']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional().default([]),
});

export const updateCompetencySchema = createCompetencySchema.partial();

// AI operation schemas
export const suggestFromJDSchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  roleTitle: z.string().min(1, 'Role title is required'),
  department: z.string().min(1, 'Department is required'),
});

export const generateIndicatorsSchema = z.object({
  levelId: z.string().uuid('Invalid level ID'),
  count: z.number().int().min(1).max(10).default(5),
});

export const improveTextSchema = z.object({
  text: z.string().min(10, 'Text must be at least 10 characters'),
  context: z.string().optional(),
  style: z.enum(['constructive', 'specific', 'structured']).default('constructive'),
});

export const summarizeTextSchema = z.object({
  text: z.string().min(20, 'Text must be at least 20 characters'),
  maxLength: z.number().int().min(50).max(1000).default(200),
});

// Role profile schemas
export const createRoleProfileSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  department: z.string().min(1, 'Department is required'),
  seniority: z.enum(['ENTRY', 'MID', 'SENIOR', 'LEAD', 'PRINCIPAL', 'EXECUTIVE']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

export const updateRoleProfileSchema = createRoleProfileSchema.partial();

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// Query schemas
export const competencyQuerySchema = z.object({
  type: z.enum(['TECHNICAL', 'BEHAVIORAL', 'LEADERSHIP', 'FUNCTIONAL']).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateCompetencyInput = z.infer<typeof createCompetencySchema>;
export type UpdateCompetencyInput = z.infer<typeof updateCompetencySchema>;
export type SuggestFromJDInput = z.infer<typeof suggestFromJDSchema>;
export type GenerateIndicatorsInput = z.infer<typeof generateIndicatorsSchema>;
export type ImproveTextInput = z.infer<typeof improveTextSchema>;
export type SummarizeTextInput = z.infer<typeof summarizeTextSchema>;
export type CreateRoleProfileInput = z.infer<typeof createRoleProfileSchema>;
export type UpdateRoleProfileInput = z.infer<typeof updateRoleProfileSchema>;
export type CompetencyQuery = z.infer<typeof competencyQuerySchema>;
