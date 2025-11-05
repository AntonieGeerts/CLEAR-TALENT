import { LLMOrchestrator } from './orchestrator';
import { AIServiceError } from '../../types';
import { aiLogger } from '../../utils/logger';
import { ImproveTextInput, SummarizeTextInput } from '../../utils/validators';

export class AITextService {
  private static orchestrator = LLMOrchestrator.getInstance();

  /**
   * Improve review text (S1.5)
   */
  static async improveText(
    tenantId: string,
    userId: string,
    input: ImproveTextInput
  ): Promise<string> {
    try {
      aiLogger.info('Improving text', {
        textLength: input.text.length,
        style: input.style,
      });

      const response = await this.orchestrator.generateFromTemplate(
        'REVIEW',
        'improve-text',
        {
          text: input.text,
          context: input.context || 'general feedback',
          style: input.style,
        },
        {
          tenantId,
          userId,
          module: 'review',
          action: 'improve-text',
        }
      );

      aiLogger.info('Text improved successfully');

      return response.trim();
    } catch (error) {
      aiLogger.error('Failed to improve text', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AIServiceError('Failed to improve text');
    }
  }

  /**
   * Summarize text (S1.5)
   */
  static async summarizeText(
    tenantId: string,
    userId: string,
    input: SummarizeTextInput
  ): Promise<string> {
    try {
      aiLogger.info('Summarizing text', {
        textLength: input.text.length,
        maxLength: input.maxLength,
      });

      const response = await this.orchestrator.generateFromTemplate(
        'REVIEW',
        'summarize',
        {
          text: input.text,
          maxLength: input.maxLength,
        },
        {
          tenantId,
          userId,
          module: 'review',
          action: 'summarize',
        }
      );

      aiLogger.info('Text summarized successfully');

      return response.trim();
    } catch (error) {
      aiLogger.error('Failed to summarize text', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AIServiceError('Failed to summarize text');
    }
  }

  /**
   * Rewrite text with different tone
   */
  static async rewriteText(
    tenantId: string,
    userId: string,
    text: string,
    tone: 'formal' | 'casual' | 'constructive'
  ): Promise<string> {
    try {
      aiLogger.info('Rewriting text', {
        textLength: text.length,
        tone,
      });

      const prompt = `Rewrite the following text in a ${tone} tone:

${text}

Return only the rewritten text without any preamble or explanation.`;

      const response = await this.orchestrator.generateCompletion(
        prompt,
        {
          tenantId,
          userId,
          module: 'review',
          action: 'rewrite-text',
        }
      );

      aiLogger.info('Text rewritten successfully');

      return response.trim();
    } catch (error) {
      aiLogger.error('Failed to rewrite text', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AIServiceError('Failed to rewrite text');
    }
  }

  /**
   * Make text more specific and concrete
   */
  static async makeSpecific(
    tenantId: string,
    userId: string,
    text: string,
    context?: string
  ): Promise<string> {
    return this.improveText(tenantId, userId, {
      text,
      context,
      style: 'specific',
    });
  }

  /**
   * Make text more constructive
   */
  static async makeConstructive(
    tenantId: string,
    userId: string,
    text: string,
    context?: string
  ): Promise<string> {
    return this.improveText(tenantId, userId, {
      text,
      context,
      style: 'constructive',
    });
  }

  /**
   * Structure unstructured feedback
   */
  static async structureFeedback(
    tenantId: string,
    userId: string,
    text: string
  ): Promise<string> {
    try {
      const prompt = `Structure the following feedback into clear sections:

${text}

Organize the feedback into:
- Strengths
- Areas for improvement
- Specific recommendations

Use clear headings and bullet points. Be specific and actionable.`;

      const response = await this.orchestrator.generateCompletion(
        prompt,
        {
          tenantId,
          userId,
          module: 'feedback',
          action: 'structure-feedback',
        }
      );

      return response.trim();
    } catch (error) {
      aiLogger.error('Failed to structure feedback', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AIServiceError('Failed to structure feedback');
    }
  }
}

export default AITextService;
