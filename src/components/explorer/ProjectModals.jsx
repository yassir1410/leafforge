import React, { useState, useEffect } from 'react';
import { Folder, FileText, Clock, AlertTriangle } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useProjectStore } from '../../stores/useProjectStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export function NewProjectModal() {
  const { isNewProjectOpen, closeNewProjectModal } = useUIStore();
  const { createProject, isLoading } = useProjectStore();
  const { openFile, closeAllTabs } = useEditorStore();

  const [projectName, setProjectName] = useState('My LaTeX Paper');
  const [projectPath, setProjectPath] = useState('/home/yassir14/Documents/MyLatexPaper');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (projectName) {
      const slug = projectName.trim().replace(/\s+/g, '_');
      setProjectPath(`/home/yassir14/Documents/${slug}`);
    }
  }, [projectName]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      closeAllTabs();
      const proj = await createProject(projectPath, projectName);
      closeNewProjectModal();
      if (proj.main_file) {
        await openFile(proj.main_file, 'main.tex');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal
      isOpen={isNewProjectOpen}
      onClose={closeNewProjectModal}
      title="Create New LaTeX Project"
      description="Initializes a new directory with a standard main.tex article template"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={closeNewProjectModal}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreate}
            disabled={isLoading || !projectName.trim() || !projectPath.trim()}
          >
            {isLoading ? 'Creating...' : 'Create Project'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleCreate} className="space-y-3 text-xs">
        {error && (
          <div className="p-2.5 rounded-sm bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-sm px-2.5 py-1.5 outline-hidden focus:ring-1 focus:ring-emerald-500"
            placeholder="e.g. Quantum Computing Thesis"
            required
          />
        </div>

        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
            Directory Path
          </label>
          <input
            type="text"
            value={projectPath}
            onChange={(e) => setProjectPath(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-sm px-2.5 py-1.5 outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
            required
          />
        </div>
      </form>
    </Modal>
  );
}

export function OpenProjectModal() {
  const { isOpenProjectOpen, closeOpenProjectModal } = useUIStore();
  const { openProject, recentProjects, loadRecentProjects, isLoading } = useProjectStore();
  const { openFile, closeAllTabs } = useEditorStore();

  const [pathInput, setPathInput] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpenProjectOpen) {
      loadRecentProjects();
    }
  }, [isOpenProjectOpen, loadRecentProjects]);

  const handleOpen = async (targetPath) => {
    setError(null);
    try {
      closeAllTabs();
      const proj = await openProject(targetPath);
      closeOpenProjectModal();
      if (proj.main_file) {
        await openFile(proj.main_file);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal
      isOpen={isOpenProjectOpen}
      onClose={closeOpenProjectModal}
      title="Open LaTeX Project"
      description="Open an existing project folder or select from recently opened projects"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={closeOpenProjectModal}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpen(pathInput)}
            disabled={isLoading || !pathInput.trim()}
          >
            {isLoading ? 'Opening...' : 'Open Project'}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs">
        {error && (
          <div className="p-2.5 rounded-sm bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
            Project Directory Path
          </label>
          <input
            type="text"
            value={pathInput}
            onChange={(e) => setPathInput(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-sm px-2.5 py-1.5 outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
            placeholder="/path/to/latex/project"
          />
        </div>

        {/* Recent Projects List */}
        <div>
          <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Recent Projects</span>
          </h4>

          {recentProjects.length > 0 ? (
            <div className="border border-slate-200 dark:border-slate-800 rounded-sm divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
              {recentProjects.map((p) => (
                <div
                  key={p.path}
                  onClick={() => handleOpen(p.path)}
                  className="p-2.5 flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate font-mono">{p.path}</div>
                  </div>
                  <Folder className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-400 text-center py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-sm">
              No recent projects recorded yet.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function NewFileDialog() {
  const { newFileDialog, closeNewFileDialog } = useUIStore();
  const { createFile, createDirectory } = useProjectStore();
  const { openFile } = useEditorStore();

  const [name, setName] = useState('');
  const [error, setError] = useState(null);

  if (!newFileDialog) return null;

  const isFolder = newFileDialog.isDir;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    const relative = newFileDialog.parentPath
      ? `${newFileDialog.parentPath}/${name.trim()}`
      : name.trim();

    try {
      if (isFolder) {
        await createDirectory(relative);
      } else {
        await createFile(relative, name.endsWith('.tex') ? '% New LaTeX File\n\n' : '');
        // If file created, open it in editor tab
        await openFile(relative, name);
      }
      closeNewFileDialog();
      setName('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal
      isOpen={Boolean(newFileDialog)}
      onClose={closeNewFileDialog}
      title={isFolder ? 'New Directory' : 'New File'}
      description={`Creating within ${newFileDialog.parentPath || 'project root'}`}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={closeNewFileDialog}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!name.trim()}>
            Create
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        {error && (
          <div className="p-2.5 rounded-sm bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
            {isFolder ? 'Folder Name' : 'File Name (e.g. chapter1.tex)'}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-sm px-2.5 py-1.5 outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
            placeholder={isFolder ? 'figures' : 'bibliography.bib'}
            autoFocus
            required
          />
        </div>
      </form>
    </Modal>
  );
}

export function RenameDialog() {
  const { renameDialog, closeRenameDialog } = useUIStore();
  const { renameNode } = useProjectStore();

  const [newName, setNewName] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (renameDialog) {
      setNewName(renameDialog.name);
    }
  }, [renameDialog]);

  if (!renameDialog) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim() || newName === renameDialog.name) {
      closeRenameDialog();
      return;
    }
    setError(null);
    try {
      await renameNode(renameDialog.path, newName.trim());
      closeRenameDialog();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal
      isOpen={Boolean(renameDialog)}
      onClose={closeRenameDialog}
      title={`Rename ${renameDialog.isDir ? 'Folder' : 'File'}`}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={closeRenameDialog}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!newName.trim()}>
            Rename
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        {error && (
          <div className="p-2.5 rounded-sm bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
            New Name
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-sm px-2.5 py-1.5 outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono text-[11px]"
            autoFocus
            required
          />
        </div>
      </form>
    </Modal>
  );
}

export function DeleteConfirmDialog() {
  const { deleteConfirmDialog, closeDeleteConfirm } = useUIStore();
  const { deleteNode } = useProjectStore();
  const { tabs, closeTab } = useEditorStore();

  const [error, setError] = useState(null);

  if (!deleteConfirmDialog) return null;

  const handleDelete = async () => {
    setError(null);
    try {
      // If deleted node was open in tab, close it
      const openTab = tabs.find((t) => t.path === deleteConfirmDialog.path);
      if (openTab) {
        closeTab(openTab.id, true);
      }
      await deleteNode(deleteConfirmDialog.path);
      closeDeleteConfirm();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal
      isOpen={Boolean(deleteConfirmDialog)}
      onClose={closeDeleteConfirm}
      title={`Delete ${deleteConfirmDialog.isDir ? 'Folder' : 'File'}?`}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={closeDeleteConfirm}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Confirm Delete
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-start gap-2.5 p-3 rounded-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p>
            Are you sure you want to permanently delete{' '}
            <strong className="font-semibold text-slate-900 dark:text-white">
              '{deleteConfirmDialog.name}'
            </strong>
            ? This action cannot be undone.
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-sm bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
