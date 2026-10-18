import { create } from 'zustand';

const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('leafforge_theme') || 'dark' : 'dark';

export const useUIStore = create((set, get) => ({
  // Theme
  theme: savedTheme,
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') {
      localStorage.setItem('leafforge_theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    set({ theme: nextTheme });
  },
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('leafforge_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    set({ theme });
  },

  // Panel sizing
  explorerWidth: 260,
  previewWidth: 420,
  bottomPanelHeight: 180,
  setExplorerWidth: (width) => set({ explorerWidth: Math.max(160, Math.min(width, 500)) }),
  setPreviewWidth: (width) => set({ previewWidth: Math.max(240, Math.min(width, 800)) }),
  setBottomPanelHeight: (height) => set({ bottomPanelHeight: Math.max(90, Math.min(height, 500)) }),

  // Panel visibility
  isExplorerOpen: true,
  isPreviewOpen: true,
  isBottomPanelOpen: true,
  bottomPanelTab: 'environment', // 'output' | 'problems' | 'environment'
  toggleExplorer: () => set((state) => ({ isExplorerOpen: !state.isExplorerOpen })),
  togglePreview: () => set((state) => ({ isPreviewOpen: !state.isPreviewOpen })),
  toggleBottomPanel: () => set((state) => ({ isBottomPanelOpen: !state.isBottomPanelOpen })),
  setBottomPanelTab: (tab) => set({ bottomPanelTab: tab, isBottomPanelOpen: true }),

  // Modals & Dialogs
  isSettingsOpen: false,
  isNewProjectOpen: false,
  isOpenProjectOpen: false,
  newFileDialog: null, // null | { parentPath, isDir }
  deleteConfirmDialog: null, // null | { path, name, isDir }
  renameDialog: null, // null | { path, name, isDir }

  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),

  openNewProjectModal: () => set({ isNewProjectOpen: true }),
  closeNewProjectModal: () => set({ isNewProjectOpen: false }),

  openOpenProjectModal: () => set({ isOpenProjectOpen: true }),
  closeOpenProjectModal: () => set({ isOpenProjectOpen: false }),

  openNewFileDialog: (parentPath = '', isDir = false) =>
    set({ newFileDialog: { parentPath, isDir } }),
  closeNewFileDialog: () => set({ newFileDialog: null }),

  openDeleteConfirm: (path, name, isDir) =>
    set({ deleteConfirmDialog: { path, name, isDir } }),
  closeDeleteConfirm: () => set({ deleteConfirmDialog: null }),

  openRenameDialog: (path, name, isDir) =>
    set({ renameDialog: { path, name, isDir } }),
  closeRenameDialog: () => set({ renameDialog: null }),
}));
