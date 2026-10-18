# LeafForge — Critical Frontend Rendering Bug: Diagnosis & Repair Report

**Date**: 2026-10-18  
**Target Environment**: Fedora Linux (GNOME / Wayland), WebKitGTK / Chromium  
**Status**: Verified & Resolved  

---

## 1. Executive Summary

When launching LeafForge via Tauri 2 or accessing `http://localhost:1420`, the application window previously opened to an empty dark navy canvas with an unmounted workspace and a narrow white artifact along the right margin.

The investigation identified two distinct issues:
1. **Primary Fatal Crash**: A runtime `ReferenceError` inside the Monaco editor component caused React 18's reconciler to unmount the entire component tree, leaving only the static HTML body.
2. **Secondary CSS Overflow & Styling Bugs**: The combination of `w-screen` (`100vw`), unconstrained flex item dimensions, and lack of an initial dark class on the HTML document created viewport overflow and an exposed light background stripe.

Both issues have been repaired, guarded with application-level and localized React Error Boundaries, and validated with automated regression suites across frontend and backend.

---

## 2. Root Cause Analysis

### 2.1 The Fatal Exception: Uncaught ReferenceError in `MonacoSourceEditor.jsx`

Inside `src/components/editor/MonacoSourceEditor.jsx`:

```javascript
// MonacoSourceEditor.jsx (before repair)
export function MonacoSourceEditor() {
  const {
    tabs,
    activeTabId,
    updateTabContent,
    markTabDirty,
    saveViewState,
  } = useEditorStore(); // <-- saveTab was NOT destructured

  // ...
  useEffect(() => {
    // ...
  }, [activeTabId, activeTab?.viewState, saveViewState, tabs, saveTab]); // <-- Line 74: ReferenceError
```

- `saveTab` was added as a dependency in the `useEffect` hook without being destructured from the `useEditorStore` Zustand hook.
- In JavaScript / ECMAScript scope resolution, referencing an undeclared identifier evaluates to `Uncaught ReferenceError: saveTab is not defined`.
- **React 18 Component Tree Unmounting**: Because there was no React Error Boundary wrapping `<App />` or `<MonacoSourceEditor />`, React 18 treated the render exception as fatal to the entire mounting phase. React unmounted `#root`, reducing the rendered DOM to zero nodes:
  ```html
  <div id="root" class="h-screen w-screen"></div>
  ```
- The user only saw the background color applied to `index.html`'s `<body class="bg-slate-900">`.

### 2.2 Secondary Artifact: The Narrow White Edge

- In `index.html` and `src/app/App.jsx`, the root container was configured with `w-screen` (`100vw`). In Linux desktop browsers and WebKitGTK WebViews, `100vw` encompasses the entire viewport width including potential scrollbar gutters.
- This forced a subtle horizontal overflow. Because `index.html` lacked the `dark` class on `<html>` by default, any uncovered window area fell back to the browser's default white background canvas.
- Additionally, `BottomPanel.jsx` had a fallback background class of `bg-white dark:bg-slate-900`, which could flicker light if the dark class hierarchy was delayed.

---

## 3. Implemented Fixes

### 3.1 Monaco Editor Store Destructuring (`MonacoSourceEditor.jsx`)
Destructured `saveTab` from `useEditorStore`:
```javascript
export function MonacoSourceEditor() {
  const {
    tabs,
    activeTabId,
    updateTabContent,
    markTabDirty,
    saveViewState,
    saveTab, // <-- Properly destructured
  } = useEditorStore();
```

### 3.2 Error Boundary Architecture (`ErrorBoundary.jsx`)
Created a production-grade class-based Error Boundary in `src/components/common/ErrorBoundary.jsx`:
- Catches any component rendering lifecycle errors.
- Displays the error message and component stack in a stylized, theme-aware card.
- Provides two recovery actions:
  - **Reload LeafForge**: `window.location.reload()`
  - **Reset State & Reload**: Clears persisted `localStorage` keys and reloads cleanly.
- Deployed at two levels:
  - **Root Application**: In `src/main.jsx`, wrapping `<App />`.
  - **Editor Subsystem**: In `src/app/App.jsx`, wrapping `<MonacoSourceEditor />` to isolate potential future editor crashes from collapsing the project explorer or toolbar.

### 3.3 Viewport & Layout Sizing Corrections
1. **`index.html`**:
   - Added class `dark` directly to `<html>`.
   - Inlined a synchronous theme initialization script in `<head>` to prevent Flash of Unstyled Content (FOUC).
   - Replaced `h-screen w-screen` with `h-full w-full`.
2. **`src/styles/index.css`**:
   - Updated Tailwind CSS 4 custom variant:
     ```css
     @custom-variant dark (&:where(.dark, .dark *));
     ```
   - Added explicit base styles:
     ```css
     html, body, #root {
       height: 100%;
       width: 100%;
       margin: 0;
       padding: 0;
       overflow: hidden;
     }
     ```
3. **`src/app/App.jsx`**:
   - Container changed from `h-screen w-screen` to `h-full w-full overflow-hidden`.
   - Flex workspace children given `min-h-0 min-w-0` to prevent flex items from overflowing or shifting sibling panels off-screen.
4. **`src/components/layout/BottomPanel.jsx`**:
   - Replaced `bg-white` with `bg-slate-50 dark:bg-slate-900 min-h-0`.

---

## 4. Verification & Testing

### 4.1 Frontend Test Suite (`vitest`)
All 5 test suites containing 27 automated tests pass:
```bash
npm test
```
```text
 ✓ tests/frontend/autosave.test.js (5 tests)
 ✓ tests/frontend/components.test.jsx (5 tests)
 ✓ tests/frontend/snippets.test.js (4 tests)
 ✓ tests/frontend/stores.test.js (4 tests)
 ✓ tests/frontend/app.test.jsx (9 tests)

Test Files  5 passed (5)
     Tests  27 passed (27)
  Duration  3.50s
```

The new test suite `tests/frontend/app.test.jsx` explicitly verifies:
1. Application shell mounts without crashing.
2. Toolbar renders branding, action buttons, and compilation dropdown.
3. Project Explorer empty state and actions mount.
4. Editor empty state and snippet shortcuts render.
5. PDF Preview placeholder and roadmap callouts render.
6. Diagnostics bottom panel tabs (Environment, Output, Problems) mount and function.
7. Dark and Light theme toggle transitions correctly.
8. Persisted layout bounds clamp invalid values safely.
9. ErrorBoundary catches component-level render crashes and renders recovery controls.

### 4.2 Production Bundle Build (`vite build`)
```bash
npm run build
```
```text
dist/index.html                   1.33 kB │ gzip:  0.76 kB
dist/assets/index-B1ViHtOT.css   36.96 kB │ gzip:  7.24 kB
dist/assets/core-DV6XEvTN.js      0.10 kB │ gzip:  0.11 kB
dist/assets/index-CJbqyGE5.js   272.77 kB │ gzip: 80.91 kB
✓ built in 2.76s
```

### 4.3 Rust Tauri 2 Backend Tests (`cargo test`)
```bash
PKG_CONFIG_PATH="/home/yassir14/Documents/LeafForge/sysroot/usr/lib64/pkgconfig:/home/yassir14/Documents/LeafForge/sysroot/usr/share/pkgconfig" \
LIBRARY_PATH="/home/yassir14/Documents/LeafForge/sysroot/usr/lib64" \
cargo test --manifest-path src-tauri/Cargo.toml
```
```text
running 15 tests
test security::path_guard::tests::test_safe_node_name ... ok
test security::path_guard::tests::test_relative_path_within_project ... ok
test security::project_registry::tests::test_reject_system_directories ... ok
test security::path_guard::tests::test_path_traversal_prevention ... ok
test security::project_registry::tests::test_register_and_verify_project ... ok
test security::path_guard::tests::test_valid_file_within_project ... ok
test security::path_guard::tests::test_destructive_protection ... ok
test security::path_guard::tests::test_symlink_write_forbidden ... ok
test security::path_guard::tests::test_symlink_escape_prevention ... ok
test services::file_service::tests::test_create_and_delete_node ... ok
test services::file_service::tests::test_rename_node ... ok
test services::file_service::tests::test_list_and_read_write_atomic ... ok
test services::project_service::tests::test_open_existing_project ... ok
test services::project_service::tests::test_create_project_generates_main_tex ... ok
test services::latex_service::tests::test_detect_tools_returns_results ... ok

test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; finished in 0.15s
```

### 4.4 Native Desktop Launch
The compiled native executable `src-tauri/target/debug/leafforge` was launched under Fedora GNOME / Wayland:
- Initialized GTK3 / WebKitGTK runtime with zero errors or segmentation faults.
- Window loaded and rendered the complete LeafForge desktop interface.
- Confirmed zero console errors or unmounted regions.
