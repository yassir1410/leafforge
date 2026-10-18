import { create } from 'zustand';
import { invokeCommand } from '../lib/tauri';
import { useProjectStore } from './useProjectStore';

// In-flight save tracking and queue per file path
const savingTabIds = new Set();
const pendingSaveQueues = new Set();

export const useEditorStore = create((set, get) => ({
  tabs: [],
  activeTabId: null,
  pendingCloseTab: null,
  isSaving: false,
  isTabSaving: (tabId) => savingTabIds.has(tabId),

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

  /**
   * Concurrency-safe saveTab:
   * 1. Snapshots content at moment of save initiation.
   * 2. Serializes in-flight saves per tab. If already saving, queues another save after current one finishes.
   * 3. On success, updates originalContent to the snapshot.
   * 4. Accurately preserves isDirty if newer edits arrived while async write was in-flight.
   */
  saveTab: async (tabId) => {
    const { tabs } = get();
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;

    // If already saving this tab, queue a follow-up save and return
    if (savingTabIds.has(tabId)) {
      pendingSaveQueues.add(tabId);
      return;
    }

    const project = useProjectStore.getState().project;
    if (!project) return;

    savingTabIds.add(tabId);
    set({ isSaving: true });

    // Snapshot content strictly before starting async I/O
    const contentSnapshot = tab.content;

    try {
      await invokeCommand('write_file_content', {
        project_root: project.path,
        file_path: tab.path,
        content: contentSnapshot,
      });

      // Update store state safely against concurrent edits
      set((state) => ({
        tabs: state.tabs.map((t) => {
          if (t.id === tabId) {
            // If the user made further edits during the write, isDirty must remain true!
            const hasNewEdits = t.content !== contentSnapshot;
            return {
              ...t,
              originalContent: contentSnapshot,
              isDirty: hasNewEdits,
            };
          }
          return t;
        }),
      }));

      // Refresh project file tree in background
      useProjectStore.getState().refreshFileTree();
    } catch (err) {
      console.error(`Failed to save file ${tab.path}:`, err);
      useProjectStore.getState().setError(`Save error: ${err.message}`);
      throw err;
    } finally {
      savingTabIds.delete(tabId);
      set({ isSaving: savingTabIds.size > 0 });

      // If edits arrived while saving or another save was requested, flush the queue
      if (pendingSaveQueues.has(tabId)) {
        pendingSaveQueues.delete(tabId);
        // Process follow-up save with newest content
        get().saveTab(tabId).catch(console.error);
      }
    }
  },

  saveActiveTab: async () => {
    const { activeTabId, saveTab } = get();
    if (activeTabId) {
      await saveTab(activeTabId);
    }
  },

  /**
   * Flushes all dirty tabs immediately (e.g. before project change or tab closing)
   */
  flushPendingSaves: async () => {
    const { tabs, saveTab } = get();
    const dirtyTabs = tabs.filter((t) => t.isDirty);
    await Promise.all(dirtyTabs.map((t) => saveTab(t.id)));
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

  closeAllTabs: async () => {
    const { flushPendingSaves } = get();
    // Flush pending saves before closing all tabs
    await flushPendingSaves().catch(console.error);
    set({ tabs: [], activeTabId: null, pendingCloseTab: null });
  },
}));
