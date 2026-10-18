import { describe, it, expect } from 'vitest';
import { LATEX_SNIPPETS } from '../../src/features/editor/latexSnippets';

describe('LaTeX Snippets', () => {
  const requiredSnippetLabels = [
    '\\section',
    '\\subsection',
    '\\begin{document}',
    '\\begin{figure}',
    '\\begin{table}',
    '\\begin{equation}',
    '\\cite',
    '\\ref',
  ];

  it('contains all required Phase 01 snippets', () => {
    const labels = LATEX_SNIPPETS.map((s) => s.label);
    for (const required of requiredSnippetLabels) {
      expect(labels).toContain(required);
    }
  });

  it('each snippet has valid insertText and documentation', () => {
    for (const snippet of LATEX_SNIPPETS) {
      expect(snippet.label).toBeTruthy();
      expect(snippet.insertText).toBeTruthy();
      expect(snippet.documentation).toBeTruthy();
    }
  });
});
