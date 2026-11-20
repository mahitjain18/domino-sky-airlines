import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // In production, send to telemetry logger without exposing sensitive variables
    console.error('DOMINO SKY OCC — SYSTEM TELEMETRY CAUGHT ERROR:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[400px] h-full w-full flex items-center justify-center p-6 bg-[#040711] text-slate-100 font-mono select-none"
        >
          <div className="max-w-xl w-full p-6 bg-[#0A1422] border border-[#FF5364]/50 rounded-lg shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 border-b border-[#1E3048] pb-4">
              <div className="w-10 h-10 rounded bg-[#FF5364]/20 border border-[#FF5364]/40 flex items-center justify-center text-[#FF5364]">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-wider">
                  OCC TACTICAL DISPLAY INTERRUPTED
                </h2>
                <p className="text-xs text-[#8498AD]">
                  {this.props.fallbackTitle || 'Safe state failure containment activated.'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#050B14] rounded border border-[#1E3048] text-xs text-rose-300">
              <div className="font-bold flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#FF5364]" />
                <span>FAULT SUMMARY:</span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-slate-300 break-words">
                {this.state.error?.message || 'An unexpected runtime state fault occurred.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center space-x-2 px-3.5 py-2 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-[#050B14] font-bold text-xs rounded transition focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recover Nominal Operations</span>
              </button>

              <button
                onClick={this.handleReload}
                className="flex items-center space-x-2 px-3.5 py-2 bg-[#101D2D] hover:bg-[#1E3048] text-slate-200 border border-[#1E3048] font-bold text-xs rounded transition focus-visible:ring-2 focus-visible:ring-[#00D9FF] focus-visible:outline-none"
              >
                <span>Reload OCC Station</span>
              </button>

              <button
                onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                className="text-[11px] text-[#8498AD] hover:text-[#00D9FF] underline transition ml-auto"
              >
                {this.state.showDetails ? 'Hide Diagnostics' : 'View Diagnostics'}
              </button>
            </div>

            {this.state.showDetails && (
              <pre className="p-3 bg-[#050B14] rounded border border-slate-800 text-[10px] text-slate-400 overflow-x-auto max-h-48 leading-tight">
                {this.state.errorInfo?.componentStack || this.state.error?.stack || 'No component stack trace available.'}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
