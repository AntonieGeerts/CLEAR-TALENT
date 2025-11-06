import { AIProvider, CompletionOptions, PromptVariables, AIServiceError } from '../../types';
import { OpenAIProvider } from './openai-provider';
import { PromptManager } from './prompt-manager';
import { AuditService, AIAuditStatus } from './audit-service';
import { PIIDetector } from '../../utils/pii-detector';
import config from '../../config';
import { aiLogger } from '../../utils/logger';

export interface OrchestrationContext {
  tenantId: string;
  userId: string;
  module: string;
  action: string;
  skipPIIRedaction?: boolean;
  skipAudit?: boolean;
}

export class LLMOrchestrator {
  private provider: AIProvider | null;
  private static instance: LLMOrchestrator;

  private constructor() {
    // Initialize provider based on configuration
    if (config.ai.enabled && config.openai.apiKey && config.openai.apiKey !== 'sk-test-key-not-configured') {
      this.provider = new OpenAIProvider();
      aiLogger.info('LLM Orchestrator initialized with AI enabled');
    } else {
      this.provider = null;
      aiLogger.info('LLM Orchestrator initialized with AI disabled');
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): LLMOrchestrator {
    if (!LLMOrchestrator.instance) {
      LLMOrchestrator.instance = new LLMOrchestrator();
    }
    return LLMOrchestrator.instance;
  }

  /**
   * Check if AI is enabled
   */
  isEnabled(): boolean {
    return config.ai.enabled;
  }

  /**
   * Generate completion with full orchestration
   */
  async generateCompletion(
    prompt: string,
    context: OrchestrationContext,
    options?: CompletionOptions
  ): Promise<string> {
    const startTime = Date.now();

    try {
      // Check if AI is enabled
      if (!this.isEnabled() || !this.provider) {
        throw new AIServiceError('AI features are disabled');
      }

      // Apply PII redaction if enabled
      let processedPrompt = prompt;
      if (config.compliance.piiRedactionEnabled && !context.skipPIIRedaction) {
        const piiResult = PIIDetector.detect(prompt);
        if (piiResult.hasPII) {
          processedPrompt = piiResult.redactedText;
          aiLogger.warn('PII detected and redacted from prompt', {
            detectedTypes: piiResult.detectedTypes,
            module: context.module,
            action: context.action,
          });
        }
      }

      // Generate completion
      const response = await this.provider.generateCompletion(processedPrompt, options);
      const latency = Date.now() - startTime;

      // Audit the operation
      if (!context.skipAudit) {
        await AuditService.logOperation({
          tenantId: context.tenantId,
          userId: context.userId,
          module: context.module,
          action: context.action,
          prompt: processedPrompt,
          response,
          tokensUsed: this.estimateTokens(processedPrompt, response),
          latencyMs: latency,
          status: AIAuditStatus.SUCCESS,
        });
      }

      return response;
    } catch (error) {
      const latency = Date.now() - startTime;

      // Audit the failure
      if (!context.skipAudit) {
        await AuditService.logOperation({
          tenantId: context.tenantId,
          userId: context.userId,
          module: context.module,
          action: context.action,
          prompt: prompt.substring(0, 500), // Truncate for error logs
          latencyMs: latency,
          status: AIAuditStatus.ERROR,
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }

      aiLogger.error('Completion generation failed', {
        module: context.module,
        action: context.action,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Generate completion from template
   */
  async generateFromTemplate(
    module: string,
    promptType: string,
    variables: PromptVariables,
    context: OrchestrationContext,
    options?: CompletionOptions
  ): Promise<string> {
    try {
      // Get and render the prompt template
      const prompt = await PromptManager.getRenderedPrompt(module, promptType, variables);

      aiLogger.debug('Generating from template', {
        module,
        promptType,
        promptLength: prompt.length,
      });

      // Generate completion
      return await this.generateCompletion(prompt, context, options);
    } catch (error) {
      aiLogger.error('Failed to generate from template', {
        module,
        promptType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate embedding
   */
  async generateEmbedding(
    text: string,
    context: OrchestrationContext
  ): Promise<number[]> {
    try {
      if (!this.isEnabled() || !this.provider) {
        throw new AIServiceError('AI features are disabled');
      }

      // Apply PII redaction if enabled
      let processedText = text;
      if (config.compliance.piiRedactionEnabled) {
        processedText = PIIDetector.redact(text);
      }

      const embedding = await this.provider.generateEmbedding(processedText);

      // Audit if needed (embeddings are lightweight, optional audit)
      if (!context.skipAudit) {
        await AuditService.logOperation({
          tenantId: context.tenantId,
          userId: context.userId,
          module: context.module,
          action: 'generate-embedding',
          prompt: processedText.substring(0, 200),
          status: AIAuditStatus.SUCCESS,
        });
      }

      return embedding;
    } catch (error) {
      aiLogger.error('Embedding generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Batch completions
   */
  async batchComplete(
    prompts: string[],
    context: OrchestrationContext,
    options?: CompletionOptions
  ): Promise<string[]> {
    aiLogger.info('Starting batch completion', {
      batchSize: prompts.length,
      module: context.module,
    });

    const results: string[] = [];

    for (const prompt of prompts) {
      try {
        const result = await this.generateCompletion(prompt, context, options);
        results.push(result);
      } catch (error) {
        aiLogger.error('Batch completion item failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        results.push('');
      }
    }

    return results;
  }

  /**
   * Parse JSON response from AI
   */
  parseJSONResponse<T>(response: string): T {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : response.trim();

      return JSON.parse(jsonString);
    } catch (error) {
      aiLogger.error('Failed to parse JSON response', {
        response: response.substring(0, 200),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AIServiceError('Failed to parse AI response as JSON');
    }
  }

  /**
   * Estimate tokens (rough approximation)
   */
  private estimateTokens(...texts: string[]): number {
    const combined = texts.join(' ');
    // Rough estimation: ~4 characters per token
    return Math.ceil(combined.length / 4);
  }

  /**
   * Test the AI provider connection
   */
  async testConnection(): Promise<boolean> {
    if (this.provider instanceof OpenAIProvider) {
      return this.provider.testConnection();
    }
    return false;
  }
}

export default LLMOrchestrator;
