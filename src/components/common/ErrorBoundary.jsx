import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[LeafForge ErrorBoundary caught an unhandled error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndReload = () => {
    try {
      localStorage.removeItem('leafforge_theme');
      localStorage.removeItem('leafforge_settings');
      localStorage.removeItem('leafforge_last_project');
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReload);
      }

      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 p-8 select-none font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  {this.props.title || 'Rendering Error Occurred'}
                </h2>
                <p className="text-xs text-slate-400">
                  {this.props.subtitle || 'LeafForge prevented a crash in the component tree.'}
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950/80 rounded border border-slate-800 font-mono text-[11px] text-rose-300 break-all overflow-auto max-h-36">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload LeafForge
              </button>
              <button
                onClick={this.handleResetAndReload}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-medium transition-colors"
                title="Clears cached layout settings and reloads"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset State
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
