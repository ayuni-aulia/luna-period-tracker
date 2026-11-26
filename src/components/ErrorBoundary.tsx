import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    let readable = 'Something unexpected happened while loading your cycle data.';
    try {
      const parsed = JSON.parse(error.message) as { error?: string };
      if (parsed && typeof parsed.error === 'string') {
        if (parsed.error.toLowerCase().includes('permission')) {
          readable =
            'Your session could not access your private cycle records. Please sign in again or verify your email.';
        } else {
          readable = parsed.error;
        }
      }
    } catch {
      if (error.message) {
        readable = error.message;
      }
    }
    return { hasError: true, message: readable };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught application error:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#2D2A2E] flex items-center justify-center p-6">
          <div className="w-full max-w-[420px] rounded-2xl bg-white border border-[#F0EAE8] p-6 text-center shadow-sm">
            <h1 className="text-xl font-semibold tracking-tight text-[#2D2A2E]">
              Unable to load Luna
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#6E676B]">{this.state.message}</p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#E86A7A] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#D95869] whitespace-nowrap shrink-0"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Reload App</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
