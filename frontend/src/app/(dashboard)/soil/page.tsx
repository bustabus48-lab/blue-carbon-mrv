import { createClient } from "@/utils/supabase/server";
import { formatDistanceToNow, format } from 'date-fns';
import { Microscope, Beaker, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { SoilEntryModalWrapper } from "./SoilEntryModalWrapper";

export default async function SoilDashboard() {
    const supabase = await createClient();

    // Fetch all soil samples, joining with the parent plot to get the plot name
    const { data: samples, error } = await supabase
        .from('soil_samples')
        .select(`
            *,
            sample_plots(plot_name)
        `)
        .order('collected_date', { ascending: false });

    if (error) {
        console.error("Error fetching soil samples:", error);
    }

    // High level metrics
    const totalSamples = samples?.length || 0;
    const pendingAnalysis = samples?.filter(s => s.analysis_status === 'Pending').length || 0;
    const completedAnalysis = samples?.filter(s => s.analysis_status === 'Analysed').length || 0;

    // We need a list of active plots to populate the "Select Plot" dropdown when adding a new sample
    const { data: activePlots } = await supabase.from('sample_plots').select('id, plot_name').eq('status', 'Active');

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Microscope className="w-6 h-6 text-emerald-500" />
                        Soil Data Registry
                    </h1>
                    <p className="text-slate-400 mt-1">Manage below-ground carbon samples and chain-of-custody.</p>
                </div>

                {/* Client Component Wrapper for the Modal */}
                <SoilEntryModalWrapper plots={activePlots || []} />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 font-medium">Total Cores Logged</h3>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Beaker className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white">{totalSamples}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 font-medium">Pending Lab Analysis</h3>
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white">{pendingAnalysis}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 font-medium">Verified Results</h3>
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white">{completedAnalysis}</div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4 font-medium">Sample ID</th>
                                <th className="px-6 py-4 font-medium">Origin Plot</th>
                                <th className="px-6 py-4 font-medium">Collection Date</th>
                                <th className="px-6 py-4 font-medium">Depth</th>
                                <th className="px-6 py-4 font-medium text-right">Bulk Density</th>
                                <th className="px-6 py-4 font-medium text-right">Carbon %</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {samples?.map((sample) => (
                                <tr key={sample.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-emerald-400">{sample.sample_id}</div>
                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                            <span>By:</span> {sample.collected_by.split('@')[0]}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">
                                        {sample.sample_plots?.plot_name || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">
                                        {format(new Date(sample.collected_date), 'MMM d, yyyy')}
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">
                                        <span className="bg-slate-800 px-2 py-1 rounded text-xs">{sample.depth_interval}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300 text-right font-mono">
                                        {sample.bulk_density_g_cm3 ? `${Number(sample.bulk_density_g_cm3).toFixed(3)}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-300 text-right font-mono">
                                        {sample.organic_carbon_percent ? `${Number(sample.organic_carbon_percent).toFixed(1)}%` : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${sample.analysis_status === 'Analysed'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : sample.analysis_status === 'Pending'
                                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                            }`}>
                                            {sample.analysis_status === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                                            {sample.analysis_status === 'Analysed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                            {sample.analysis_status === 'Flagged' && <AlertCircle className="w-3 h-3 mr-1" />}
                                            {sample.analysis_status}
                                        </span>
                                    </td>
                                </tr>
                            ))}

                            {samples?.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <Microscope className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                        <p>No soil samples registered yet.</p>
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
