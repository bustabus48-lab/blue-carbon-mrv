import { createClient } from "@/utils/supabase/server";
import { format } from "date-fns";
import { TreePine, Navigation, Activity, Calendar, User, FileText, CheckCircle2 } from "lucide-react";
import MeasurementForm from "./MeasurementForm";

export default async function PlotDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient();

    // Fetch Plot Metadata
    const { data: plot, error: plotError } = await supabase
        .from("sample_plots")
        .select(`*`)
        .eq("id", params.id)
        .single();

    if (plotError || !plot) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-xl">
                <TreePine className="w-12 h-12 text-slate-700 mb-4" />
                <h3 className="text-xl font-medium text-slate-300">Plot Not Found</h3>
                <p className="text-slate-500">The requested sample plot could not be located.</p>
            </div>
        );
    }

    // Fetch Measurements History
    const { data: measurements, error: measurementsError } = await supabase
        .from("plot_measurements")
        .select(`
            *,
            profiles ( email )
        `)
        .eq("plot_id", params.id)
        .order("measurement_date", { ascending: false });

    // Fetch Soil Samples
    const { data: soilSamples, error: soilError } = await supabase
        .from("soil_samples")
        .select("*")
        .eq("plot_id", params.id)
        .order("collected_date", { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <TreePine className="w-5 h-5 text-emerald-500" />
                        </div>
                        {plot.plot_name}
                    </h1>
                    <p className="text-slate-400 mt-1 ml-13">Permanent Sample Plot details and longitudinal data.</p>
                </div>

                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${plot.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    plot.status === "Restoring" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                    {plot.status}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Metadata & New Entry */}
                <div className="space-y-6">
                    {/* Plot Meta Data Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Plot Metadata</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800/50">
                                <span className="text-sm text-slate-400 flex items-center gap-2">
                                    <Navigation className="w-4 h-4 text-slate-500" /> Stratum
                                </span>
                                <span className="text-sm font-medium text-white">{plot.stratum}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800/50">
                                <span className="text-sm text-slate-400 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-500" /> Established
                                </span>
                                <span className="text-sm font-medium text-white">
                                    {format(new Date(plot.created_at), "MMM d, yyyy")}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Soil Samples Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                Soil Cores
                            </h3>
                        </div>

                        {(!soilSamples || soilSamples.length === 0) ? (
                            <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg">
                                <p className="text-sm text-slate-500">No soil samples logged.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {soilSamples.map((sample) => (
                                    <div key={sample.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-mono text-xs text-emerald-400">{sample.sample_id}</div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${sample.analysis_status === 'Analysed'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                {sample.analysis_status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-slate-400">
                                            <span>Depth: {sample.depth_interval}</span>
                                            <span>{format(new Date(sample.collected_date), "MMM d, yyyy")}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Data Entry Form Component */}
                    <MeasurementForm plotId={plot.id} />
                </div>

                {/* Right Column: Longitudinal Data Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-500" />
                            Measurement History
                        </h3>

                        {(!measurements || measurements.length === 0) ? (
                            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
                                <p className="text-slate-500">No field measurements recorded yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
                                {measurements.map((measurement, idx) => (
                                    <div key={measurement.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-800 bg-slate-900 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                            {measurement.is_qa_survey ? (
                                                <CheckCircle2 className="w-5 h-5 text-amber-500" />
                                            ) : (
                                                <Activity className="w-5 h-5 text-emerald-500" />
                                            )}
                                        </div>

                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-sm">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-200">
                                                        {format(new Date(measurement.measurement_date), "MMM d, yyyy")}
                                                    </span>
                                                    {measurement.is_qa_survey && (
                                                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                                            QA Survey
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div className="bg-slate-900 rounded p-2 border border-slate-800/50 text-center">
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Canopy</div>
                                                    <div className="text-sm font-semibold text-white">{measurement.canopy_cover_percent}%</div>
                                                </div>
                                                <div className="bg-slate-900 rounded p-2 border border-slate-800/50 text-center">
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Height</div>
                                                    <div className="text-sm font-semibold text-white">{measurement.avg_tree_height_m}m</div>
                                                </div>
                                                <div className="bg-slate-900 rounded p-2 border border-slate-800/50 text-center col-span-2">
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">AGB (tc/ha)</div>
                                                    <div className="text-sm font-semibold text-emerald-400">{measurement.above_ground_biomass_tc_ha}</div>
                                                </div>
                                            </div>

                                            {measurement.notes && (
                                                <div className="text-sm text-slate-400 flex items-start gap-2 bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                                                    <FileText className="w-4 h-4 mt-0.5 shrink-0" />
                                                    <p>{measurement.notes}</p>
                                                </div>
                                            )}

                                            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 pt-3 border-t border-slate-800/50">
                                                <User className="w-3.5 h-3.5" />
                                                {measurement.profiles?.email || "Unknown Agent"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
