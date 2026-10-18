/**
 * LaTeX code snippets for Monaco Editor
 */

export const LATEX_SNIPPETS = [
  {
    label: '\\section',
    documentation: 'Insert a new LaTeX section',
    insertText: '\\section{${1:Section Title}}\n\\label{sec:${2:label}}\n\n${0}',
  },
  {
    label: '\\subsection',
    documentation: 'Insert a new LaTeX subsection',
    insertText: '\\subsection{${1:Subsection Title}}\n\\label{subsec:${2:label}}\n\n${0}',
  },
  {
    label: '\\subsubsection',
    documentation: 'Insert a new LaTeX subsubsection',
    insertText: '\\subsubsection{${1:Subsubsection Title}}\n\\label{subsubsec:${2:label}}\n\n${0}',
  },
  {
    label: '\\begin{document}',
    documentation: 'Document environment with standard setup',
    insertText: '\\begin{document}\n\n\\maketitle\n\n${0}\n\n\\end{document}',
  },
  {
    label: '\\begin{figure}',
    documentation: 'Centered figure with caption and label',
    insertText: `\\begin{figure}[htbp]
  \\centering
  \\includegraphics[width=\\linewidth]{$\{1:image.png\}}
  \\caption{$\{2:Caption text\}}
  \\label{fig:$\{3:label\}}
\\end{figure}
$\{0}`,
  },
  {
    label: '\\begin{table}',
    documentation: 'Table environment with tabular, caption, and label',
    insertText: `\\begin{table}[htbp]
  \\centering
  \\caption{$\{1:Table caption\}}
  \\label{tab:$\{2:label\}}
  \\begin{tabular}{$\{3:l c r\}}
    \\hline
    $\{4:Col 1} & $\{5:Col 2} & $\{6:Col 3} \\\\
    \\hline
    $\{7:Val 1} & $\{8:Val 2} & $\{9:Val 3} \\\\
    \\hline
  \\end{tabular}
\\end{table}
$\{0}`,
  },
  {
    label: '\\begin{equation}',
    documentation: 'Numbered equation environment',
    insertText: `\\begin{equation}
  \\label{eq:$\{1:label\}}
  $\{0:E = mc^2}
\\end{equation}`,
  },
  {
    label: '\\begin{itemize}',
    documentation: 'Bulleted list',
    insertText: `\\begin{itemize}
  \\item $\{1:First item}
  \\item $\{2:Second item}
\\end{itemize}
$\{0}`,
  },
  {
    label: '\\begin{enumerate}',
    documentation: 'Numbered list',
    insertText: `\\begin{enumerate}
  \\item $\{1:First item}
  \\item $\{2:Second item}
\\end{enumerate}
$\{0}`,
  },
  {
    label: '\\cite',
    documentation: 'Citation reference',
    insertText: '\\cite{${1:citation_key}}${0}',
  },
  {
    label: '\\ref',
    documentation: 'Cross-reference to a label',
    insertText: '\\ref{${1:label_key}}${0}',
  },
  {
    label: '\\textbf',
    documentation: 'Bold text',
    insertText: '\\textbf{${1:bold text}}${0}',
  },
  {
    label: '\\textit',
    documentation: 'Italic text',
    insertText: '\\textit{${1:italic text}}${0}',
  },
  {
    label: '\\usepackage',
    documentation: 'Package import statement',
    insertText: '\\usepackage[${1:options}]{${2:package}}${0}',
  },
];

/**
 * Registers LaTeX snippets with the Monaco editor instance
 */
export function registerLatexSnippets(monaco) {
  if (!monaco) return;

  // Check if provider already registered
  if (window.__leafforge_snippets_registered) return;
  window.__leafforge_snippets_registered = true;

  monaco.languages.registerCompletionItemProvider('latex', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions = LATEX_SNIPPETS.map((snippet) => ({
        label: snippet.label,
        kind: monaco.languages.CompletionItemKind.Snippet,
        documentation: snippet.documentation,
        insertText: snippet.insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
      }));

      return { suggestions };
    },
  });
}
