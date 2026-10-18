import React, { useState } from 'react';
import {
  FolderPlus,
  FilePlus,
  RefreshCw,
  FolderOpen,
  FolderTree,
} from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUIStore } from '../../stores/useUIStore';
import { FileTreeNode } from './FileTreeNode';
import { ContextMenu } from './ContextMenu';
import { ResizableHandle } from '../layout/ResizablePanel';
import { Button } from '../common/Button';

export function ProjectExplorer() {
  const { project, fileTree, refreshFileTree, isLoading } = useProjectStore();
  const {
    isExplorerOpen,
    explorerWidth,
    setExplorerWidth,
    openNewFileDialog,
    openRenameDialog,
    openDeleteConfirm,
    openNewProjectModal,
    openOpenProjectModal,
  } = useUIStore();

  const [contextMenu, setContextMenu] = useState(null);

  if (!isExplorerOpen) return null;

  const handleContextMenu = (e, node) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetNode: node,
    });
  };

  const handleRootContextMenu = (e) => {
    e.preventDefault();
    if (!project) return;
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetNode: {
        name: project.name,
        path: project.path,
        relative_path: '',
        is_dir: true,
      },
    });
  };

  return (
    <aside
      style={{ width: `${explorerWidth}px` }}
      onContextMenu={handleRootContextMenu}
      className="flex flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 relative select-none z-10"
    >
      {/* Explorer Header */}
      <div className="h-8 px-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        <span className="truncate">{project ? project.name : 'Explorer'}</span>

        {project && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => openNewFileDialog('', false)}
              className="p-1 rounded-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="New File in Root"
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => openNewFileDialog('', true)}
              className="p-1 rounded-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="New Folder in Root"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={refreshFileTree}
              disabled={isLoading}
              className="p-1 rounded-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Refresh File Tree"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* File Tree / Empty State Area */}
      <div className="flex-1 overflow-y-auto py-1">
        {project && fileTree ? (
          <div>
            {fileTree.children && fileTree.children.length > 0 ? (
              fileTree.children.map((node) => (
                <FileTreeNode
                  key={node.path}
                  node={node}
                  level={0}
                  onContextMenu={handleContextMenu}
                />
              ))
            ) : (
              <div className="px-4 py-8 text-center text-xs text-slate-400">
                <FolderTree className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Empty Project</p>
                <button
                  onClick={() => openNewFileDialog('', false)}
                  className="mt-2 text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Create a file
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center h-full gap-3">
            <FolderOpen className="w-10 h-10 opacity-30 text-slate-400" />
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">No project opened</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Open a LaTeX directory or create a new document
              </p>
            </div>
            <div className="flex flex-col gap-1.5 w-full pt-1">
              <Button size="xs" variant="primary" onClick={openNewProjectModal}>
                <FolderPlus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </Button>
              <Button size="xs" variant="outline" onClick={openOpenProjectModal}>
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Open Project</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetNode={contextMenu.targetNode}
          onClose={() => setContextMenu(null)}
          onNewFile={(parentPath) => openNewFileDialog(parentPath, false)}
          onNewFolder={(parentPath) => openNewFileDialog(parentPath, true)}
          onRename={(node) => openRenameDialog(node.path, node.name, node.is_dir)}
          onDelete={(node) => openDeleteConfirm(node.path, node.name, node.is_dir)}
        />
      )}

      {/* Right resize handle */}
      <ResizableHandle
        orientation="horizontal"
        onResize={(delta) => setExplorerWidth(explorerWidth + delta)}
        className="absolute right-0 top-0 bottom-0"
      />
    </aside>
  );
}
