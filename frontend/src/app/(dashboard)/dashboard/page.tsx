import { createClient } from "@/utils/supabase/server";
import { Activity, AlertTriangle, ShieldCheck, TreePine, Clock, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const supabase = await createClient();

    // Fetch all projects for the selector
    const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

    // Fetch all GeoJSON layers with project_id for filtering
    const { data: geoPlots } = await supabase.from('geojson_plots').select('*');
    const { data: geoAlerts } = await supabase.from('geojson_alerts').select('*');
    const { data: geoLeakage } = await supabase.from('geojson_leakage_zones').select('*');
    const { data: geoSamplePlots } = await supabase.from('geojson_sample_plots').select('*');
    const { data: geoProjectAreas } = await supabase.from('geojson_project_areas').select('*');

    // Fetch alerts for the feed
    const { data: allAlerts } = await supabase
        .from("sar_change_alerts")
        .select("*")
        .order("event_date", { ascending: false })
        .limit(50);

    // Fetch mangrove plots for extent calculation
    const { data: plots } = await supabase.from("mangrove_plots").select("area_ha, project_id");

    return (
        <DashboardClient
            projects={projects || []}
            geoPlots={geoPlots || []}
            geoAlerts={geoAlerts || []}
            geoLeakage={geoLeakage || []}
            geoSamplePlots={geoSamplePlots || []}
            geoProjectAreas={geoProjectAreas || []}
            allAlerts={allAlerts || []}
            plots={plots || []}
        />
    );
}
