'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("PAGE-LEVEL NEXTJS ERROR CAUGHT:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-8 text-center text-red-500 font-mono">
            <h2 className="text-2xl font-bold mb-4">React Crahsed!</h2>
            <div className="text-left bg-red-950/50 p-4 rounded-xl border border-red-900 w-full max-w-3xl overflow-auto">
                <p className="font-bold">{error.message}</p>
                <pre className="text-sm mt-4 text-red-400/80">{error.stack}</pre>
            </div>
            <button
                className="mt-8 px-6 py-2 bg-red-800 hover:bg-red-700 text-white rounded-md transition-colors"
                onClick={() => reset()}
            >
                Try again
            </button>
        </div>
    );
}
