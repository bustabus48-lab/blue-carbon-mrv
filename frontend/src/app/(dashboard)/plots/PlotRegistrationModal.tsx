"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, MapPin } from "lucide-react";

export default function PlotRegistrationModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const formData = new FormData(e.currentTarget);

            const plot_name = formData.get("plot_name") as string;
            const stratum = formData.get("stratum") as string;
            const status = formData.get("status") as string;
            const lat = parseFloat(formData.get("lat") as string);
            const lng = parseFloat(formData.get("lng") as string);

            // Constructing the PostGIS Point string
            const locationPoint = `POINT(${lng} ${lat})`;

            // Insert into Supabase
            // Note: We're inserting the location as raw SQL using the PostGIS ST_GeomFromText, 
            // but the Supabase JS client doesn't support raw SQL inserts directly this way for geometry parsing
            // Instead, we can use an RPC if complex, but simple GeoJSON object insertion often works if configured,
            // or we use the specific textual format Supabase expects for PostGIS points:

            const { data, error: insertError } = await supabase
                .from("sample_plots")
                .insert({
                    plot_name,
                    stratum,
                    status,
                    location: locationPoint, // Supabase REST API natively handles standard WKT string inserts for PostGIS columns!
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Close modal and refresh the router to show the new plot
            setIsOpen(false);
            router.refresh();

        } catch (err: any) {
            console.error("Failed to register plot:", err);
            setError(err.message || "An unexpected error occurred while registering the plot.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
            >
                <Plus className="w-4 h-4" />
                <span>Register Plot</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

                        <div className="flex items-center justify-between p-6 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-emerald-500" />
                                Register New Sample Plot
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">

                            {error && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-sm text-rose-400">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Plot Code / Identifier</label>
                                    <input
                                        type="text"
                                        name="plot_name"
                                        required
                                        placeholder="e.g. PSP-SONG-004"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Stratum</label>
                                        <select
                                            name="stratum"
                                            required
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        >
                                            <option value="">Select Stratum</option>
                                            <option value="Fringing">Fringing</option>
                                            <option value="Basin">Basin</option>
                                            <option value="Riverine">Riverine</option>
                                            <option value="Overwash">Overwash</option>
                                            <option value="Scrub">Scrub</option>
                                            <option value="Hammock">Hammock</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Initial Status</label>
                                        <select
                                            name="status"
                                            required
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Restoring">Restoring</option>
                                            <option value="Degraded">Degraded</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Latitude</label>
                                        <input
                                            type="number"
                                            name="lat"
                                            step="0.000001"
                                            required
                                            placeholder="e.g. 5.8625"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Longitude</label>
                                        <input
                                            type="number"
                                            name="lng"
                                            step="0.000001"
                                            required
                                            placeholder="e.g. 0.9585"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Register Plot"
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
