import { createClient } from "@/utils/supabase/server";
import {
    ShieldAlert,
    Anchor,
    TrendingUp,
    FireExtinguisher,
    MapPin,
    AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import SurveyModal from "./SurveyModal";
import ReversalModal from "./ReversalModal";

export const dynamic = "force-dynamic";

export default async function LeakageDashboardPage() {
    const supabase = await createClient();

    // 1. Fetch Latest Risk Scoring
    const { data: riskScore } = await supabase
        .from("risk_scoring")
        .select("*")
        .order("assessment_date", { ascending: false })
        .limit(1)
        .single();

    // 2. Fetch Reversals
    const { data: reversals } = await supabase
        .from("reversal_events")
        .select(`
            *,
            sample_plots(plot_name)
        `)
        .order("event_date", { ascending: false });

    // 3. Fetch Market Surveys
    const { data: surveys } = await supabase
        .from("market_surveys")
        .select("*")
        .order("survey_date", { ascending: false });

    // 4. Fetch Total Buffer Pool Metrics
    const { data: calcAggs } = await supabase
        .from("carbon_calculations")
        .select("buffer_deduction_t, gross_tco2e");

    const totalBufferHeld = calcAggs?.reduce((sum, row) => sum + Number(row.buffer_deduction_t), 0) || 0;
    const totalEcoCarbon = calcAggs?.reduce((sum, row) => sum + Number(row.gross_tco2e), 0) || 0;

    // Total Reversal Impact
    const totalLost = reversals?.reduce((sum, row) => sum + Number(row.estimated_tco2e_lost), 0) || 0;
    const bufferHealthPercentage = totalBufferHeld > 0 ? ((totalBufferHeld - totalLost) / totalBufferHeld) * 100 : 100;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                        <ShieldAlert className="w-8 h-8 text-indigo-400" />
                        Leakage & Buffer Pool
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Manage non-permanence risk, market leakage, and project buffer holding accounts.
                    </p>
                </div>
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <SurveyModal />
                    <ReversalModal plots={[]} />
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-400">Total Buffer Held</p>
                            <h3 className="text-2xl font-bold text-white mt-1">
                                {totalBufferHeld.toLocaleString()} <span className="text-sm font-normal text-gray-400">tCO2e</span>
                            </h3>
                        </div>
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Anchor className="w-5 h-5 text-indigo-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-400">Required Pool %</p>
                            <h3 className="text-2xl font-bold text-white mt-1">
                                {riskScore?.total_buffer_percentage || '15.00'}%
                            </h3>
                        </div>
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-400">Reversal Events</p>
                            <h3 className="text-2xl font-bold text-white mt-1">
                                {reversals?.length || 0}
                            </h3>
                        </div>
                        <div className="p-2 bg-rose-500/10 rounded-lg">
                            <FireExtinguisher className="w-5 h-5 text-rose-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-400">Buffer Health</p>
                            <h3 className="text-2xl font-bold text-white mt-1">
                                {bufferHealthPercentage.toFixed(1)}%
                            </h3>
                        </div>
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <AlertTriangle className={`w-5 h-5 ${bufferHealthPercentage < 80 ? 'text-rose-400' : 'text-amber-400'}`} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Reversal Events Ledger */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="p-5 border-b border-slate-700 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-white">Reversal Events Ledger</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-300 uppercase bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Plot</th>
                                    <th className="px-6 py-4 font-semibold">Event Type</th>
                                    <th className="px-6 py-4 font-semibold text-right">Lost (tCO2e)</th>
                                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {(!reversals || reversals.length === 0) ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400 bg-slate-800/50">
                                            No reversal events recorded in the buffer pool ledger.
                                        </td>
                                    </tr>
                                ) : (
                                    reversals.map((rev) => (
                                        <tr key={rev.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                                                {format(new Date(rev.event_date), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                {/* @ts-ignore */}
                                                {rev.sample_plots?.plot_name || 'Unknown Plot'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                    {rev.event_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-rose-400 font-mono text-right">
                                                -{Number(rev.estimated_tco2e_lost).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${rev.status === 'Investigating' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                    "bg-slate-700/50 text-slate-300 border-slate-600"
                                                    }`}>
                                                    {rev.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Market Leakage Surveys */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="p-5 border-b border-slate-700 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-white">Market Displacements (Leakage)</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-300 uppercase bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Market Location</th>
                                    <th className="px-6 py-4 font-semibold text-right">Fuelwood (GHS)</th>
                                    <th className="px-6 py-4 font-semibold text-right">Charcoal (GHS)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {(!surveys || surveys.length === 0) ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400 bg-slate-800/50">
                                            No market surveys recorded.
                                        </td>
                                    </tr>
                                ) : (
                                    surveys.map((survey) => (
                                        <tr key={survey.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                                                {format(new Date(survey.survey_date), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-6 py-4 text-white flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-indigo-400" />
                                                {survey.location}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-emerald-400 text-right">
                                                ₵{Number(survey.fuelwood_price_ghs).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-emerald-400 text-right">
                                                ₵{Number(survey.charcoal_price_ghs).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
