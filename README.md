# LeafForge

> **Modern, offline-first LaTeX desktop IDE for Fedora Linux**, inspired by Overleaf and VS Code.

LeafForge provides a desktop-native LaTeX authoring environment designed for Linux (GNOME/Wayland). It combines a high-performance Rust backend built on Tauri 2 with Monaco Editor, modern responsive three-panel interface, and system TeX Live integration.

---

## Features (Phase 01)

- **Application Shell**: Native Fedora desktop window using Tauri 2, GTK 3, and WebKitGTK with dark and light theme switching.
- **Project Explorer (Left Panel)**:
  - Recursive file and folder tree navigation.
  - Native file management: create files/folders, rename, delete with confirmation.
  - Distinct icons for `.tex`, `.bib`, graphics, PDFs, and directories.
  - Active file indicator and dirty modification markers.
  - Right-click context menus.
- **Monaco Source Editor (Center Panel)**:
  - Full LaTeX syntax highlighting and code editing.
  - Multi-tab document workspace with state and scroll position preservation across tab switches.
  - LaTeX code snippets (`\section`, `\subsection`, `\begin{document}`, `\begin{figure}`, `\begin{table}`, `\begin{equation}`, `\cite`, `\ref`, and more).
  - Unsaved change indicators and atomic crash-safe file saves.
  - Configurable font size, tab width, word wrapping, and auto-save.
- **PDF Preview (Right Panel)**:
  - Clean component boundary prepared for Phase 02/03 PDF.js viewer and SyncTeX integration.
- **Diagnostics Panel (Bottom Panel)**:
  - Collapsible problems and output panel.
  - Live LaTeX Environment inspector detecting installed TeX Live engines (`latexmk`, `pdflatex`, `xelatex`, `lualatex`, `bibtex`, `tex`).
- **Security & Sandboxing**:
  - Native path canonicalization and symlink escape prevention.
  - Strictly restricts filesystem operations within the designated project root.
  - Atomic temporary-file swapping for document writes.

---

## Architecture Overview

```text
LeafForge/
├── src/                      # Frontend (React 18 + JSX, Vite, Tailwind CSS, Zustand)
│   ├── app/                  # Main layout shell
│   ├── components/           # UI components (Toolbar, Explorer, Editor, Preview, BottomPanel)
│   ├── features/             # Snippets, compiler bridges
│   ├── hooks/                # Shortcuts, theme
│   ├── lib/                  # Tauri IPC abstraction layer
│   ├── stores/               # Zustand state stores (project, editor, UI, settings)
│   └── styles/               # Tailwind CSS directives
├── src-tauri/                # Native Backend (Rust, Tauri 2)
│   ├── src/
│   │   ├── commands/         # IPC command handlers
│   │   ├── models/           # Data models and error definitions
│   │   ├── security/         # PathGuard traversal & symlink prevention
│   │   ├── services/         # Project, file, and LaTeX detection services
│   │   ├── lib.rs            # Tauri application builder & command registry
│   │   └── main.rs           # Entry point
│   ├── capabilities/         # Scoped window capabilities
│   └── tauri.conf.json       # Tauri desktop configuration
├── tests/                    # Automated test suites (Rust & Vitest)
└── docs/                     # Architectural, implementation, and roadmap documentation
```

---

## Fedora Linux Prerequisites

To build and run LeafForge natively on Fedora Linux (GNOME / Wayland):

```bash
# 1. Install system development headers and tools
sudo dnf install -y \
  gcc \
  gcc-c++ \
  make \
  pkgconf-pkg-config \
  webkit2gtk4.1-devel \
  gtk3-devel \
  openssl-devel \
  libsoup3-devel \
  pango-devel \
  cairo-devel \
  gdk-pixbuf2-devel

# 2. Install TeX Live engine
sudo dnf install -y \
  texlive-scheme-basic \
  latexmk \
  texlive-collection-latexrecommended

# 3. Install Rust toolchain (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

# 4. Install Node.js (v18+)
sudo dnf install -y nodejs
```

---

## Development & Build Commands

### Frontend Build & Test
```bash
# Install dependencies
npm install

# Run frontend tests
npm test

# Production frontend bundle
npm run build
```

### Native Backend Build & Test
```bash
# Run Rust unit and integration tests
cargo test --manifest-path src-tauri/Cargo.toml

# Check Rust codebase
cargo check --manifest-path src-tauri/Cargo.toml

# Build native debug executable
cargo build --manifest-path src-tauri/Cargo.toml
```

### Run Desktop Application
```bash
npm run dev
# or
cargo run --manifest-path src-tauri/Cargo.toml
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+S` | Save active document |
| `Ctrl+O` | Open LaTeX project |
| `Ctrl+Alt+N` | New LaTeX project |
| `Ctrl+W` | Close active editor tab |
| `Ctrl+B` | Toggle Project Explorer panel |
| `Ctrl+J` | Toggle Bottom Diagnostics panel |
| `Ctrl+\` | Toggle PDF Preview panel |
| `Ctrl+,` | Open Preferences / Settings |
| `Ctrl+Z` / `Ctrl+Y` | Undo / Redo in Monaco editor |

---

## License

MIT License. See [docs/](docs/) for architectural specifications and development roadmaps.
