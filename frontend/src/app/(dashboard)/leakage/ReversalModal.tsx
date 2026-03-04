"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { X, CheckCircle2, FireExtinguisher } from "lucide-react";

export default function ReversalModal({ plots }: { plots: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            plot_id: formData.get("plot_id"),
            event_date: formData.get("event_date"),
            event_type: formData.get("event_type"),
            estimated_tco2e_lost: formData.get("estimated_tco2e_lost"),
            status: formData.get("status"),
            notes: formData.get("notes"),
            reported_by: 'admin@gab.com'
        };

        const { error } = await supabase.from('reversal_events').insert([data]);

        if (!error) {
            setSuccess(true);
            setTimeout(() => {
                setIsOpen(false);
                setSuccess(false);
                router.refresh();
            }, 1500);
        } else {
            console.error("Failed to save reversal event", error);
            alert("Error saving reversal.");
        }
        setIsSubmitting(false);
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="bg-rose-600/20 border-rose-500/30 border hover:bg-rose-600/30 text-rose-300 font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
                <FireExtinguisher className="w-4 h-4" />
                Report Reversal
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FireExtinguisher className="w-5 h-5 text-rose-400" />
                        Log Reversal Event
                    </h2>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto">
                    {success ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
                            <h3 className="text-xl font-bold text-white">Reversal Logged!</h3>
                            <p className="text-slate-400 mt-2">The buffer pool ledger has been updated.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Date of Event</label>
                                    <input
                                        type="date"
                                        name="event_date"
                                        required
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Impacted Plot</label>
                                    <select
                                        name="plot_id"
                                        required
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    >
                                        <option value="">Select Plot...</option>
                                        {plots.map(p => (
                                            <option key={p.id} value={p.id}>{p.plot_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Type of Reversal</label>
                                    <select
                                        name="event_type"
                                        required
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    >
                                        <option value="Storm">Storm Damage</option>
                                        <option value="Illegal Logging">Illegal Logging</option>
                                        <option value="Fire">Fire</option>
                                        <option value="Disease">Disease/Pest</option>
                                        <option value="Erosion">Coastal Erosion</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Loss Estimate (tCO2e)</label>
                                    <input
                                        type="number"
                                        name="estimated_tco2e_lost"
                                        step="0.01"
                                        required
                                        placeholder="e.g. 150.5"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Current Status</label>
                                <select
                                    name="status"
                                    required
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                                >
                                    <option value="Investigating">Investigating Extent</option>
                                    <option value="Buffer Deducted">Verified & Deducted</option>
                                    <option value="Resolved">Resolved / Mitigated</option>
                                    <option value="False Alarm">False Alarm</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Incident Notes (Optional)</label>
                                <textarea
                                    name="notes"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 h-24 resize-none"
                                    placeholder="Provide context on the incident..."
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 rounded-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 rounded-lg font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? "Submitting..." : "Log Reversal"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
