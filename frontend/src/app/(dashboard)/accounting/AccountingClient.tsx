"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { Calculator, Factory, ShieldAlert, BadgeCheck, Activity, Lock, ArrowRight, DollarSign } from "lucide-react";
import { ProjectFilter } from "@/components/ProjectFilter";

export default function AccountingClient({ projects, calculations, activeCycleName, pendingRequirements }: {
    projects: any[]; calculations: any[]; activeCycleName: string | null; pendingRequirements: number;
}) {
    const [selectedProjectId, setSelectedProjectId] = useState("all");

    const isLocked = pendingRequirements > 0;

    const filtered = useMemo(() => {
        if (selectedProjectId === "all") return calculations;
        return calculations.filter((c: any) => c.project_id === selectedProjectId);
    }, [selectedProjectId, calculations]);

    const totalGrossCO2e = filtered.reduce((s: number, c: any) => s + Number(c.gross_tco2e), 0);
    const totalLeakageDeductions = filtered.reduce((s: number, c: any) => s + Number(c.leakage_deduction_t), 0);
    const totalBufferDeductions = filtered.reduce((s: number, c: any) => s + Number(c.buffer_deduction_t), 0);
    const totalNetIssuable = filtered.reduce((s: number, c: any) => s + Number(c.net_issuable_tco2e), 0);

    // Economic estimation: Assumed $25/tCO2e for premium Blue Carbon
    const ASSUMED_CARBON_PRICE = 25;
    const estimatedValue = totalNetIssuable * ASSUMED_CARBON_PRICE;

    if (isLocked) {
        return (
            <div className="max-w-4xl mx-auto h-[80vh] flex flex-col justify-center items-center text-center">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 max-w-2xl w-full shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Lock className="w-64 h-64 text-slate-100" /></div>
                    <div className="bg-rose-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 border border-rose-500/20"><Lock className="w-10 h-10 text-rose-500" /></div>
                    <h1 className="text-3xl font-bold text-white mb-4 relative z-10">Carbon Accounting Locked</h1>
                    <p className="text-slate-400 text-lg mb-8 relative z-10 max-w-lg mx-auto">
                        The accounting engine cannot extract VCU issuance metrics because the <span className="text-white font-medium">{activeCycleName}</span> cycle has <span className="text-rose-400 font-bold">{pendingRequirements} pending</span> compliance requirement{pendingRequirements > 1 ? 's' : ''}.
                    </p>
                    <Link href="/compliance" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-medium transition-colors relative z-10">
                        Resolve Compliance Checklists <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Calculator className="w-6 h-6 text-emerald-500" />Carbon Accounting Engine</h1>
                    <p className="text-slate-400 mt-1">Automated IPCC tier CO2e quantification and issuance metrics.</p>
                </div>
                <ProjectFilter projects={projects} selectedProjectId={selectedProjectId} onProjectChange={setSelectedProjectId} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Factory className="w-16 h-16 text-slate-100" /></div>
                    <h3 className="text-slate-400 font-medium mb-1 relative z-10">Gross System tCO2e</h3>
                    <div className="text-3xl font-bold text-white relative z-10">{totalGrossCO2e.toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
                    <div className="text-xs text-slate-500 mt-2 relative z-10">Before risk deductions</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-slate-400 font-medium mb-1">Leakage Displacement</h3>
                    <div className="text-3xl font-bold text-rose-400">-{totalLeakageDeductions.toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
                    <div className="text-xs text-slate-500 mt-2">10% Standard Rate applied</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-slate-400 font-medium mb-1">Non-Permanence Buffer</h3>
                    <div className="text-3xl font-bold text-amber-400">-{totalBufferDeductions.toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
                    <div className="text-xs text-slate-500 mt-2">15% Holdback pool</div>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><BadgeCheck className="w-16 h-16 text-emerald-500" /></div>
                    <h3 className="text-emerald-400/80 font-medium mb-1 relative z-10">Net Issuable Credits</h3>
                    <div className="text-3xl font-bold text-emerald-400 relative z-10">{totalNetIssuable.toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
                    <div className="text-xs text-emerald-500/60 mt-2 relative z-10">Tradeable Verified Carbon Units (VCUs)</div>
                </div>
                <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign className="w-16 h-16 text-blue-500" /></div>
                    <h3 className="text-blue-400/80 font-medium mb-1 relative z-10">Estimated Value</h3>
                    <div className="text-3xl font-bold text-blue-400 relative z-10">${estimatedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div className="text-xs text-blue-500/60 mt-2 relative z-10">At assumed $25/tCO2e (Premium BC)</div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-950/30"><h3 className="font-medium text-white">Plot Level Breakdown</h3></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4 font-medium">Origin Plot</th>
                                <th className="px-6 py-4 font-medium text-right">Ecosystem C (t)</th>
                                <th className="px-6 py-4 font-medium text-right">Gross tCO2e</th>
                                <th className="px-6 py-4 font-medium text-right text-rose-400/80">Leakage</th>
                                <th className="px-6 py-4 font-medium text-right text-amber-400/80">Buffer</th>
                                <th className="px-6 py-4 font-medium text-right text-emerald-400">Net Issuance</th>
                                <th className="px-6 py-4 font-medium">Calculation Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filtered.map((calc: any) => (
                                <tr key={calc.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4"><div className="font-medium text-slate-200">{calc.sample_plots?.plot_name}</div><div className="text-xs text-slate-500 mt-1">Area: {calc.sample_plots?.area_ha} ha</div></td>
                                    <td className="px-6 py-4 text-slate-300 text-right font-mono">{Number(calc.total_ecosystem_c_t).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 text-slate-300 text-right font-mono">{Number(calc.gross_tco2e).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 text-rose-400 text-right font-mono text-xs">-{Number(calc.leakage_deduction_t).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 text-amber-400 text-right font-mono text-xs">-{Number(calc.buffer_deduction_t).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 text-emerald-400 font-bold text-right font-mono">{Number(calc.net_issuable_tco2e).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 text-slate-400 text-xs">{format(new Date(calc.calculation_date), 'MMM d, yyyy')}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500"><Calculator className="w-8 h-8 mx-auto mb-3 opacity-20" /><p>No carbon calculations have been run yet.</p></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
