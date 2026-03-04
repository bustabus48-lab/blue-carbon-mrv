import { createClient } from "@/utils/supabase/server";
import { format } from "date-fns";
import Link from "next/link";
import { TreePine, Activity, Navigation } from "lucide-react";
import PlotRegistrationModal from "./PlotRegistrationModal";

export default async function PlotsRegistry() {
    const supabase = await createClient();

    // Fetch all sample plots and join with the most recent measurement to get the Last Survey Date
    const { data: plots, error } = await supabase
        .from("sample_plots")
        .select(`
            id,
            plot_name,
            stratum,
            status,
            created_at,
            plot_measurements ( measurement_date )
        `)
        .order("created_at", { ascending: false });

    // Format the latest measurement date
    const formattedPlots = plots?.map((plot) => {
        // Find the most recent measurement date for this plot
        const sortedMeasurements = plot.plot_measurements?.sort((a, b) =>
            new Date(b.measurement_date).getTime() - new Date(a.measurement_date).getTime()
        ) || [];

        const lastSurvey = sortedMeasurements.length > 0
            ? format(new Date(sortedMeasurements[0].measurement_date), "MMM d, yyyy")
            : "No Data";

        return {
            ...plot,
            lastSurvey
        };
    }) || [];

    if (error) {
        console.error("Error fetching plots:", error);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Permanent Sample Plots</h1>
                    <p className="text-slate-400">Registry of field monitoring nodes and longitudinal data.</p>
                </div>
                <div className="flex items-center gap-3">
                    <PlotRegistrationModal />
                </div>
            </div>

            {/* Plots Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Plot Code</th>
                                <th className="px-6 py-4 font-medium">Stratum</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Last Survey</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {formattedPlots.map((plot) => (
                                <tr key={plot.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                <TreePine className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <span className="font-medium text-white">{plot.plot_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <Navigation className="w-4 h-4" />
                                            {plot.stratum}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${plot.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                            plot.status === "Restoring" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                "bg-red-500/10 text-red-400 border-red-500/20"
                                            }`}>
                                            {plot.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Activity className="w-4 h-4" />
                                            {plot.lastSurvey}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/plots/${plot.id}`}
                                            className="inline-flex items-center text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
                                        >
                                            Manage
                                            <span className="ml-1 text-lg leading-none">&rarr;</span>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {formattedPlots.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        No sample plots registered yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
