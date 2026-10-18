import React from 'react';
import { useUIStore } from '../../stores/useUIStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export function SettingsModal() {
  const { isSettingsOpen, closeSettings } = useUIStore();
  const settings = useSettingsStore();

  return (
    <Modal
      isOpen={isSettingsOpen}
      onClose={closeSettings}
      title="LeafForge Preferences"
      description="Configure editor appearance, formatting, and default compilation options"
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={settings.resetSettings}>
            Reset Defaults
          </Button>
          <Button variant="primary" size="sm" onClick={closeSettings}>
            Done
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Editor Settings Group */}
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-3 pb-1 border-b border-slate-200 dark:border-slate-800">
            Editor Appearance
          </h4>

          <div className="grid grid-cols-2 gap-3">
            {/* Font size */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Font Size (px)
              </label>
              <select
                value={settings.fontSize}
                onChange={(e) => settings.updateSetting('fontSize', Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-sm px-2.5 py-1.5 outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                {[12, 13, 14, 15, 16, 18, 20].map((size) => (
                  <option key={size} value={size}>
                    {size} px
                  </option>
                ))}
              </select>
            </div>

            {/* Tab size */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Tab Size
              </label>
              <select
                value={settings.tabSize}
                onChange={(e) => settings.updateSetting('tabSize', Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-sm px-2.5 py-1.5 outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
              </select>
            </div>

            {/* Word wrap */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Word Wrap
              </label>
              <select
                value={settings.wordWrap}
                onChange={(e) => settings.updateSetting('wordWrap', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-sm px-2.5 py-1.5 outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="on">Enabled (Wrap lines)</option>
                <option value="off">Disabled</option>
              </select>
            </div>

            {/* Line numbers */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Line Numbers
              </label>
              <select
                value={settings.lineNumbers}
                onChange={(e) => settings.updateSetting('lineNumbers', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-sm px-2.5 py-1.5 outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </div>
          </div>
        </div>

        {/* Compiler Settings Group */}
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-3 pb-1 border-b border-slate-200 dark:border-slate-800">
            LaTeX Compilation Engine
          </h4>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
              Default Engine (Configured for Phase 02)
            </label>
            <select
              value={settings.defaultCompiler}
              onChange={(e) => settings.updateSetting('defaultCompiler', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-sm px-2.5 py-1.5 outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="latexmk">latexmk — Automated multi-pass build tool</option>
              <option value="pdflatex">pdflatex — Standard TeX Live engine</option>
              <option value="xelatex">xelatex — Unicode & modern font engine</option>
              <option value="lualatex">lualatex — Modern Lua-scriptable engine</option>
            </select>
          </div>
        </div>

        {/* Auto-save Group */}
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-3 pb-1 border-b border-slate-200 dark:border-slate-800">
            File Saving
          </h4>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Auto-save modifications
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Automatically saves editor changes after a short typing pause
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => settings.updateSetting('autoSave', e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
