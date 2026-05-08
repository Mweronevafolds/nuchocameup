import React, { ReactNode, Component, ErrorInfo } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Error boundary caught:", error, errorInfo);
    }

    reset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center px-4 bg-background">
                    <div className="max-w-md text-center">
                        <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
                        <h1 className="text-2xl font-bold mb-2">Oops! Something went wrong</h1>
                        <p className="text-muted-foreground mb-4">
                            {this.state.error?.message || "An unexpected error occurred"}
                        </p>
                        <div className="space-y-2">
                            <Button onClick={this.reset} className="w-full">
                                Try Again
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => (window.location.href = "/")}
                                className="w-full"
                            >
                                Go Home
                            </Button>
                        </div>
                        {process.env.NODE_ENV === "development" && (
                            <details className="mt-4 text-left">
                                <summary className="cursor-pointer text-xs text-muted-foreground">
                                    Error details
                                </summary>
                                <pre className="mt-2 text-xs bg-secondary p-2 rounded overflow-auto max-h-32">
                                    {this.state.error?.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
