import { createClient } from "@/utils/supabase/server";
import { Activity, AlertTriangle, ShieldCheck, TreePine, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import MapWrapper from "@/components/MapWrapper";

export default async function DashboardPage() {
    const supabase = await createClient();

    // 1. Fetch plots to calculate Total Area
    const { data: plots } = await supabase.from("mangrove_plots").select("area_ha");
    const totalArea = plots?.reduce((sum, plot) => sum + Number(plot.area_ha), 0) || 0;

    // 2. Fetch alerts to calculate Active Alerts and Verification Rate
    const { data: alerts, error: alertsError } = await supabase.from("sar_change_alerts").select("status");
    const safeAlerts = alerts || [];
    const totalAlerts = safeAlerts.length;
    const activeAlerts = safeAlerts.filter(a => a.status !== 'Verified' && a.status !== 'False Positive').length;
    const verifiedAlerts = totalAlerts - activeAlerts;
    const verificationRate = totalAlerts > 0 ? Math.round((verifiedAlerts / totalAlerts) * 100) : 100;

    // 3. Fetch top 5 recent alerts for the feed
    const { data: recentAlerts } = await supabase
        .from("sar_change_alerts")
        .select("*")
        .order("event_date", { ascending: false })
        .limit(5);

    // 4. Fetch GeoJSON for the Map View
    const { data: geoPlots } = await supabase.from('geojson_plots').select('*');
    const { data: geoAlerts } = await supabase.from('geojson_alerts').select('*').neq('status', 'Verified');
    const { data: geoLeakage } = await supabase.from('geojson_leakage_zones').select('*');
    const { data: geoSamplePlots } = await supabase.from('geojson_sample_plots').select('*');

    const stats = [
        { title: "Mangrove Extent (Ha)", value: totalArea.toLocaleString(undefined, { maximumFractionDigits: 1 }), change: "Live Sync", trend: "up", icon: TreePine },
        { title: "Active Alerts", value: activeAlerts.toString(), change: "Action needed", trend: "down", icon: AlertTriangle },
        { title: "Verification Rate", value: `${verificationRate}%`, change: "Overall", trend: "neutral", icon: ShieldCheck },
        { title: "Restoration Risk", value: "Low", change: "Stable", trend: "neutral", icon: Activity },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Operational Dashboard</h1>
                <p className="text-slate-400">National Blue Carbon Monitoring, Reporting, and Verification.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-slate-400">{stat.title}</h3>
                            <div className="p-2 bg-slate-800 rounded-lg">
                                <stat.icon className="w-5 h-5 text-emerald-500" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-white">{stat.value}</span>
                            <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-emerald-500' : stat.trend === 'down' ? 'text-amber-500' : 'text-slate-500'
                                }`}>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl min-h-[400px] flex items-center justify-center relative overflow-hidden h-[500px]">
                    <MapWrapper
                        plots={geoPlots || []}
                        alerts={geoAlerts || []}
                        leakageZones={geoLeakage || []}
                        samplePlots={geoSamplePlots || []}
                    />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl min-h-[400px] overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="font-medium text-white">Recent Alerts</h3>
                        <Activity className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="divide-y divide-slate-800/50 flex-1 overflow-y-auto">
                        {recentAlerts?.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No recent alerts found.</div>
                        ) : (
                            recentAlerts?.map((alert) => (
                                <div key={alert.id} className="p-4 hover:bg-slate-800/30 transition-colors cursor-pointer group">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${alert.severity === 'High' || alert.severity === 'Critical' ? 'bg-rose-500' :
                                                alert.severity === 'Medium' ? 'bg-amber-500' : 'bg-slate-500'
                                                }`} />
                                            <span className="font-medium text-slate-200 text-sm">{alert.alert_type}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                            <Clock className="w-3 h-3" />
                                            <span>{alert.event_date ? formatDistanceToNow(new Date(alert.event_date), { addSuffix: true }) : 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="pl-4 flex justify-between items-center mt-2">
                                        <div className="text-xs text-slate-400">
                                            Area: <span className="text-slate-300 font-mono">{alert.detected_area_ha} ha</span>
                                        </div>
                                        <div className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                            {alert.status}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
