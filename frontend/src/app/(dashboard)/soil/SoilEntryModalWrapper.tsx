"use client";

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { SoilEntryModal } from './SoilEntryModal';

interface PlotOption {
    id: string;
    plot_name: string;
}

export function SoilEntryModalWrapper({ plots }: { plots: PlotOption[] }) {
    const [isOriginModalOpen, setIsOriginModalOpen] = useState(false);
    const [isLabModalOpen, setIsLabModalOpen] = useState(false);
    const [selectedPlot, setSelectedPlot] = useState('');

    const handleContinueToLabForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedPlot) {
            setIsOriginModalOpen(false);
            setIsLabModalOpen(true);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOriginModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
                <Plus className="w-5 h-5" />
                Register New Core
            </button>

            {/* Step 1: Select Origin Plot Modal */}
            {isOriginModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsOriginModalOpen(false)} />

                    <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-2">Select Origin Plot</h2>
                        <p className="text-sm text-slate-400 mb-6">Select the Permanent Sample Plot where this soil core was extracted.</p>

                        <form onSubmit={handleContinueToLabForm} className="space-y-4">
                            <div>
                                <select
                                    required
                                    value={selectedPlot}
                                    onChange={(e) => setSelectedPlot(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="" disabled>Select a Plot...</option>
                                    {plots.map(plot => (
                                        <option key={plot.id} value={plot.id}>{plot.plot_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsOriginModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!selectedPlot}
                                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
                                >
                                    Continue
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Step 2: Full Lab Data Entry Modal */}
            <SoilEntryModal
                isOpen={isLabModalOpen}
                onClose={() => setIsLabModalOpen(false)}
                plotId={selectedPlot}
            />
        </>
    );
}
