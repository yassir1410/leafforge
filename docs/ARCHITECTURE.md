# LeafForge — Architectural Specification

## 1. Overview & Core Philosophy

LeafForge is designed as an offline-first, native LaTeX desktop IDE for Linux, engineered to deliver the collaborative clarity of Overleaf combined with the speed and reliability of VS Code and native GNOME desktop applications.

### Architectural Principles

1. **Native Offline-First**: LeafForge runs completely locally with zero cloud dependencies. Projects are regular folders on the filesystem containing standard `.tex` and `.bib` files. There are no proprietary wrapper databases or forced file formats.
2. **Security by Design**: Native desktop applications with web views must treat frontend input as untrusted. Filesystem operations are strictly sandboxed within the project boundary using path canonicalization and symlink dereferencing.
3. **Decoupled Architecture**: Clear boundaries separate the Native Host Layer (Rust / Tauri 2), State Management (Zustand), Source Editing (Monaco), Compilation Pipeline, and PDF Preview.
4. **Predictable State Machines**: All UI state transitions (tab lifecycle, dirty markers, panel layouts) are managed deterministically through lightweight reactive stores without redundant caching of large file contents.

---

## 2. Technology Stack & Component Hierarchy

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        LeafForge Desktop Shell                         │
├────────────────────────────────────────────────────────────────────────┤
│ Application Toolbar                                                    │
│ [Logo] [Project Name] [New] [Open] [Save] [Undo/Redo] [Compiler] [UI]  │
├────────────────────┬─────────────────────────────┬─────────────────────┤
│ Project Explorer   │ Monaco Source Editor        │ PDF Preview (Ph 03) │
│ - Tree navigation  │ - Multi-tab strip           │ - PDF.js container  │
│ - New file/folder  │ - Syntax highlighting       │ - Empty state       │
│ - Rename/Delete    │ - Snippets completion       │ - Zoom controls     │
│ - Context menus    │ - Auto-save debouncing      │ - Two-way SyncTeX   │
│ - Dirty markers    │ - ViewState preservation    │                     │
├────────────────────┴─────────────────────────────┴─────────────────────┤
│ Collapsible Diagnostics Panel                                          │
│ [LaTeX Environment Tools] [Session Output] [Problems (0)]              │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                         Tauri 2 IPC (JSON-RPC)
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Native Rust Backend (Tauri 2)                       │
├─────────────────┬─────────────────┬──────────────────┬─────────────────┤
│ PathGuard       │ ProjectService  │ FileService      │ LaTeXDetector   │
│ - Canonicalize  │ - create/open   │ - Atomic writes  │ - latexmk       │
│ - Traversal chk │ - main.tex gen  │ - Tree listing   │ - pdflatex      │
│ - Symlink check │ - Recent config │ - Safe CRUD ops  │ - xelatex/lua   │
└─────────────────┴─────────────────┴──────────────────┴─────────────────┘
```

---

## 3. Security Architecture

### 3.1 Path Traversal & Symlink Defense (`PathGuard`)

All filesystem requests flowing through Tauri IPC commands must pass through `PathGuard::validate_within_project(project_root, target_path)`:

1. **Root Canonicalization**: Resolves `project_root` to its absolute, canonical canonicalized path.
2. **Existing File Resolution**: If the target exists, `fs::canonicalize` resolves all intermediate components and symbolic links. The resulting canonical path is verified using `.starts_with(&canonical_root)`. If a symlink points to `/etc/shadow` or any path outside the project folder, the operation is immediately rejected with `LeafForgeError::Security`.
3. **New File Normalization**: If the path does not exist yet (e.g., creating a new file or directory), `PathGuard` traverses upward to find the nearest existing ancestor, canonicalizes it, checks project containment, and verifies all non-existing leaf components for path traversal attempts (`..`, `.`, `/`, `\0`).
4. **Name Sanitization**: Node names cannot contain path separators or traversal characters.

### 3.2 Atomic File Writes

Writing files to disk directly can corrupt documents if the computer loses power or the process crashes during I/O. `FileService::write_file` implements atomic persistence:

```rust
// 1. Create a hidden temporary file in the same target folder
let mut temp_file = tempfile::Builder::new()
    .prefix(".leafforge_tmp_")
    .tempfile_in(parent_dir)?;

// 2. Write and flush all UTF-8 data to disk
temp_file.write_all(content.as_bytes())?;
temp_file.flush()?;

// 3. Atomically rename temporary file over target path
temp_file.persist(&validated_path)?;
```

This guarantees that the document on disk is either the previous valid version or the complete new version—never a truncated or corrupted file.

---

## 4. Frontend State Architecture

State is split cleanly across focused Zustand stores:

### 4.1 `useProjectStore`
- Manages active project metadata (`name`, `path`, `main_file`, `created_at`).
- Holds the hierarchical `fileTree` data.
- Dispatches asynchronous project actions: `createProject`, `openProject`, `refreshFileTree`, `createFile`, `renameNode`, `deleteNode`.

### 4.2 `useEditorStore`
- Multi-tab data structure: `[{ id, path, name, content, originalContent, isDirty, viewState }]`.
- Tracks `activeTabId`.
- Compares `content !== originalContent` to maintain the `isDirty` marker.
- Caches Monaco `editor.saveViewState()` on tab switch, seamlessly restoring scroll line and cursor location when returning to a tab.
- Guards tab closing with an accessible modal dialog when unsaved modifications exist.

### 4.3 `useUIStore`
- Panel dimensions with bounded resizing (`explorerWidth`, `previewWidth`, `bottomPanelHeight`).
- Panel toggles (`isExplorerOpen`, `isPreviewOpen`, `isBottomPanelOpen`).
- Dark / light theme toggle synced to the document root element and persisted in `localStorage`.
- Modal state management for dialogs.

### 4.4 `useSettingsStore`
- User preferences: `fontSize`, `tabSize`, `wordWrap`, `lineNumbers`, `defaultCompiler`, `autoSave`.
- Synchronized to `localStorage`.

---

## 5. Monaco Editor & LaTeX Snippets

Monaco Editor (`@monaco-editor/react`) provides the core text editing experience. On mount, LeafForge registers a custom LaTeX completion provider that provides standard LaTeX macros and environments:

- `\section{...}`
- `\subsection{...}`
- `\subsubsection{...}`
- `\begin{document}...\end{document}`
- `\begin{figure}...\end{figure}`
- `\begin{table}...\end{table}`
- `\begin{equation}...\end{equation}`
- `\begin{itemize}` / `\begin{enumerate}`
- `\cite{...}` and `\ref{...}`

---

## 6. IPC Interface Specification

| Command | Arguments | Return Type | Description |
|---|---|---|---|
| `create_project` | `project_path`, `project_name` | `ProjectInfo` | Generates project folder and standard `main.tex` |
| `open_project` | `project_path` | `ProjectInfo` | Validates directory and locates main entry document |
| `list_recent_projects` | None | `Vec<RecentProject>` | Returns list of recently opened projects from `~/.config` |
| `list_project_files` | `project_root` | `FileNode` | Generates recursive file tree of project folder |
| `read_file_content` | `project_root`, `file_path` | `String` | Reads UTF-8 file content within project bounds |
| `write_file_content` | `project_root`, `file_path`, `content` | `()` | Atomically persists file content |
| `create_file` | `project_root`, `file_path`, `initial_content` | `String` | Creates new file inside project |
| `create_directory` | `project_root`, `dir_path` | `String` | Creates new directory inside project |
| `rename_node` | `project_root`, `old_path`, `new_name` | `String` | Renames file or directory |
| `delete_node` | `project_root`, `target_path` | `()` | Deletes file or directory |
| `detect_latex_tools` | None | `LaTeXEnvironment` | Detects installed TeX Live engines and tools |
| `get_system_info` | None | `SystemInfo` | Retrieves OS and desktop environment metadata |
