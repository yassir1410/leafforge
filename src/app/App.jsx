import React, { useEffect, useRef } from 'react';
import { Toolbar } from '../components/layout/Toolbar';
import { ProjectExplorer } from '../components/explorer/ProjectExplorer';
import { MonacoSourceEditor } from '../components/editor/MonacoSourceEditor';
import { PreviewPlaceholder } from '../components/preview/PreviewPlaceholder';
import { BottomPanel } from '../components/layout/BottomPanel';
import { SettingsModal } from '../components/layout/SettingsModal';
import {
  NewProjectModal,
  OpenProjectModal,
  NewFileDialog,
  RenameDialog,
  DeleteConfirmDialog,
} from '../components/explorer/ProjectModals';
import { useProjectStore } from '../stores/useProjectStore';
import { useEditorStore } from '../stores/useEditorStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useTheme } from '../hooks/useTheme';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { X } from 'lucide-react';

export function App() {
  const { project, openProject, loadRecentProjects, error, clearError } = useProjectStore();
  const { openFile } = useEditorStore();
  const editorRef = useRef(null);

  // Initialize keyboard shortcuts & theme
  useKeyboardShortcuts();
  useTheme();

  // Restore previously opened project on launch
  useEffect(() => {
    loadRecentProjects();
    const lastProject = localStorage.getItem('leafforge_last_project');
    if (lastProject && !project) {
      openProject(lastProject)
        .then((proj) => {
          if (proj?.main_file) {
            openFile(proj.main_file);
          }
        })
        .catch(() => {
          // If previous project doesn't exist anymore, clear it
          localStorage.removeItem('leafforge_last_project');
        });
    }
  }, []);

  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('toolbar', 'undo', null);
      editorRef.current.focus();
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('toolbar', 'redo', null);
      editorRef.current.focus();
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* Top Application Toolbar */}
      <Toolbar onUndo={handleUndo} onRedo={handleRedo} />

      {/* Global Error Notice Banner */}
      {error && (
        <div className="bg-rose-500 text-white text-xs px-4 py-1.5 flex items-center justify-between z-30 select-none animate-in slide-in-from-top-1">
          <span className="font-medium">{error}</span>
          <button
            onClick={clearError}
            className="p-0.5 hover:bg-rose-600 rounded-sm transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main 3-Panel Workspace */}
      <div className="flex-1 flex overflow-hidden relative min-h-0 min-w-0">
        {/* Left: Project Explorer */}
        <ProjectExplorer />

        {/* Center: Monaco Source Editor */}
        <ErrorBoundary
          title="Editor Failed to Render"
          subtitle="Monaco editor encountered an unexpected error."
          fallback={(err, reload) => (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200">
              <div className="p-4 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 max-w-sm text-center space-y-2.5 shadow-sm">
                <p className="font-semibold text-rose-500 text-xs">Editor Rendering Error</p>
                <p className="text-[11px] text-slate-500 font-mono break-all">{err?.message || 'Failed to load editor'}</p>
                <button
                  onClick={reload}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
                >
                  Reload Editor
                </button>
              </div>
            </div>
          )}
        >
          <MonacoSourceEditor editorRef={editorRef} />
        </ErrorBoundary>

        {/* Right: PDF Preview Placeholder */}
        <PreviewPlaceholder />
      </div>

      {/* Bottom Problems / Output / Environment Panel */}
      <BottomPanel />

      {/* Dialogs and Modals */}
      <SettingsModal />
      <NewProjectModal />
      <OpenProjectModal />
      <NewFileDialog />
      <RenameDialog />
      <DeleteConfirmDialog />
    </div>
  );
}

export default App;
