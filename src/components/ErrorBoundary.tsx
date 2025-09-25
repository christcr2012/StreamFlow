import React from "react";

type Props = { children: React.ReactNode; fallback?: React.ReactNode };
type State = { hasError: boolean; error?: unknown };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    // eslint-disable-next-line no-console
    console.error("Client error captured:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="mx-auto max-w-[900px] p-4">
            <h2 className="mb-2 text-xl font-semibold">Something went wrong.</h2>
            <p className="text-sm text-muted-foreground">
              Try refreshing. If it keeps happening, check the browser console for details.
            </p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
