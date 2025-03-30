import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";

/**
 * Enhances markdown tables with additional attributes for better rendering
 * Particularly useful for metric form tables in lesson plans
 */
export function enhanceMarkdownTables(
  markdown: string,
  section: string
): string {
  if (section !== "lesson-plan") return markdown;

  // Process the markdown to enhance tables
  const processor = remark()
    .use(remarkParse)
    .use(remarkGfm)
    .use(() => (tree) => {
      // Find tables in the markdown
      visit(tree, "table", (node: any) => {
        // Add a data attribute to identify this as a table
        node.data = node.data || {};
        node.data.hProperties = node.data.hProperties || {};
        node.data.hProperties["data-type"] = "metric-form";
        node.data.hProperties.className = "metric-form-table";
      });
    });

  // Process the markdown
  const processedAst = processor.parse(markdown);
  const enhancedMarkdown = processor.stringify(processedAst);

  return enhancedMarkdown.toString();
}

/**
 * Detects if markdown contains metric form tables
 */
export function containsMetricFormTables(markdown: string): boolean {
  // Simple heuristic to detect metric form tables
  const metricFormPatterns = [
    /\|\s*Metric\s*\|/i,
    /\|\s*Form\s*\|/i,
    /\|\s*Week\s*\|\s*Topic\s*\|/i,
    /\|\s*Unit\s*\|\s*Content\s*\|/i,
  ];

  return metricFormPatterns.some((pattern) => pattern.test(markdown));
}
