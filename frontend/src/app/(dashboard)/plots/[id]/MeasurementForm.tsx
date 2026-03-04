"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { PlusCircle, Loader2, Info } from "lucide-react";

export default function MeasurementForm({ plotId }: { plotId: string }) {
    const router = useRouter();
    const supabase = createClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const formData = new FormData(e.currentTarget);

            // Get current user id
            const { data: { user } } = await supabase.auth.getUser();

            const measurementData = {
                plot_id: plotId,
                measurement_date: formData.get("measurement_date") as string,
                canopy_cover_percent: parseFloat(formData.get("canopy_cover") as string),
                avg_tree_height_m: parseFloat(formData.get("tree_height") as string),
                above_ground_biomass_tc_ha: parseFloat(formData.get("agb") as string),
                notes: formData.get("notes") as string,
                is_qa_survey: formData.get("is_qa") === "true",
                recorded_by: user?.id || null
            };

            const { error: insertError } = await supabase
                .from("plot_measurements")
                .insert(measurementData);

            if (insertError) throw insertError;

            // Reset form and refresh router
            (e.target as HTMLFormElement).reset();
            router.refresh();

        } catch (err: any) {
            console.error("Submission failed:", err);
            setError(err.message || "Failed to record measurement.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-500" />
                Record New Measurement
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Survey Date</label>
                    <input
                        type="date"
                        name="measurement_date"
                        required
                        defaultValue={new Date().toISOString().split('T')[0]} // Default to today
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Canopy Cover (%)</label>
                        <input
                            type="number"
                            name="canopy_cover"
                            step="0.1"
                            min="0"
                            max="100"
                            required
                            placeholder="e.g. 65.5"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Avg Tree Hgt (m)</label>
                        <input
                            type="number"
                            name="tree_height"
                            step="0.1"
                            min="0"
                            required
                            placeholder="e.g. 4.2"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-slate-300">Estimated AGB (tc/ha)</label>
                        <div className="group relative cursor-help">
                            <Info className="w-4 h-4 text-slate-500" />
                            <div className="absolute right-0 w-48 p-2 mt-1 rounded text-xs bg-slate-800 text-slate-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-lg">
                                Above Ground Biomass calculated via allometric equations.
                            </div>
                        </div>
                    </div>
                    <input
                        type="number"
                        name="agb"
                        step="0.1"
                        min="0"
                        required
                        placeholder="e.g. 150.8"
                        className="w-full bg-slate-950 border border-emerald-900/50 bg-emerald-950/20 rounded-lg px-4 py-2.5 text-emerald-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                </div>

                <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950 cursor-pointer hover:bg-slate-800/50 transition-colors">
                        <input
                            type="checkbox"
                            name="is_qa"
                            value="true"
                            className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 bg-slate-900"
                        />
                        <span className="text-sm font-medium text-slate-300">Mark as QA/QC Re-measurement</span>
                    </label>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Field Notes / Observations</label>
                    <textarea
                        name="notes"
                        rows={3}
                        placeholder="Describe site conditions, evidence of cutting, signs of wildlife, etc."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-y"
                    ></textarea>
                </div>

                {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-sm text-rose-400">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 mt-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Recording Data...
                        </>
                    ) : (
                        "Save Measurement"
                    )}
                </button>
            </form>
        </div>
    );
}
