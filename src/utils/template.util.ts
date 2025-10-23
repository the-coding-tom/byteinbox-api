import * as Handlebars from 'handlebars';
import { convert } from 'html-to-text';

/**
 * Template utility class for handling Handlebars template rendering
 * Pure utility - no database coupling, just template rendering
 * 
 * Usage example:
 * ```typescript
 * // In your service
 * const template = await this.templateRepository.findById(templateId, teamId);
 * const { html, text } = TemplateUtil.renderTemplate(template.html, {
 *   user: { name: 'John', vip: true },
 *   items: ['Feature A', 'Feature B']
 * });
 * ```
 */
export class TemplateUtil {
  /**
   * Renders a template with the provided data and returns both HTML and text versions
   * @param templateHtml - Raw HTML template string from database
   * @param data - Data to inject into the template
   * @returns Object containing rendered HTML and text
   */
  static renderTemplate(templateHtml: string, data: any): { html: string; text: string } {
    const template = Handlebars.compile(templateHtml);
    const html = template(data);
    
    // Convert HTML to plain text for email clients that don't support HTML
    const text = convert(html, { 
      wordwrap: 130,
      selectors: [
        { selector: 'a', format: 'anchor' },
        { selector: 'img', format: 'skip' },
      ]
    });

    return { html, text };
  }

  /**
   * Renders only HTML version of the template
   * @param templateHtml - Raw HTML template string from database
   * @param data - Data to inject into the template
   * @returns Rendered HTML string
   */
  static renderHtml(templateHtml: string, data: any): string {
    const template = Handlebars.compile(templateHtml);
    return template(data);
  }

  /**
   * Renders only text version of the template
   * @param templateHtml - Raw HTML template string from database
   * @param data - Data to inject into the template
   * @returns Rendered text string
   */
  static renderText(templateHtml: string, data: any): string {
    const html = this.renderHtml(templateHtml, data);
    return convert(html, { 
      wordwrap: 130,
      selectors: [
        { selector: 'a', format: 'anchor' },
        { selector: 'img', format: 'skip' },
      ]
    });
  }

  /**
   * Validates template syntax by attempting to compile it
   * @param templateHtml - Raw HTML template string
   * @returns Object with validation result and error message if any
   */
  static validateTemplate(templateHtml: string): { isValid: boolean; error?: string } {
    try {
      Handlebars.compile(templateHtml);
      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Unknown template compilation error' 
      };
    }
  }

  /**
   * Extracts variable names from template using regex
   * @param templateHtml - Raw HTML template string
   * @returns Array of unique variable names found in the template
   */
  static extractVariables(templateHtml: string): string[] {
    const variableRegex = /\{\{\s*([^}]+)\s*\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variableRegex.exec(templateHtml)) !== null) {
      const variable = match[1].trim();
      // Skip Handlebars helpers and complex expressions
      if (!variable.includes(' ') && !variable.startsWith('#') && !variable.startsWith('/')) {
        variables.add(variable);
      }
    }

    return Array.from(variables);
  }

  /**
   * Renders template with subject line support
   * @param templateHtml - Raw HTML template string
   * @param subjectTemplate - Subject template string (optional)
   * @param data - Data to inject into the template
   * @returns Object containing rendered HTML, text, and subject
   */
  static renderWithSubject(
    templateHtml: string, 
    subjectTemplate?: string, 
    data: any = {}
  ): { html: string; text: string; subject?: string } {
    const { html, text } = this.renderTemplate(templateHtml, data);
    
    let subject: string | undefined;
    if (subjectTemplate) {
      const subjectTemplateCompiled = Handlebars.compile(subjectTemplate);
      subject = subjectTemplateCompiled(data);
    }

    return { html, text, subject };
  }
}
