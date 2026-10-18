import { create } from 'zustand';
import { invokeCommand } from '../lib/tauri';

export const useProjectStore = create((set, get) => ({
  project: null,
  fileTree: null,
  recentProjects: [],
  isLoading: false,
  error: null,

  setProject: (project) => set({ project, error: null }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  loadRecentProjects: async () => {
    try {
      const recent = await invokeCommand('list_recent_projects');
      set({ recentProjects: recent || [] });
    } catch (err) {
      console.error('Failed to load recent projects:', err);
    }
  },

  createProject: async (projectPath, projectName) => {
    set({ isLoading: true, error: null });
    try {
      const project = await invokeCommand('create_project', {
        project_path: projectPath,
        project_name: projectName || null,
      });
      set({ project, isLoading: false });
      localStorage.setItem('leafforge_last_project', projectPath);
      await get().refreshFileTree();
      await get().loadRecentProjects();
      return project;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  openProject: async (projectPath) => {
    set({ isLoading: true, error: null });
    try {
      const project = await invokeCommand('open_project', {
        project_path: projectPath,
      });
      set({ project, isLoading: false });
      localStorage.setItem('leafforge_last_project', projectPath);
      await get().refreshFileTree();
      await get().loadRecentProjects();
      return project;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  refreshFileTree: async () => {
    const { project } = get();
    if (!project) return;
    try {
      const tree = await invokeCommand('list_project_files', {
        project_root: project.path,
      });
      set({ fileTree: tree });
    } catch (err) {
      console.error('Failed to refresh file tree:', err);
      set({ error: err.message });
    }
  },

  createFile: async (targetPath, initialContent = '') => {
    const { project } = get();
    if (!project) return;
    try {
      await invokeCommand('create_file', {
        project_root: project.path,
        file_path: targetPath,
        initial_content: initialContent || null,
      });
      await get().refreshFileTree();
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  createDirectory: async (targetPath) => {
    const { project } = get();
    if (!project) return;
    try {
      await invokeCommand('create_directory', {
        project_root: project.path,
        dir_path: targetPath,
      });
      await get().refreshFileTree();
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  renameNode: async (oldPath, newName) => {
    const { project } = get();
    if (!project) return;
    try {
      const newPath = await invokeCommand('rename_node', {
        project_root: project.path,
        old_path: oldPath,
        new_name: newName,
      });
      await get().refreshFileTree();
      return newPath;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteNode: async (targetPath) => {
    const { project } = get();
    if (!project) return;
    try {
      await invokeCommand('delete_node', {
        project_root: project.path,
        target_path: targetPath,
      });
      await get().refreshFileTree();
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },
}));
