import { useEffect } from 'react';
import { useEditorStore } from '../stores/useEditorStore';
import { useUIStore } from '../stores/useUIStore';

export function useKeyboardShortcuts() {
  const { getActiveTab, saveActiveTab, requestCloseTab } = useEditorStore();
  const {
    openOpenProjectModal,
    openNewProjectModal,
    openSettings,
    toggleExplorer,
    toggleBottomPanel,
    togglePreview,
  } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      if (!isCmdOrCtrl) return;

      // Ctrl+S: Save active file
      if (e.key === 's' || e.key === 'S') {
        if (!e.shiftKey && !e.altKey) {
          e.preventDefault();
          saveActiveTab();
        }
      }

      // Ctrl+O: Open project
      else if (e.key === 'o' || e.key === 'O') {
        if (!e.shiftKey && !e.altKey) {
          e.preventDefault();
          openOpenProjectModal();
        }
      }

      // Ctrl+Alt+N: New project
      else if ((e.key === 'n' || e.key === 'N') && e.altKey) {
        e.preventDefault();
        openNewProjectModal();
      }

      // Ctrl+W: Close active tab
      else if (e.key === 'w' || e.key === 'W') {
        if (!e.shiftKey && !e.altKey) {
          const activeTab = getActiveTab();
          if (activeTab) {
            e.preventDefault();
            requestCloseTab(activeTab.id);
          }
        }
      }

      // Ctrl+B: Toggle explorer
      else if (e.key === 'b' || e.key === 'B') {
        if (!e.shiftKey && !e.altKey) {
          e.preventDefault();
          toggleExplorer();
        }
      }

      // Ctrl+J: Toggle bottom panel
      else if (e.key === 'j' || e.key === 'J') {
        if (!e.shiftKey && !e.altKey) {
          e.preventDefault();
          toggleBottomPanel();
        }
      }

      // Ctrl+\: Toggle preview panel
      else if (e.key === '\\') {
        e.preventDefault();
        togglePreview();
      }

      // Ctrl+,: Open Settings
      else if (e.key === ',') {
        e.preventDefault();
        openSettings();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    getActiveTab,
    saveActiveTab,
    requestCloseTab,
    openOpenProjectModal,
    openNewProjectModal,
    openSettings,
    toggleExplorer,
    toggleBottomPanel,
    togglePreview,
  ]);
}
