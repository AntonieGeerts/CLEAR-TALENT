import { Request } from 'express';
import { User, Tenant } from '@prisma/client';

// Extend Express Request to include authenticated user and tenant
export interface AuthRequest extends Request {
  user?: User;
  tenant?: Tenant;
}

// AI Provider Types
export interface AIProvider {
  generateCompletion(prompt: string, options?: CompletionOptions): Promise<string>;
  generateEmbedding(text: string): Promise<number[]>;
  batchComplete(prompts: string[]): Promise<string[]>;
}

export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
  model?: string;
}

export interface EmbeddingOptions {
  model?: string;
}

// AI Prompt Template
export interface PromptVariables {
  [key: string]: string | number | boolean | undefined;
}

// AI Response Types
export interface CompetencySuggestion {
  name: string;
  type: 'TECHNICAL' | 'BEHAVIORAL' | 'LEADERSHIP' | 'FUNCTIONAL';
  category: string;
  description: string;
  confidence?: number;
}

export interface BehavioralIndicatorSuggestion {
  description: string;
  examples?: string[];
}

export interface AITextOperation {
  originalText: string;
  processedText: string;
  operation: 'improve' | 'summarize' | 'rewrite';
  metadata?: Record<string, unknown>;
}

// PII Detection
export interface PIIDetectionResult {
  hasPII: boolean;
  detectedTypes: string[];
  redactedText: string;
  replacements: PIIReplacement[];
}

export interface PIIReplacement {
  type: string;
  original: string;
  placeholder: string;
  startIndex: number;
  endIndex: number;
}

// API Response Types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// Error Types
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(401, message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`);
  }
}

export class AIServiceError extends AppError {
  constructor(message: string = 'AI service error') {
    super(500, message);
  }
}
