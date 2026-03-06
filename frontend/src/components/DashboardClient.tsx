"use client";

import { useState, useMemo } from "react";
import { Activity, AlertTriangle, ShieldCheck, TreePine, Clock, Globe, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import MapWrapper from "@/components/MapWrapper";

interface DashboardClientProps {
    projects: any[];
    geoPlots: any[];
    geoAlerts: any[];
    geoLeakage: any[];
    geoSamplePlots: any[];
    geoProjectAreas: any[];
    allAlerts: any[];
    plots: any[];
}

export default function DashboardClient({
    projects,
    geoPlots,
    geoAlerts,
    geoLeakage,
    geoSamplePlots,
    geoProjectAreas,
    allAlerts,
    plots,
}: DashboardClientProps) {
    const [selectedProjectId, setSelectedProjectId] = useState<string>("all");

    // Filter data based on selected project
    const filtered = useMemo(() => {
        if (selectedProjectId === "all") {
            return {
                plots: geoPlots,
                alerts: geoAlerts,
                leakage: geoLeakage,
                samplePlots: geoSamplePlots,
                projectAreas: geoProjectAreas,
                recentAlerts: allAlerts.slice(0, 5),
                allProjectAlerts: allAlerts,
                mangrovePlots: plots,
            };
        }

        return {
            plots: geoPlots.filter((p: any) => p.project_id === selectedProjectId),
            alerts: geoAlerts.filter((a: any) => a.project_id === selectedProjectId),
            leakage: geoLeakage.filter((l: any) => l.project_id === selectedProjectId),
            samplePlots: geoSamplePlots.filter((s: any) => s.project_id === selectedProjectId),
            projectAreas: geoProjectAreas.filter((pa: any) => pa.project_id === selectedProjectId),
            recentAlerts: allAlerts.filter((a: any) => a.project_id === selectedProjectId).slice(0, 5),
            allProjectAlerts: allAlerts.filter((a: any) => a.project_id === selectedProjectId),
            mangrovePlots: plots.filter((p: any) => p.project_id === selectedProjectId),
        };
    }, [selectedProjectId, geoPlots, geoAlerts, geoLeakage, geoSamplePlots, geoProjectAreas, allAlerts, plots]);

    // Calculate KPIs
    const totalArea = filtered.mangrovePlots.reduce((sum: number, p: any) => sum + Number(p.area_ha || 0), 0);
    const totalAlerts = filtered.allProjectAlerts.length;
    const activeAlerts = filtered.allProjectAlerts.filter((a: any) => a.status !== 'Verified' && a.status !== 'False Positive').length;
    const verifiedAlerts = totalAlerts - activeAlerts;
    const verificationRate = totalAlerts > 0 ? Math.round((verifiedAlerts / totalAlerts) * 100) : 100;

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    const stats = [
        { title: "Mangrove Extent (Ha)", value: totalArea.toLocaleString(undefined, { maximumFractionDigits: 1 }), change: "Live Sync", trend: "up", icon: TreePine },
        { title: "Active Alerts", value: activeAlerts.toString(), change: "Action needed", trend: activeAlerts > 0 ? "down" : "up", icon: AlertTriangle },
        { title: "Verification Rate", value: `${verificationRate}%`, change: "Overall", trend: "neutral", icon: ShieldCheck },
        { title: "Projects", value: projects.length.toString(), change: selectedProjectId === "all" ? "National" : "Selected", trend: "neutral", icon: Globe },
    ];

    return (
        <div className="space-y-6">
            {/* Header with Project Selector */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Operational Dashboard</h1>
                    <p className="text-slate-400">
                        {selectedProjectId === "all"
                            ? "National Blue Carbon Monitoring, Reporting, and Verification."
                            : `Monitoring ${selectedProject?.name}`}
                    </p>
                </div>

                {/* Project Selector Dropdown */}
                <div className="relative">
                    <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="appearance-none bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 pr-10 text-white text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all min-w-[250px]"
                    >
                        <option value="all">🌍 National Overview (All Projects)</option>
                        {projects.map((p: any) => (
                            <option key={p.id} value={p.id}>
                                📍 {p.name} — {p.region}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
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
                            <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-emerald-500' : stat.trend === 'down' ? 'text-amber-500' : 'text-slate-500'}`}>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl min-h-[400px] flex items-center justify-center relative overflow-hidden h-[500px]">
                    <MapWrapper
                        plots={filtered.plots}
                        alerts={filtered.alerts}
                        leakageZones={filtered.leakage}
                        samplePlots={filtered.samplePlots}
                        projectAreas={filtered.projectAreas}
                    />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl min-h-[400px] overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="font-medium text-white">
                            {selectedProjectId === "all" ? "Recent Alerts" : "Project Alerts"}
                        </h3>
                        <Activity className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="divide-y divide-slate-800/50 flex-1 overflow-y-auto">
                        {filtered.recentAlerts.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No alerts found.</div>
                        ) : (
                            filtered.recentAlerts.map((alert: any) => (
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

            {/* Project Summary Cards (for National Overview) */}
            {selectedProjectId === "all" && projects.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-emerald-500" />
                        Active Projects
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projects.map((project: any) => {
                            const projectAlerts = allAlerts.filter((a: any) => a.project_id === project.id);
                            const projectActiveAlerts = projectAlerts.filter((a: any) => a.status !== 'Verified');
                            const projectAreas = geoProjectAreas.filter((pa: any) => pa.project_id === project.id);

                            return (
                                <button
                                    key={project.id}
                                    onClick={() => setSelectedProjectId(project.id)}
                                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-left hover:border-emerald-500/50 transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{project.name}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${project.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                            {project.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-3">{project.region}{project.district ? ` · ${project.district}` : ''}</p>
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="text-slate-500">
                                            <span className="text-amber-400 font-medium">{projectActiveAlerts.length}</span> active alerts
                                        </span>
                                        <span className="text-slate-600">•</span>
                                        <span className="text-slate-500">
                                            <span className="text-sky-400 font-medium">{projectAreas.length}</span> layers
                                        </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {project.project_types?.map((pt: string) => (
                                            <span key={pt} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 capitalize">
                                                {pt}
                                            </span>
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
