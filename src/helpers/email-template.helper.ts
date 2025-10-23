import { TemplateRepository } from '../repositories/template.repository';
import { TemplateUtil } from '../utils/template.util';

/**
 * Email template helper for integrating templates with email sending
 * This helper bridges the gap between template management and email sending
 */
export class EmailTemplateHelper {
  constructor(private readonly templateRepository: TemplateRepository) {}

  /**
   * Renders a template for email sending with both HTML and text versions
   * @param templateId - Template ID from database
   * @param teamId - Team ID for access control
   * @param data - Data to inject into the template
   * @returns Object containing rendered HTML, text, and subject
   */
  async renderTemplateForEmail(
    templateId: number, 
    teamId: number, 
    data: any
  ): Promise<{ html: string; text: string; subject?: string }> {
    const template = await this.templateRepository.findById(templateId, teamId);
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }

    if (template.status !== 'active') {
      throw new Error(`Template with ID ${templateId} is not active`);
    }

    return TemplateUtil.renderWithSubject(template.html, template.subject, data);
  }

  /**
   * Renders a template by name for email sending
   * @param templateName - Template name
   * @param teamId - Team ID for access control
   * @param data - Data to inject into the template
   * @returns Object containing rendered HTML, text, and subject
   */
  async renderTemplateByNameForEmail(
    templateName: string, 
    teamId: number, 
    data: any
  ): Promise<{ html: string; text: string; subject?: string }> {
    const template = await this.templateRepository.findActiveByName(templateName, teamId);
    if (!template) {
      throw new Error(`Active template with name "${templateName}" not found`);
    }

    return TemplateUtil.renderWithSubject(template.html, template.subject, data);
  }

  /**
   * Increments template usage statistics
   * @param templateId - Template ID
   */
  async incrementTemplateOpens(templateId: number): Promise<void> {
    await this.templateRepository.incrementOpens(templateId);
  }

  /**
   * Increments template click statistics
   * @param templateId - Template ID
   */
  async incrementTemplateClicks(templateId: number): Promise<void> {
    await this.templateRepository.incrementClicks(templateId);
  }
}
