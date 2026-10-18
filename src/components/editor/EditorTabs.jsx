import React from 'react';
import { X } from 'lucide-react';
import { useEditorStore } from '../../stores/useEditorStore';
import { FileIcon } from '../common/FileIcon';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export function EditorTabs() {
  const {
    tabs,
    activeTabId,
    setActiveTab,
    requestCloseTab,
    closeTab,
    pendingCloseTab,
    dismissCloseDialog,
    saveTab,
  } = useEditorStore();

  if (tabs.length === 0) return null;

  const handleSaveAndClose = async () => {
    if (!pendingCloseTab) return;
    try {
      await saveTab(pendingCloseTab.id);
      closeTab(pendingCloseTab.id, true);
    } catch (err) {
      console.error('Failed to save before closing:', err);
    }
  };

  const handleDiscardAndClose = () => {
    if (!pendingCloseTab) return;
    closeTab(pendingCloseTab.id, true);
  };

  return (
    <>
      <div className="h-9 bg-slate-100 dark:bg-slate-925 border-b border-slate-200 dark:border-slate-800 flex items-stretch overflow-x-auto select-none scrollbar-none shrink-0">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const ext = tab.name.split('.').pop();

          return (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-2 px-3 border-r border-slate-200 dark:border-slate-800 text-xs cursor-pointer transition-colors relative min-w-[120px] max-w-[220px] ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              {/* Active top line indicator */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500" />
              )}

              <FileIcon isDir={false} extension={ext} className="w-3.5 h-3.5" />

              <span className="truncate flex-1" title={tab.path}>
                {tab.name}
              </span>

              {/* Dirty indicator / Close button */}
              <div className="flex items-center justify-center w-4 h-4 shrink-0">
                {tab.isDirty ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      requestCloseTab(tab.id);
                    }}
                    className="w-2.5 h-2.5 rounded-full bg-emerald-500 group-hover:hidden"
                    title="Unsaved changes"
                  />
                ) : null}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    requestCloseTab(tab.id);
                  }}
                  className={`p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 ${
                    tab.isDirty ? 'hidden group-hover:block' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title="Close tab (Ctrl+W)"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Unsaved changes confirmation dialog */}
      <Modal
        isOpen={Boolean(pendingCloseTab)}
        onClose={dismissCloseDialog}
        title="Unsaved Changes"
        description={`Do you want to save the changes made to '${pendingCloseTab?.name}' before closing?`}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={dismissCloseDialog}>
              Cancel
            </Button>
            <Button variant="outline" size="sm" onClick={handleDiscardAndClose}>
              Discard Changes
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveAndClose}>
              Save & Close
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Your changes will be permanently lost if you close this file without saving.
        </p>
      </Modal>
    </>
  );
}
