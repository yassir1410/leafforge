import { create } from 'zustand';
import { invokeCommand } from '../lib/tauri';
import { useProjectStore } from './useProjectStore';

export const useEditorStore = create((set, get) => ({
  tabs: [],
  activeTabId: null,
  pendingCloseTab: null,

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find((t) => t.id === activeTabId) || null;
  },

  openFile: async (filePath, fileName) => {
    const { tabs } = get();
    const existing = tabs.find((t) => t.path === filePath);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }

    const project = useProjectStore.getState().project;
    if (!project) return;

    try {
      const content = await invokeCommand('read_file_content', {
        project_root: project.path,
        file_path: filePath,
      });

      const newTab = {
        id: filePath,
        path: filePath,
        name: fileName || filePath.split('/').pop(),
        content: content || '',
        originalContent: content || '',
        isDirty: false,
        viewState: null,
      };

      set({
        tabs: [...tabs, newTab],
        activeTabId: newTab.id,
      });
    } catch (err) {
      console.error(`Failed to open file ${filePath}:`, err);
      useProjectStore.getState().setError(`Failed to read file: ${err.message}`);
    }
  },

  setActiveTab: (tabId) => {
    set({ activeTabId: tabId });
  },

  updateContent: (tabId, newContent) => {
    set((state) => ({
      tabs: state.tabs.map((tab) => {
        if (tab.id === tabId) {
          const isDirty = newContent !== tab.originalContent;
          return { ...tab, content: newContent, isDirty };
        }
        return tab;
      }),
    }));
  },

  saveTab: async (tabId) => {
    const { tabs } = get();
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;

    const project = useProjectStore.getState().project;
    if (!project) return;

    try {
      await invokeCommand('write_file_content', {
        project_root: project.path,
        file_path: tab.path,
        content: tab.content,
      });

      set((state) => ({
        tabs: state.tabs.map((t) =>
          t.id === tabId ? { ...t, originalContent: t.content, isDirty: false } : t
        ),
      }));

      // Refresh project explorer file tree to update sizes/timestamps
      useProjectStore.getState().refreshFileTree();
    } catch (err) {
      console.error(`Failed to save file ${tab.path}:`, err);
      useProjectStore.getState().setError(`Save error: ${err.message}`);
      throw err;
    }
  },

  saveActiveTab: async () => {
    const { activeTabId, saveTab } = get();
    if (activeTabId) {
      await saveTab(activeTabId);
    }
  },

  saveViewState: (tabId, viewState) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, viewState } : tab
      ),
    }));
  },

  requestCloseTab: (tabId) => {
    const { tabs } = get();
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;

    if (tab.isDirty) {
      set({ pendingCloseTab: tab });
    } else {
      get().closeTab(tabId, true);
    }
  },

  dismissCloseDialog: () => {
    set({ pendingCloseTab: null });
  },

  closeTab: (tabId, force = false) => {
    const { tabs, activeTabId } = get();
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;

    if (tab.isDirty && !force) {
      set({ pendingCloseTab: tab });
      return;
    }

    const newTabs = tabs.filter((t) => t.id !== tabId);
    let newActiveId = activeTabId;

    if (activeTabId === tabId) {
      if (newTabs.length > 0) {
        const closedIndex = tabs.findIndex((t) => t.id === tabId);
        const nextIndex = Math.min(closedIndex, newTabs.length - 1);
        newActiveId = newTabs[nextIndex].id;
      } else {
        newActiveId = null;
      }
    }

    set({
      tabs: newTabs,
      activeTabId: newActiveId,
      pendingCloseTab: null,
    });
  },

  closeAllTabs: () => {
    set({ tabs: [], activeTabId: null, pendingCloseTab: null });
  },
}));
