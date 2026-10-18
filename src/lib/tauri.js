/**
 * Tauri IPC abstraction layer
 * Safely invokes Tauri backend commands when running inside Tauri,
 * or handles simulated fallback in test/browser environments.
 */

export const isTauri = () => {
  return typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__);
};

export async function invokeCommand(cmd, args = {}) {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    try {
      return await invoke(cmd, args);
    } catch (err) {
      console.error(`Tauri command '${cmd}' failed:`, err);
      // Format backend LeafForgeError if serialized as object { type, message }
      if (err && typeof err === 'object' && err.message) {
        throw new Error(err.message);
      }
      throw new Error(typeof err === 'string' ? err : 'Unknown backend error');
    }
  } else {
    // Development / Browser / Testing fallback
    return handleBrowserMock(cmd, args);
  }
}

// In-memory mock storage for browser testing
let mockFiles = {
  'main.tex': `\\documentclass[12pt,a4paper]{article}

\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}

\\title{Untitled Document}
\\author{LeafForge User}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}

Welcome to LeafForge, your offline-first LaTeX desktop IDE!

\\subsection{Features}

\\begin{equation}
E = mc^2
\\end{equation}

\\end{document}
`,
  'references.bib': `@article{einstein1905,
  author = {Einstein, Albert},
  title = {Zur Elektrodynamik bewegter K{\\"o}rper},
  journal = {Annalen der Physik},
  volume = {322},
  number = {10},
  pages = {891--921},
  year = {1905}
}
`,
};

function handleBrowserMock(cmd, args) {
  switch (cmd) {
    case 'create_project': {
      const name = args.project_name || 'My LaTeX Project';
      return {
        name,
        path: args.project_path || '/home/user/Documents/MyProject',
        main_file: `${args.project_path || '/home/user/Documents/MyProject'}/main.tex`,
        created_at: new Date().toISOString(),
      };
    }

    case 'open_project': {
      const parts = (args.project_path || '/home/user/Documents/MyProject').split('/');
      const name = parts[parts.length - 1] || 'My LaTeX Project';
      return {
        name,
        path: args.project_path,
        main_file: `${args.project_path}/main.tex`,
        created_at: new Date().toISOString(),
      };
    }

    case 'list_recent_projects': {
      const raw = localStorage.getItem('leafforge_mock_recent');
      return raw ? JSON.parse(raw) : [
        {
          name: 'LeafForge Sample Paper',
          path: '/home/user/Documents/LeafForgeSample',
          last_opened: new Date().toISOString(),
        }
      ];
    }

    case 'list_project_files': {
      const root = args.project_root || '/project';
      return {
        id: root,
        name: 'MyProject',
        path: root,
        relative_path: '',
        is_dir: true,
        extension: null,
        children: Object.keys(mockFiles).map((filename) => ({
          id: `${root}/${filename}`,
          name: filename,
          path: `${root}/${filename}`,
          relative_path: filename,
          is_dir: false,
          extension: filename.split('.').pop(),
          size: mockFiles[filename].length,
          children: null,
        })),
      };
    }

    case 'read_file_content': {
      const filename = args.file_path.split('/').pop();
      if (mockFiles[filename] !== undefined) {
        return mockFiles[filename];
      }
      return `% Empty or new file: ${filename}\n`;
    }

    case 'write_file_content': {
      const filename = args.file_path.split('/').pop();
      mockFiles[filename] = args.content;
      return null;
    }

    case 'create_file': {
      const filename = args.file_path.split('/').pop();
      mockFiles[filename] = args.initial_content || '';
      return args.file_path;
    }

    case 'create_directory': {
      return args.dir_path;
    }

    case 'rename_node': {
      const oldFilename = args.old_path.split('/').pop();
      if (mockFiles[oldFilename] !== undefined) {
        mockFiles[args.new_name] = mockFiles[oldFilename];
        delete mockFiles[oldFilename];
      }
      return `${args.old_path.substring(0, args.old_path.lastIndexOf('/'))}/${args.new_name}`;
    }

    case 'delete_node': {
      const filename = args.target_path.split('/').pop();
      delete mockFiles[filename];
      return null;
    }

    case 'detect_latex_tools': {
      return {
        has_latexmk: true,
        has_pdflatex: true,
        has_xelatex: true,
        has_lualatex: true,
        has_bibtex: true,
        engines: [
          { name: 'Latexmk Build Engine', command: 'latexmk', available: true, path: '/usr/bin/latexmk', version: 'Latexmk, John Collins, 2026' },
          { name: 'pdfLaTeX Engine', command: 'pdflatex', available: true, path: '/usr/bin/pdflatex', version: 'pdfTeX 3.141592653-2.6-1.40.26 (TeX Live 2026)' },
          { name: 'XeLaTeX Engine', command: 'xelatex', available: true, path: '/usr/bin/xelatex', version: 'XeTeX 3.141592653-2.6-0.999996' },
          { name: 'LuaLaTeX Engine', command: 'lualatex', available: true, path: '/usr/bin/lualatex', version: 'LuaHBTeX 1.18.0' },
          { name: 'BibTeX Engine', command: 'bibtex', available: true, path: '/usr/bin/bibtex', version: 'BibTeX 0.99d' },
        ],
      };
    }

    case 'get_system_info': {
      return {
        os: 'linux',
        arch: 'x86_64',
        host: 'Fedora Linux / GNOME Wayland (Simulated)',
      };
    }

    default:
      console.warn(`Unimplemented mock command: ${cmd}`);
      return null;
  }
}
