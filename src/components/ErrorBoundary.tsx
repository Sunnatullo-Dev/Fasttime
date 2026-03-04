import React, { ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 bg-red-900/50 text-white rounded-xl container mx-auto mt-10 whitespace-pre-wrap overflow-auto border border-red-500">
                    <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
                    <p className="font-mono text-xs">{this.state.error && this.state.error.toString()}</p>
                    <p className="font-mono text-[10px] mt-4 text-red-200">{this.state.errorInfo?.componentStack}</p>
                </div>
            );
        }

        return this.props.children;
    }
}
