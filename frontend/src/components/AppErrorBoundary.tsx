import { Component, type ErrorInfo, type ReactNode } from 'react';

const DYNAMIC_IMPORT_RELOAD_KEY = 'truematch:dynamic-import-reload-ts';
const DYNAMIC_IMPORT_RELOAD_COOLDOWN_MS = 15_000;

const isDynamicImportError = (error: Error): boolean => {
  const message = error.message.toLowerCase();

  return (
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('importing a module script failed') ||
    message.includes('loading chunk')
  );
};

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  errorMessage: string;
  suppressErrorUi: boolean;
};

export class AppErrorBoundary extends Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
      suppressErrorUi: false
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message,
      suppressErrorUi: isDynamicImportError(error)
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('UI runtime error:', error, errorInfo);

    if (typeof window === 'undefined' || !isDynamicImportError(error)) {
      return;
    }

    // Auto-recover from stale lazy-module URLs after the tab has been idle for a while.
    const lastReloadAt = Number(window.sessionStorage.getItem(DYNAMIC_IMPORT_RELOAD_KEY) ?? '0');
    const now = Date.now();

    if (!Number.isFinite(lastReloadAt) || now - lastReloadAt > DYNAMIC_IMPORT_RELOAD_COOLDOWN_MS) {
      window.sessionStorage.setItem(DYNAMIC_IMPORT_RELOAD_KEY, String(now));
      window.location.reload();
    }
  }

  public render(): ReactNode {
    if (this.state.hasError && !this.state.suppressErrorUi) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <div className="w-full max-w-xl rounded-xl border border-rose-200 bg-white p-6">
            <h1 className="text-lg font-semibold text-rose-700">Something went wrong on this page</h1>
            <p className="mt-2 text-sm text-slate-700">Please refresh. If it continues, share this message:</p>
            <pre className="mt-3 overflow-auto rounded-md bg-slate-100 p-3 text-xs text-slate-800">{this.state.errorMessage}</pre>
          </div>
        </div>
      );
    }

    if (this.state.hasError && this.state.suppressErrorUi) {
      return (
        <div
          className="fixed inset-0 z-50 flex min-h-[100dvh] items-center justify-center bg-dark-bg"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-100" aria-label="Loading" />
        </div>
      );
    }

    return this.props.children;
  }
}
