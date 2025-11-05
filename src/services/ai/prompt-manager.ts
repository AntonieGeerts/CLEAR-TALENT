import { PrismaClient } from '@prisma/client';
import { PromptVariables } from '../../types';
import { aiLogger } from '../../utils/logger';

const prisma = new PrismaClient();

export class PromptManager {
  /**
   * Get prompt template by module and type
   */
  static async getTemplate(module: string, promptType: string): Promise<string> {
    try {
      const template = await prisma.aIPromptTemplate.findFirst({
        where: {
          module: module as any,
          promptType,
          isActive: true,
        },
        orderBy: {
          version: 'desc',
        },
      });

      if (!template) {
        throw new Error(`Prompt template not found: ${module}/${promptType}`);
      }

      return template.template;
    } catch (error) {
      aiLogger.error('Failed to get prompt template', {
        module,
        promptType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Render prompt template with variables
   */
  static renderTemplate(template: string, variables: PromptVariables): string {
    let rendered = template;

    // Replace all variables in the template
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const replacement = value !== undefined ? String(value) : '';
      rendered = rendered.replace(new RegExp(placeholder, 'g'), replacement);
    }

    // Check for unreplaced variables
    const unreplacedVars = rendered.match(/\{\{(\w+)\}\}/g);
    if (unreplacedVars) {
      aiLogger.warn('Template has unreplaced variables', {
        variables: unreplacedVars,
      });
    }

    return rendered;
  }

  /**
   * Get and render prompt template
   */
  static async getRenderedPrompt(
    module: string,
    promptType: string,
    variables: PromptVariables
  ): Promise<string> {
    const template = await this.getTemplate(module, promptType);
    return this.renderTemplate(template, variables);
  }

  /**
   * Create or update a prompt template
   */
  static async upsertTemplate(
    module: string,
    promptType: string,
    name: string,
    template: string,
    variables: string[]
  ): Promise<void> {
    try {
      // Find existing template
      const existing = await prisma.aIPromptTemplate.findFirst({
        where: { module: module as any, promptType },
        orderBy: { version: 'desc' },
      });

      if (existing) {
        // Deactivate old version
        await prisma.aIPromptTemplate.update({
          where: { id: existing.id },
          data: { isActive: false },
        });

        // Create new version
        await prisma.aIPromptTemplate.create({
          data: {
            name,
            module: module as any,
            promptType,
            template,
            variables,
            version: existing.version + 1,
            isActive: true,
          },
        });

        aiLogger.info('Prompt template updated', {
          module,
          promptType,
          version: existing.version + 1,
        });
      } else {
        // Create new template
        await prisma.aIPromptTemplate.create({
          data: {
            name,
            module: module as any,
            promptType,
            template,
            variables,
            version: 1,
            isActive: true,
          },
        });

        aiLogger.info('Prompt template created', { module, promptType });
      }
    } catch (error) {
      aiLogger.error('Failed to upsert prompt template', {
        module,
        promptType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * List all prompt templates
   */
  static async listTemplates(module?: string) {
    return prisma.aIPromptTemplate.findMany({
      where: module ? { module: module as any } : undefined,
      orderBy: [{ module: 'asc' }, { promptType: 'asc' }, { version: 'desc' }],
    });
  }
}

export default PromptManager;
