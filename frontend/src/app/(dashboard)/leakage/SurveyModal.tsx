"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { X, CheckCircle2, TrendingUp } from "lucide-react";

export default function SurveyModal() {
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
            survey_date: formData.get("survey_date"),
            location: formData.get("location"),
            fuelwood_price_ghs: formData.get("fuelwood_price_ghs"),
            charcoal_price_ghs: formData.get("charcoal_price_ghs"),
            estimated_displacement_volume: formData.get("estimated_displacement_volume"),
            notes: formData.get("notes"),
            surveyed_by: 'admin@gab.com' // Mock user for now
        };

        const { error } = await supabase.from('market_surveys').insert([data]);

        if (!error) {
            setSuccess(true);
            setTimeout(() => {
                setIsOpen(false);
                setSuccess(false);
                router.refresh();
            }, 1500);
        } else {
            console.error("Failed to save survey", error);
            alert("Error saving survey.");
        }
        setIsSubmitting(false);
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="bg-slate-800 border-slate-700 border hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
                <TrendingUp className="w-4 h-4" />
                Log Market Survey
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-400" />
                        Log Market Survey
                    </h2>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto">
                    {success ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
                            <h3 className="text-xl font-bold text-white">Survey Logged!</h3>
                            <p className="text-slate-400 mt-2">The market leakage data has been recorded against the baseline.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Survey Date</label>
                                    <input
                                        type="date"
                                        name="survey_date"
                                        required
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Market Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        required
                                        placeholder="e.g. Keta Central Market"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Fuelwood Price (GHS/bundle)</label>
                                    <input
                                        type="number"
                                        name="fuelwood_price_ghs"
                                        step="0.01"
                                        required
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Charcoal Price (GHS/bag)</label>
                                    <input
                                        type="number"
                                        name="charcoal_price_ghs"
                                        step="0.01"
                                        required
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Estimated Displacement Volume (tons/month)</label>
                                <input
                                    type="number"
                                    name="estimated_displacement_volume"
                                    step="0.1"
                                    required
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <p className="text-xs text-slate-400 mt-1">Estimations derived from merchant interviews.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Survey Notes (Optional)</label>
                                <textarea
                                    name="notes"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                                    placeholder="Observations regarding regional demand shifts..."
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
                                    className="px-4 py-2 rounded-lg font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? "Saving..." : "Log Survey"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
