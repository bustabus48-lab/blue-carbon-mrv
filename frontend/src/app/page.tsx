import Link from 'next/link';
import { Leaf } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center space-y-6 bg-slate-950">
      <div className="space-y-4 max-w-2xl flex flex-col items-center">
        <div className="p-4 bg-emerald-500/10 rounded-full mb-4">
          <Leaf className="w-12 h-12 text-emerald-500" />
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4">
          Blue Carbon MRV
        </h1>
        <p className="text-lg md:text-xl text-slate-400">
          The National Platform for Monitoring, Reporting, and Verification of Mangrove Restoration and Conservation.
        </p>
      </div>

      <div className="pt-8 flex flex-col sm:flex-row gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 text-white shadow hover:bg-emerald-700 h-12 px-8 py-3 text-lg"
        >
          Enter Dashboard
        </Link>
      </div>
    </div>
  );
}
