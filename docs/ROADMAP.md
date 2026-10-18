# LeafForge — Long-Term Development Roadmap

This roadmap outlines the planned iterations to develop LeafForge into a full-featured, offline-first LaTeX desktop IDE.

---

## Phase 01: Architecture, Project Foundation & Native Desktop UI
- [x] Tauri 2 desktop shell on Fedora Linux.
- [x] Responsive 3-panel workspace (Explorer, Monaco Editor, PDF Preview placeholder).
- [x] Security-hardened filesystem operations (path traversal and symlink escape defenses).
- [x] Atomic document writes.
- [x] Multi-tab Monaco editor with LaTeX syntax and snippet completion.
- [x] Live LaTeX toolchain detection.
- [x] Comprehensive test suites (Rust and Vitest).

---

## Phase 02: LaTeX Engine Execution & Compilation Pipeline
- [ ] **Native Process Orchestration**:
  - Asynchronous background execution of `latexmk`, `pdflatex`, `xelatex`, and `lualatex` via Rust child processes.
  - Streaming stdout / stderr log output into the Bottom Diagnostics panel in real time.
- [ ] **Log Parsing & Diagnostics**:
  - Regex-based LaTeX error and warning parser extracting exact line numbers, files, and TeX error messages.
  - Populate the "Problems" tab with clickable errors that jump to the erroneous line in Monaco Editor.
- [ ] **Build Output Sandboxing**:
  - Configurable auxiliary directory (`build/` or `.leafforge_aux/`) to keep user project roots uncluttered.
  - Automatic cleanup of temporary auxiliary files (`*.aux`, `*.fls`, `*.fdb_latexmk`).
- [ ] **Compile Trigger Options**:
  - Manual compile button (`F5` or `Ctrl+Enter`).
  - Optional auto-compile on save.

---

## Phase 03: Embedded PDF Viewer & Two-Way SyncTeX Navigation
- [ ] **PDF.js Embedded Viewer**:
  - Integration of Mozilla PDF.js inside the right preview panel.
  - Zoom controls, fit-to-width, fit-to-page, continuous scroll, and page jump.
  - Fast canvas rendering with memory optimizations for multi-page documents.
- [ ] **SyncTeX Bi-directional Navigation**:
  - **Forward Sync**: Click in Monaco editor (or `Ctrl+Click`) to navigate to the exact corresponding paragraph/line in the PDF preview.
  - **Inverse Sync**: `Ctrl+Click` on any text in the PDF preview to immediately move the editor cursor to the corresponding `.tex` source line.
  - Parsing `.synctex.gz` using native Rust utilities.

---

## Phase 04: Intelligent LaTeX Editing & TexLab LSP
- [ ] **TexLab Language Server Protocol (LSP)**:
  - Integration of `texlab` language server over stdio via Tauri IPC.
  - Real-time diagnostic squiggles in Monaco editor.
  - Hover documentation for LaTeX commands and environments.
  - Go to definition for `\ref{...}` and `\cite{...}`.
  - Document outline tree (sections, subsections, figures, tables).
- [ ] **Advanced Autocompletion**:
  - Dynamic completion for citation keys from `.bib` files.
  - Dynamic completion for labels from `\label{...}` declarations.

---

## Phase 05: Bibliography Management & Project Templates
- [ ] **Bibliography Explorer**:
  - Dedicated BibTeX entry inspector.
  - Syntax validation and automatic formatting of BibTeX entries.
- [ ] **Project Templates**:
  - Built-in templates for IEEE transactions, ACM proceedings, Springer LNCS, arXiv preprints, books, resumes, and presentation slides (Beamer).

---

## Phase 06: Version History, Local Git & Extensibility
- [ ] **Local Version Snapshots**:
  - Point-in-time document history snapshots before compilations.
  - Side-by-side visual diff viewer using Monaco's diff editor.
- [ ] **Integrated Git Support**:
  - View Git status, modified files, commit history, and branches without leaving the IDE.
- [ ] **Plugin Architecture**:
  - Hook points for custom linters (`chktex`), code formatters (`latexindent`), and spellcheckers.
