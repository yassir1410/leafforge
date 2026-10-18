import React, { useEffect, useState } from 'react';
import {
  Terminal,
  AlertTriangle,
  Cpu,
  ChevronDown,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useProjectStore } from '../../stores/useProjectStore';
import { invokeCommand } from '../../lib/tauri';
import { ResizableHandle } from './ResizablePanel';

export function BottomPanel() {
  const {
    isBottomPanelOpen,
    bottomPanelHeight,
    setBottomPanelHeight,
    bottomPanelTab,
    setBottomPanelTab,
    toggleBottomPanel,
  } = useUIStore();

  const { project } = useProjectStore();
  const [latexEnv, setLatexEnv] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);

  const fetchEnvironment = async () => {
    setIsDetecting(true);
    try {
      const [env, sys] = await Promise.all([
        invokeCommand('detect_latex_tools'),
        invokeCommand('get_system_info'),
      ]);
      setLatexEnv(env);
      setSystemInfo(sys);
    } catch (err) {
      console.error('Failed to detect LaTeX tools:', err);
    } finally {
      setIsDetecting(false);
    }
  };

  useEffect(() => {
    fetchEnvironment();
  }, []);

  if (!isBottomPanelOpen) return null;

  return (
    <div
      style={{ height: `${bottomPanelHeight}px` }}
      className="flex flex-col bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 z-10 transition-all select-none"
    >
      {/* Top resize handle */}
      <ResizableHandle
        orientation="vertical"
        onResize={(delta) => setBottomPanelHeight(bottomPanelHeight - delta)}
      />

      {/* Panel header tabs */}
      <div className="flex items-center justify-between px-3 h-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setBottomPanelTab('environment')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              bottomPanelTab === 'environment'
                ? 'text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>LaTeX Environment</span>
            {latexEnv && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            onClick={() => setBottomPanelTab('output')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              bottomPanelTab === 'output'
                ? 'text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Output</span>
          </button>

          <button
            onClick={() => setBottomPanelTab('problems')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              bottomPanelTab === 'problems'
                ? 'text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Problems (0)</span>
          </button>
        </div>

        {/* Panel controls */}
        <div className="flex items-center gap-1">
          {bottomPanelTab === 'environment' && (
            <button
              onClick={fetchEnvironment}
              disabled={isDetecting}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-sm transition-colors"
              title="Rescan LaTeX Environment"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
            </button>
          )}

          <button
            onClick={toggleBottomPanel}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-sm transition-colors"
            title="Collapse Panel"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tab content area */}
      <div className="flex-1 overflow-auto p-3 text-xs font-mono select-text">
        {/* Environment tab */}
        {bottomPanelTab === 'environment' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-200 dark:border-slate-800">
              <span className="font-sans font-semibold">
                Detected System LaTeX Tools & Compilers
              </span>
              {systemInfo && (
                <span className="text-[11px]">
                  OS: {systemInfo.host || `${systemInfo.os} (${systemInfo.arch})`}
                </span>
              )}
            </div>

            {latexEnv?.engines && latexEnv.engines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                {latexEnv.engines.map((engine) => (
                  <div
                    key={engine.command}
                    className="p-2 rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-sans text-slate-800 dark:text-slate-200">
                        {engine.name}
                      </span>
                      {engine.available ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Found
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-sans">
                          <XCircle className="w-3 h-3" /> Not Found
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate" title={engine.path}>
                      {engine.path || 'Not installed in PATH'}
                    </div>
                    {engine.version && (
                      <div className="text-[10px] text-slate-400 truncate" title={engine.version}>
                        {engine.version}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 py-3">Scanning for installed LaTeX tools...</div>
            )}
          </div>
        )}

        {/* Output tab */}
        {bottomPanelTab === 'output' && (
          <div className="space-y-1 text-slate-700 dark:text-slate-300">
            <div className="text-slate-400 dark:text-slate-500">
              [LeafForge 0.1 Session Initialized]
            </div>
            {project ? (
              <div>
                <span className="text-emerald-600 dark:text-emerald-400">[Project]</span>{' '}
                Opened '{project.name}' at {project.path}
              </div>
            ) : (
              <div className="text-slate-400">
                [Project] No active project loaded. Open or create a project to begin.
              </div>
            )}
            <div className="text-slate-400 dark:text-slate-500 pt-2">
              Note: Full LaTeX compilation log stream and real-time latexmk watcher will activate in Phase 02.
            </div>
          </div>
        )}

        {/* Problems tab */}
        {bottomPanelTab === 'problems' && (
          <div className="py-2 text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>No diagnostic errors reported. LaTeX compilation will run in Phase 02.</span>
          </div>
        )}
      </div>
    </div>
  );
}
