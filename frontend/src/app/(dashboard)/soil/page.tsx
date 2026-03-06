import { createClient } from "@/utils/supabase/server";
import SoilClient from "./SoilClient";

export default async function SoilDashboard() {
    const supabase = await createClient();

    const { data: projects } = await supabase.from("projects").select("id, name, region").order("name");
    const { data: samples } = await supabase
        .from("soil_samples")
        .select("*, sample_plots(plot_name, project_id)")
        .order("collected_date", { ascending: false });

    return <SoilClient projects={projects || []} samples={samples || []} />;
}
