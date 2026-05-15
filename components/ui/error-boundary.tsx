"use client";

import React from "react";

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Error caught by boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-[400px] p-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">Bir hata oluştu</h2>
                        <p className="text-neutral-400 mb-4">
                            Üzgünüz, bir şeyler yanlış gitti. Lütfen sayfayı yenileyin.
                        </p>
                        <button
                            onClick={() => this.setState({ hasError: false })}
                            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
                        >
                            Tekrar Dene
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
