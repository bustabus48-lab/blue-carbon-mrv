import { createClient } from "@/utils/supabase/server";
import { MapPin, Layers } from "lucide-react";
import MapWrapper from "@/components/MapWrapper";
import PolygonUpload from "@/components/PolygonUpload";

export const dynamic = "force-dynamic";

export default async function MapsPage() {
    const supabase = await createClient();

    // Fetch GeoJSON for the Map View
    const { data: geoPlots } = await supabase.from('geojson_plots').select('*');
    const { data: geoAlerts } = await supabase.from('geojson_alerts').select('*');
    const { data: geoLeakage } = await supabase.from('geojson_leakage_zones').select('*');
    const { data: geoSamplePlots } = await supabase.from('geojson_sample_plots').select('*');
    const { data: geoProjectAreas } = await supabase.from('geojson_project_areas').select('*');
    const { data: geoSamplePlotBoundaries } = await supabase.from('geojson_sample_plot_boundaries').select('*');

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-2 tracking-tight">
                        <MapPin className="h-8 w-8 text-emerald-500" />
                        Maps & Polygons
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Centralized repository for spatial data, mangrove plots, and leakage zones.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload & Management Sidebar */}
                <div className="lg:col-span-1 space-y-6 flex flex-col">
                    <PolygonUpload />

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex-1">
                        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                            <Layers className="text-emerald-500 w-5 h-5" />
                            Active Layers
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                <span className="text-sm font-medium text-emerald-400">Mangrove Plots</span>
                                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                                    {geoPlots?.length || 0} features
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                <span className="text-sm font-medium text-amber-400">SAR Alerts</span>
                                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                                    {geoAlerts?.length || 0} features
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                <span className="text-sm font-medium text-purple-400">Leakage Zones</span>
                                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                                    {geoLeakage?.length || 0} features
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                <span className="text-sm font-medium text-sky-400">Sample Plots</span>
                                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                                    {geoSamplePlots?.length || 0} features
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                <span className="text-sm font-medium text-cyan-400">Project Areas</span>
                                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                                    {geoProjectAreas?.length || 0} features
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                <span className="text-sm font-medium text-orange-400">PSP Boundaries</span>
                                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                                    {geoSamplePlotBoundaries?.length || 0} features
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map Display */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden min-h-[600px] h-full relative p-1 shadow-inner shadow-black/20">
                    <div className="absolute inset-1 rounded-xl overflow-hidden z-10">
                        <MapWrapper
                            plots={geoPlots || []}
                            alerts={geoAlerts || []}
                            leakageZones={geoLeakage || []}
                            samplePlots={geoSamplePlots || []}
                            projectAreas={geoProjectAreas || []}
                            samplePlotBoundaries={geoSamplePlotBoundaries || []}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
