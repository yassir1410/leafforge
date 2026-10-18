import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { FileIcon } from '../common/FileIcon';
import { useEditorStore } from '../../stores/useEditorStore';

export function FileTreeNode({ node, level = 0, onContextMenu }) {
  const [isOpen, setIsOpen] = useState(true);
  const { activeTabId, openFile, tabs } = useEditorStore();

  if (!node) return null;

  const isDirectory = node.is_dir;
  const isActive = activeTabId === node.path;
  const isDirty = tabs.some((t) => t.path === node.path && t.isDirty);

  const handleClick = (e) => {
    e.stopPropagation();
    if (isDirectory) {
      setIsOpen(!isOpen);
    } else {
      openFile(node.path, node.name);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, node);
  };

  return (
    <div>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{ paddingLeft: `${level * 14 + 10}px` }}
        className={`group flex items-center justify-between pr-2 py-1 cursor-pointer text-xs select-none transition-colors rounded-sm ${
          isActive
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {isDirectory ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
            >
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </span>
          ) : (
            <span className="w-3.5" />
          )}

          <FileIcon
            isDir={isDirectory}
            isOpen={isOpen}
            extension={node.extension}
            className="w-3.5 h-3.5"
          />

          <span className="truncate">{node.name}</span>
        </div>

        {/* Right badges: Unsaved dirty dot or file size */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isDirty && (
            <span
              className="w-2 h-2 rounded-full bg-emerald-500"
              title="Unsaved changes"
            />
          )}
        </div>
      </div>

      {/* Children list */}
      {isDirectory && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}
