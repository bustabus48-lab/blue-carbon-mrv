"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ShieldAlert, Anchor, TrendingUp, FireExtinguisher, MapPin, AlertTriangle } from "lucide-react";
import { ProjectFilter } from "@/components/ProjectFilter";

export default function LeakageClient({ projects, riskScores, reversals, surveys, calcAggs }: {
    projects: any[]; riskScores: any[]; reversals: any[]; surveys: any[]; calcAggs: any[];
}) {
    const [selectedProjectId, setSelectedProjectId] = useState("all");

    const filtered = useMemo(() => {
        if (selectedProjectId === "all") return { riskScore: riskScores[0], reversals, surveys, calcAggs };
        return {
            riskScore: riskScores.find((r: any) => r.project_id === selectedProjectId) || riskScores[0],
            reversals: reversals.filter((r: any) => r.project_id === selectedProjectId),
            surveys: surveys.filter((s: any) => s.project_id === selectedProjectId),
            calcAggs: calcAggs.filter((c: any) => c.project_id === selectedProjectId),
        };
    }, [selectedProjectId, riskScores, reversals, surveys, calcAggs]);

    const totalBufferHeld = filtered.calcAggs.reduce((s: number, r: any) => s + Number(r.buffer_deduction_t), 0);
    const totalLost = filtered.reversals.reduce((s: number, r: any) => s + Number(r.estimated_tco2e_lost), 0);
    const bufferHealthPercentage = totalBufferHeld > 0 ? ((totalBufferHeld - totalLost) / totalBufferHeld) * 100 : 100;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                        <ShieldAlert className="w-8 h-8 text-indigo-400" />Leakage & Buffer Pool
                    </h1>
                    <p className="text-gray-400 mt-1">Manage non-permanence risk, market leakage, and project buffer holding accounts.</p>
                </div>
                <ProjectFilter projects={projects} selectedProjectId={selectedProjectId} onProjectChange={setSelectedProjectId} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                    <div className="flex justify-between items-start">
                        <div><p className="text-sm font-medium text-gray-400">Total Buffer Held</p><h3 className="text-2xl font-bold text-white mt-1">{totalBufferHeld.toLocaleString()} <span className="text-sm font-normal text-gray-400">tCO2e</span></h3></div>
                        <div className="p-2 bg-indigo-500/10 rounded-lg"><Anchor className="w-5 h-5 text-indigo-400" /></div>
                    </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                    <div className="flex justify-between items-start">
                        <div><p className="text-sm font-medium text-gray-400">Required Pool %</p><h3 className="text-2xl font-bold text-white mt-1">{filtered.riskScore?.total_buffer_percentage || '15.00'}%</h3></div>
                        <div className="p-2 bg-emerald-500/10 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-400" /></div>
                    </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                    <div className="flex justify-between items-start">
                        <div><p className="text-sm font-medium text-gray-400">Reversal Events</p><h3 className="text-2xl font-bold text-white mt-1">{filtered.reversals.length}</h3></div>
                        <div className="p-2 bg-rose-500/10 rounded-lg"><FireExtinguisher className="w-5 h-5 text-rose-400" /></div>
                    </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                    <div className="flex justify-between items-start">
                        <div><p className="text-sm font-medium text-gray-400">Buffer Health</p><h3 className="text-2xl font-bold text-white mt-1">{bufferHealthPercentage.toFixed(1)}%</h3></div>
                        <div className="p-2 bg-amber-500/10 rounded-lg"><AlertTriangle className={`w-5 h-5 ${bufferHealthPercentage < 80 ? 'text-rose-400' : 'text-amber-400'}`} /></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-slate-700"><h2 className="text-lg font-semibold text-white">Reversal Events Ledger</h2></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-300 uppercase bg-slate-900/50"><tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Plot</th><th className="px-6 py-4">Event Type</th><th className="px-6 py-4 text-right">Lost (tCO2e)</th><th className="px-6 py-4 text-center">Status</th></tr></thead>
                            <tbody className="divide-y divide-slate-700">
                                {filtered.reversals.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No reversal events recorded.</td></tr>
                                ) : filtered.reversals.map((rev: any) => (
                                    <tr key={rev.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 text-slate-300">{format(new Date(rev.event_date), 'MMM d, yyyy')}</td>
                                        <td className="px-6 py-4 text-white">{rev.sample_plots?.plot_name || 'Unknown Plot'}</td>
                                        <td className="px-6 py-4"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">{rev.event_type}</span></td>
                                        <td className="px-6 py-4 text-rose-400 font-mono text-right">-{Number(rev.estimated_tco2e_lost).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center"><span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${rev.status === 'Investigating' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-slate-700/50 text-slate-300 border-slate-600"}`}>{rev.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-slate-700"><h2 className="text-lg font-semibold text-white">Market Displacements (Leakage)</h2></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-300 uppercase bg-slate-900/50"><tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Market Location</th><th className="px-6 py-4 text-right">Fuelwood (GHS)</th><th className="px-6 py-4 text-right">Charcoal (GHS)</th></tr></thead>
                            <tbody className="divide-y divide-slate-700">
                                {filtered.surveys.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No market surveys recorded.</td></tr>
                                ) : filtered.surveys.map((survey: any) => (
                                    <tr key={survey.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 text-slate-300">{format(new Date(survey.survey_date), 'MMM d, yyyy')}</td>
                                        <td className="px-6 py-4 text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-400" />{survey.location}</td>
                                        <td className="px-6 py-4 font-mono text-emerald-400 text-right">₵{Number(survey.fuelwood_price_ghs).toFixed(2)}</td>
                                        <td className="px-6 py-4 font-mono text-emerald-400 text-right">₵{Number(survey.charcoal_price_ghs).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
