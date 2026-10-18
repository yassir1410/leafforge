import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useEditorStore } from '../../stores/useEditorStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useUIStore } from '../../stores/useUIStore';
import { registerLatexSnippets } from '../../features/editor/latexSnippets';
import { EditorTabs } from './EditorTabs';
import { FileCode, Sparkles } from 'lucide-react';

export function MonacoSourceEditor({ editorRef }) {
  const { tabs, activeTabId, updateContent, saveViewState, saveActiveTab } = useEditorStore();
  const settings = useSettingsStore();
  const { theme } = useUIStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const autoSaveTimerRef = useRef(null);
  const prevTabIdRef = useRef(null);
  const internalEditorRef = useRef(null);

  // Handle Monaco mount
  const handleEditorDidMount = (editor, monaco) => {
    internalEditorRef.current = editor;
    if (editorRef) {
      editorRef.current = editor;
    }

    // Register LaTeX snippets
    registerLatexSnippets(monaco);

    // Ctrl+S keybinding directly in Monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveActiveTab();
    });

    // Restore viewState if exists
    if (activeTab?.viewState) {
      editor.restoreViewState(activeTab.viewState);
    }
    editor.focus();
  };

  // Preserve and restore view state across tab switching
  useEffect(() => {
    const editor = internalEditorRef.current;
    if (!editor) return;

    if (prevTabIdRef.current && prevTabIdRef.current !== activeTabId) {
      // Save view state of previous tab
      const state = editor.saveViewState();
      saveViewState(prevTabIdRef.current, state);
    }

    prevTabIdRef.current = activeTabId;

    if (activeTab?.viewState) {
      editor.restoreViewState(activeTab.viewState);
    }
  }, [activeTabId, activeTab?.viewState, saveViewState]);

  // Handle content change
  const handleChange = (value) => {
    if (!activeTabId) return;
    const content = value || '';
    updateContent(activeTabId, content);

    // Auto-save debounce if enabled
    if (settings.autoSave) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        saveActiveTab();
      }, settings.autoSaveDelay || 1500);
    }
  };

  // Determine Monaco language
  const getLanguage = (fileName) => {
    if (!fileName) return 'latex';
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'tex':
      case 'cls':
      case 'sty':
      case 'bib':
        return 'latex';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'xml':
        return 'xml';
      default:
        return 'plaintext';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden relative">
      <EditorTabs />

      {activeTab ? (
        <div className="flex-1 w-full h-full relative">
          <Editor
            key={activeTab.id}
            height="100%"
            width="100%"
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            language={getLanguage(activeTab.name)}
            value={activeTab.content}
            onChange={handleChange}
            onMount={handleEditorDidMount}
            options={{
              fontSize: settings.fontSize,
              tabSize: settings.tabSize,
              wordWrap: settings.wordWrap,
              lineNumbers: settings.lineNumbers,
              minimap: { enabled: settings.minimap },
              automaticLayout: true,
              scrollBeyondLastLine: false,
              bracketPairColorization: { enabled: true },
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              formatOnType: true,
              renderWhitespace: 'selection',
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
              fixedOverflowWidgets: true,
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 select-none">
          <FileCode className="w-12 h-12 mb-3 opacity-30 text-emerald-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No file opened in editor
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Select a file from the explorer on the left or create a new document
          </p>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>LaTeX snippets: type \section, \begin, \cite, \ref and press Tab</span>
          </div>
        </div>
      )}
    </div>
  );
}
