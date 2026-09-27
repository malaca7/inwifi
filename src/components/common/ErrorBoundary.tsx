import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Wifi } from 'lucide-react';

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
    console.error('In-Wifi Uncaught Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#06080F] text-slate-100 flex items-center justify-center p-6 selection:bg-brand-500">
          <div className="max-w-lg w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 text-center">
            
            <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                Falha de Execução na Interface
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ocorreu uma instabilidade inesperada na renderização da plataforma. Seus dados e configurações do roteador permanecem intactos.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-left font-mono text-[11px] text-rose-300 overflow-x-auto max-h-36">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-glow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recarregar Página</span>
              </button>

              <button
                onClick={this.handleClearAndReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Limpar Cache Local</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-600 flex items-center justify-center gap-1.5">
              <Wifi className="w-3 h-3 text-brand-400" />
              <span>In-Wifi LAN Controller • Resilient Recovery Mode</span>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
