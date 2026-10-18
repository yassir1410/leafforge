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
    <div className="h-screen w-screen flex flex-col bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* Top Application Toolbar */}
      <Toolbar onUndo={handleUndo} onRedo={handleRedo} />

      {/* Global Error Notice Banner */}
      {error && (
        <div className="bg-rose-500 text-white text-xs px-4 py-1.5 flex items-center justify-between z-30 select-none animate-in slide-in-from-top-1">
          <span className="font-medium">{error}</span>
          <button
            onClick={clearError}
            className="p-0.5 hover:bg-rose-600 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main 3-Panel Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Project Explorer */}
        <ProjectExplorer />

        {/* Center: Monaco Source Editor */}
        <MonacoSourceEditor editorRef={editorRef} />

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
