import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[60vh] grid place-items-center p-6">
          <div className="card-elevated-lg p-6 max-w-md text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 grid place-items-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Something went wrong</h2>
              <p className="text-sm text-muted-foreground mt-1 break-words">
                {this.state.error.message || "Unexpected error"}
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={this.reset}>Try again</Button>
              <Button onClick={() => (window.location.href = "/")}>Go home</Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
