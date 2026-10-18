import React, { useEffect, useRef } from 'react';
import { FilePlus, FolderPlus, Edit2, Trash2, Copy } from 'lucide-react';

export function ContextMenu({
  x,
  y,
  targetNode,
  onClose,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!targetNode) return null;

  const handleCopyPath = () => {
    navigator.clipboard?.writeText(targetNode.relative_path || targetNode.name);
    onClose();
  };

  // Adjust menu position to keep inside viewport
  const adjustedX = Math.min(x, window.innerWidth - 180);
  const adjustedY = Math.min(y, window.innerHeight - 200);

  return (
    <div
      ref={menuRef}
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      className="fixed z-50 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-xl py-1 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-3 py-1 font-semibold text-[10px] uppercase text-slate-400 truncate border-b border-slate-100 dark:border-slate-800 mb-1">
        {targetNode.name}
      </div>

      {targetNode.is_dir && (
        <>
          <button
            onClick={() => {
              onNewFile(targetNode.path);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 text-left transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>New File</span>
          </button>

          <button
            onClick={() => {
              onNewFolder(targetNode.path);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 text-left transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Folder</span>
          </button>

          <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1" />
        </>
      )}

      <button
        onClick={() => {
          onRename(targetNode);
          onClose();
        }}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
      >
        <Edit2 className="w-3.5 h-3.5" />
        <span>Rename</span>
      </button>

      <button
        onClick={handleCopyPath}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
      >
        <Copy className="w-3.5 h-3.5" />
        <span>Copy Path</span>
      </button>

      <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1" />

      <button
        onClick={() => {
          onDelete(targetNode);
          onClose();
        }}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Delete</span>
      </button>
    </div>
  );
}
