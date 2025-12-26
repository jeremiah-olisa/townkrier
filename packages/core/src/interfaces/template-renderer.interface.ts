/**
 * Interface for template renderers
 * Implement this interface to use custom template engines (e.g., EJS, Pug, React)
 */
export interface ITemplateRenderer {
  /**
   * Render a template with the given context
   * @param template Path to template or template content
   * @param context Data to render the template with
   * @returns Rendered HTML string or Promise resolving to HTML string
   */
  render(template: string, context: Record<string, unknown>): Promise<string> | string;
}
