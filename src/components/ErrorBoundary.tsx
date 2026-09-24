import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[UNCAUGHT SYSTEM ERROR]:', error, errorInfo);
  }

  private handleRestart = () => {
    try {
      window.location.reload();
    } catch {
      this.setState({ hasError: false, error: null });
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          id="fatal-error-boundary"
          className="fixed inset-0 z-50 bg-[#000000] text-white flex flex-col items-center justify-center p-6 select-none font-mono"
        >
          <div className="w-full max-w-md border-4 border-white p-6 sm:p-8 bg-[#000000] shadow-[8px_8px_0px_0px_#ffffff] flex flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-2 text-white bg-[#1a1a1a] border-2 border-white px-3.5 py-2 text-xs font-black uppercase">
              <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
              <span>SOMETHING WENT WRONG</span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                FISHING DAYS
              </h2>
              <div className="w-16 h-1 bg-white" />
              <p className="text-xs text-[#888888] mt-2 leading-relaxed uppercase tracking-wider">
                AN UNEXPECTED ENGINE OR GRAPHICS GLITCH OCCURRED. YOUR SAVED PROGRESS IS SAFE.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full bg-[#111111] border border-[#333333] p-2.5 text-[11px] text-[#aaaaaa] font-mono break-words text-left max-h-24 overflow-y-auto">
                {this.state.error.message || 'Unknown error'}
              </div>
            )}

            <button
              id="btn-error-restart"
              onClick={this.handleRestart}
              className="w-full py-3 bg-white text-black font-black text-xs uppercase tracking-widest border-2 border-white hover:bg-black hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#ffffff]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RESTART GAME</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
