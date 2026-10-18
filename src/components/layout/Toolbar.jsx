import React from 'react';
import {
  FolderPlus,
  FolderOpen,
  Save,
  Undo2,
  Redo2,
  Play,
  Sun,
  Moon,
  Settings,
  PanelLeft,
  PanelRight,
  PanelBottom,
  Sparkles,
} from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { useUIStore } from '../../stores/useUIStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { Button } from '../common/Button';

export function Toolbar({ onUndo, onRedo }) {
  const { project } = useProjectStore();
  const { getActiveTab, saveActiveTab } = useEditorStore();
  const {
    theme,
    toggleTheme,
    openSettings,
    openNewProjectModal,
    openOpenProjectModal,
    isExplorerOpen,
    toggleExplorer,
    isPreviewOpen,
    togglePreview,
    isBottomPanelOpen,
    toggleBottomPanel,
  } = useUIStore();
  const { defaultCompiler, updateSetting } = useSettingsStore();

  const activeTab = getActiveTab();
  const isDirty = activeTab?.isDirty || false;

  return (
    <header className="h-12 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 flex items-center justify-between select-none z-20 flex-shrink-0">
      {/* Left: Branding & Project info */}
      <div className="flex items-center gap-3">
        {/* App Logo */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-300 dark:border-slate-700">
          <div className="w-7 h-7 rounded bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <span className="font-bold tracking-tight text-sm text-slate-900 dark:text-slate-100">
            LeafForge
          </span>
          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            v0.1
          </span>
        </div>

        {/* Project Name display */}
        <div className="flex items-center gap-1.5 max-w-[200px] truncate">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Project:</span>
          <span
            className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate"
            title={project ? project.path : 'No project open'}
          >
            {project ? project.name : 'Untitled / None'}
          </span>
        </div>
      </div>

      {/* Center: File & Project Actions, Compiler selector & Disabled Compile button */}
      <div className="flex items-center gap-2">
        {/* Project management buttons */}
        <div className="flex items-center gap-1 pr-2 border-r border-slate-300 dark:border-slate-700">
          <Button
            size="xs"
            variant="ghost"
            onClick={openNewProjectModal}
            title="New LaTeX Project (Ctrl+Alt+N)"
          >
            <FolderPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>New</span>
          </Button>

          <Button
            size="xs"
            variant="ghost"
            onClick={openOpenProjectModal}
            title="Open Existing Project (Ctrl+O)"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            <span>Open</span>
          </Button>
        </div>

        {/* Save button */}
        <Button
          size="xs"
          variant={isDirty ? 'primary' : 'ghost'}
          onClick={saveActiveTab}
          disabled={!activeTab || !isDirty}
          title="Save Active Document (Ctrl+S)"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save</span>
          {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
        </Button>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-300 dark:border-slate-700">
          <Button
            size="xs"
            variant="ghost"
            onClick={onUndo}
            title="Undo (Ctrl+Z)"
            disabled={!activeTab}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={onRedo}
            title="Redo (Ctrl+Y)"
            disabled={!activeTab}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Compiler Selection dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Engine:</span>
          <select
            value={defaultCompiler}
            onChange={(e) => updateSetting('defaultCompiler', e.target.value)}
            className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            title="LaTeX Compilation Engine (Configured for Phase 02)"
          >
            <option value="latexmk">latexmk (Automated)</option>
            <option value="pdflatex">pdfLaTeX</option>
            <option value="xelatex">XeLaTeX</option>
            <option value="lualatex">LuaLaTeX</option>
          </select>
        </div>

        {/* Compile Button — Explicitly Disabled in Phase 01 */}
        <div className="relative group">
          <button
            disabled
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none opacity-80"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Recompile</span>
            <span className="text-[9px] uppercase px-1 py-0.2 bg-slate-300 dark:bg-slate-700 rounded text-slate-500 dark:text-slate-400">
              Phase 02
            </span>
          </button>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 bg-slate-900 text-white text-[11px] rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            LaTeX compilation pipeline integrates in Phase 02
          </div>
        </div>
      </div>

      {/* Right: Layout toggles, Theme switcher, Settings */}
      <div className="flex items-center gap-1">
        {/* Panel toggle buttons */}
        <button
          onClick={toggleExplorer}
          className={`p-1.5 rounded text-xs transition-colors ${
            isExplorerOpen
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
          title="Toggle Project Explorer"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <button
          onClick={toggleBottomPanel}
          className={`p-1.5 rounded text-xs transition-colors ${
            isBottomPanelOpen
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
          title="Toggle Problems / Output Panel"
        >
          <PanelBottom className="w-4 h-4" />
        </button>

        <button
          onClick={togglePreview}
          className={`p-1.5 rounded text-xs transition-colors mr-1 ${
            isPreviewOpen
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
          title="Toggle PDF Preview Panel"
        >
          <PanelRight className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Theme switcher */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Settings button */}
        <button
          onClick={openSettings}
          className="p-1.5 rounded text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="LeafForge Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
