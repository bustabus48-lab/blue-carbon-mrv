import { createClient } from "@/utils/supabase/server";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import { Activity, AlertTriangle, ShieldCheck, Download, Search, Filter } from "lucide-react";

import ExportAlertsCSV from "./ExportAlertsCSV";

export default async function AlertsPage() {
    const supabase = await createClient();

    // Fetch alerts ordered by event_date descending
    const { data: alerts, error } = await supabase
        .from("sar_change_alerts")
        .select("*")
        .order("event_date", { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Alert Management</h1>
                    <p className="text-slate-400">Review and verify satellite-detected change events.</p>
                </div>
                <div className="flex items-center gap-3">
                    <ExportAlertsCSV />
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
                    Error fetching alerts: {error.message}
                </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-950/50 border-b border-slate-800 text-slate-400">
                        <tr>
                            <th className="px-6 py-4 font-medium">Alert ID</th>
                            <th className="px-6 py-4 font-medium">Date Detected</th>
                            <th className="px-6 py-4 font-medium">Type</th>
                            <th className="px-6 py-4 font-medium">Severity</th>
                            <th className="px-6 py-4 font-medium">Area (Ha)</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {alerts?.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                    No alerts detected.
                                </td>
                            </tr>
                        )}
                        {alerts?.map((alert) => (
                            <tr key={alert.id} className="hover:bg-slate-800/20 transition-colors group">
                                <td className="px-6 py-4 text-slate-300 font-mono text-xs">
                                    <Link href={`/alerts/${alert.id}`} className="hover:text-emerald-400 hover:underline">
                                        {alert.id.split('-')[0]}...
                                    </Link>
                                </td>
                                <td className="px-6 py-4 text-slate-400">
                                    {format(new Date(alert.event_date), 'MMM dd, yyyy')}
                                </td>
                                <td className="px-6 py-4 text-slate-200">{alert.alert_type}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${alert.severity === 'Critical' || alert.severity === 'High' ? 'bg-rose-500/10 text-rose-500' :
                                        alert.severity === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-400'
                                        }`}>
                                        {alert.severity}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-300 font-mono">{alert.detected_area_ha}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300">
                                        {alert.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link href={`/alerts/${alert.id}`} className="text-emerald-500 hover:text-emerald-400 font-medium text-xs">
                                        Review &rarr;
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
