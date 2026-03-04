"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import { SoilSampleForm } from './SoilSampleForm';

interface SoilEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    plotId: string;
}

export function SoilEntryModal({ isOpen, onClose, plotId }: SoilEntryModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Register Lab Results</h2>
                        <p className="text-sm text-slate-400 mt-1">Enter chain-of-custody and analytical data for plot core sample.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <SoilSampleForm plotId={plotId} onSuccess={onClose} />
                </div>
            </div>
        </div>
    );
}
