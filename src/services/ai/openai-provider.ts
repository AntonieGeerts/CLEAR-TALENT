import OpenAI from 'openai';
import { AIProvider, CompletionOptions, AIServiceError } from '../../types';
import config from '../../config';
import { aiLogger } from '../../utils/logger';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private defaultModel: string;
  private defaultEmbeddingModel: string;

  constructor() {
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
      organization: config.openai.orgId,
      timeout: config.ai.timeoutMs,
      maxRetries: config.ai.maxRetries,
    });

    this.defaultModel = config.openai.model;
    this.defaultEmbeddingModel = config.openai.embeddingModel;

    aiLogger.info('OpenAI provider initialized', {
      model: this.defaultModel,
      embeddingModel: this.defaultEmbeddingModel,
    });
  }

  /**
   * Generate text completion
   */
  async generateCompletion(prompt: string, options?: CompletionOptions): Promise<string> {
    const startTime = Date.now();

    try {
      aiLogger.debug('Generating completion', {
        promptLength: prompt.length,
        model: options?.model || this.defaultModel,
      });

      const response = await this.client.chat.completions.create({
        model: options?.model || this.defaultModel,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: options?.maxTokens || config.openai.maxTokens,
        temperature: options?.temperature ?? config.openai.temperature,
        stop: options?.stopSequences,
      });

      const completion = response.choices[0]?.message?.content || '';
      const latency = Date.now() - startTime;

      aiLogger.info('Completion generated successfully', {
        model: response.model,
        tokensUsed: response.usage?.total_tokens,
        latencyMs: latency,
      });

      return completion;
    } catch (error) {
      const latency = Date.now() - startTime;
      aiLogger.error('Failed to generate completion', {
        error: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: latency,
      });

      throw new AIServiceError(
        `Failed to generate completion: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate embedding vector
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const startTime = Date.now();

    try {
      aiLogger.debug('Generating embedding', {
        textLength: text.length,
        model: this.defaultEmbeddingModel,
      });

      const response = await this.client.embeddings.create({
        model: this.defaultEmbeddingModel,
        input: text,
      });

      const embedding = response.data[0]?.embedding;
      const latency = Date.now() - startTime;

      if (!embedding) {
        throw new Error('No embedding returned from OpenAI');
      }

      aiLogger.info('Embedding generated successfully', {
        model: response.model,
        dimensions: embedding.length,
        tokensUsed: response.usage?.total_tokens,
        latencyMs: latency,
      });

      return embedding;
    } catch (error) {
      const latency = Date.now() - startTime;
      aiLogger.error('Failed to generate embedding', {
        error: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: latency,
      });

      throw new AIServiceError(
        `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Batch completions (sequential for now, can be parallelized)
   */
  async batchComplete(prompts: string[]): Promise<string[]> {
    aiLogger.info('Starting batch completion', { batchSize: prompts.length });

    const results: string[] = [];

    for (let i = 0; i < prompts.length; i++) {
      try {
        const result = await this.generateCompletion(prompts[i]);
        results.push(result);
      } catch (error) {
        aiLogger.error(`Failed to complete prompt ${i + 1}/${prompts.length}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        results.push('');
      }
    }

    return results;
  }

  /**
   * Test connection to OpenAI API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      aiLogger.error('OpenAI connection test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}

export default OpenAIProvider;
