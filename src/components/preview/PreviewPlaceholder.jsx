import React from 'react';
import {
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { ResizableHandle } from '../layout/ResizablePanel';

export function PreviewPlaceholder() {
  const { isPreviewOpen, previewWidth, setPreviewWidth } = useUIStore();

  if (!isPreviewOpen) return null;

  return (
    <div
      style={{ width: `${previewWidth}px` }}
      className="flex flex-col bg-slate-100 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex-shrink-0 relative select-none z-10"
    >
      {/* Left resize handle */}
      <ResizableHandle
        orientation="horizontal"
        onResize={(delta) => setPreviewWidth(previewWidth - delta)}
        className="absolute left-0 top-0 bottom-0"
      />

      {/* Preview Toolbar */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">PDF Preview</span>
        </div>

        {/* Disabled PDF view controls placeholder */}
        <div className="flex items-center gap-1 opacity-50 cursor-not-allowed">
          <button disabled className="p-1 rounded text-slate-400 cursor-not-allowed" title="Zoom Out">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] px-1 font-mono text-slate-400">100%</span>
          <button disabled className="p-1 rounded text-slate-400 cursor-not-allowed" title="Zoom In">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="h-3 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1" />
          <button disabled className="p-1 rounded text-slate-400 cursor-not-allowed" title="Rotate">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Empty State Body — Clean Component Boundary for PDF.js Integration */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs">
        <div className="w-16 h-20 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center mb-4 bg-white/50 dark:bg-slate-900/50 shadow-sm">
          <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-1" />
          <div className="w-8 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
          PDF Preview Pipeline
        </h3>

        <p className="text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-4">
          Real-time PDF rendering via PDF.js and automatic TeX Live compilation will be integrated in Phase 02 and 03.
        </p>

        <div className="flex flex-col gap-2 w-full max-w-xs text-left bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
          <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            <span>Architecture Roadmap</span>
          </div>
          <ul className="space-y-1.5 text-slate-500 dark:text-slate-400 list-disc list-inside">
            <li>
              <strong className="text-slate-700 dark:text-slate-300">Phase 01:</strong> Foundation, Monaco editor, native project management (Active)
            </li>
            <li>
              <strong className="text-slate-700 dark:text-slate-300">Phase 02:</strong> LaTeX engine execution (<code className="font-mono text-emerald-600 dark:text-emerald-400">latexmk</code> / <code className="font-mono text-emerald-600 dark:text-emerald-400">pdflatex</code>)
            </li>
            <li>
              <strong className="text-slate-700 dark:text-slate-300">Phase 03:</strong> PDF.js embedded viewer & SyncTeX two-way navigation
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
