import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import UploadEvidence from "./UploadEvidence";
import StatusWidget from "./StatusWidget";
import AssignmentWidget from "./AssignmentWidget";
import MapWrapper from "@/components/MapWrapper";
import { Activity, MapPin, Calendar, CheckSquare } from "lucide-react";
import { format } from "date-fns";

export default async function AlertDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient();

    // Fetch the main alert and its GeoJSON polygon specifically
    const { data: alertGeoJSON } = await supabase
        .from("geojson_alerts")
        .select("*")
        .eq("id", params.id)
        .single();

    if (!alertGeoJSON) {
        notFound();
    }

    // Fetch the actual record to get standard text fields
    const { data: alert } = await supabase
        .from("sar_change_alerts")
        .select("*")
        .eq("id", params.id)
        .single();

    // Fetch the evidence timeline (Photos & Notes)
    const { data: evidenceList } = await supabase
        .from("alert_evidence")
        .select("*")
        .eq("alert_id", params.id)
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Activity className="w-6 h-6 text-emerald-500" />
                    Alert Details: {alertGeoJSON.alert_type}
                </h1>
                <p className="text-slate-400">Manage verification and field evidence.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Map and Evidence Feed */}
                <div className="col-span-1 lg:col-span-2 space-y-6">
                    {/* Map Box */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden h-[450px]">
                        <MapWrapper plots={[]} alerts={[alertGeoJSON]} />
                    </div>

                    {/* Evidence Timeline */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-slate-800">
                            <h3 className="font-medium text-white flex items-center gap-2">
                                <CheckSquare className="w-4 h-4 text-emerald-500" />
                                Evidence Timeline
                            </h3>
                        </div>
                        <div className="p-4 space-y-6">
                            {(!evidenceList || evidenceList.length === 0) ? (
                                <p className="text-slate-500 text-center py-6">No field evidence uploaded yet.</p>
                            ) : (
                                evidenceList.map((env) => (
                                    <div key={env.id} className="flex gap-4 border-b border-slate-800/50 pb-6 last:border-0 last:pb-0">
                                        <div className="flex-shrink-0 w-32 h-32 rounded-lg bg-slate-800 overflow-hidden border border-slate-700">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={env.photo_url} alt="Field Evidence" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                                <Calendar className="w-3 h-3" />
                                                <span>{format(new Date(env.created_at), "MMM d, yyyy h:mm a")}</span>
                                            </div>
                                            <p className="text-slate-300 text-sm whitespace-pre-wrap">{env.notes || "No notes provided."}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions and Info */}
                <div className="space-y-6">
                    {/* Alert Meta Info */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-white mb-4">Alert Metadata</h3>
                        <div className="space-y-4">
                            <div>
                                <span className="text-xs text-slate-500 block mb-1">Severity</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${alert.severity === 'Critical' || alert.severity === 'High' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                    {alert.severity}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block mb-1">Detected Area</span>
                                <span className="text-slate-200 font-mono text-sm">{alert.detected_area_ha} ha</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block mb-1">Detection Date</span>
                                <span className="text-slate-200 text-sm">{format(new Date(alert.event_date), "MMMM d, yyyy")}</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block mb-1">Confidence Score</span>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: `${alert.confidence_score * 100}%` }}></div>
                                    </div>
                                    <span className="text-xs text-slate-400 font-mono">{Math.round(alert.confidence_score * 100)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Verification Actions */}
                    <AssignmentWidget alertId={alert.id} currentAssigneeId={alert.assigned_to} />
                    <StatusWidget alertId={alert.id} currentStatus={alert.status} />

                    {/* Upload Box */}
                    <UploadEvidence alertId={alert.id} />
                </div>
            </div>
        </div>
    );
}
