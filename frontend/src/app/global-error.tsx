'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("GLOBAL NEXTJS ERROR CAUGHT:", error);
    }, [error]);

    return (
        <html>
            <body>
                <div style={{ padding: '2rem', backgroundColor: '#fee2e2', color: '#991b1b', fontFamily: 'monospace' }}>
                    <h2>Something went wrong!</h2>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{error.message}</pre>
                    <pre style={{ whiteSpace: 'pre-wrap', marginTop: '1rem', fontSize: '0.8em' }}>{error.stack}</pre>
                    <button
                        onClick={() => reset()}
                        style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#991b1b', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
