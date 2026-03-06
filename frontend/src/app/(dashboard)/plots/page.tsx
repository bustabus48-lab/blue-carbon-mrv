import { createClient } from "@/utils/supabase/server";
import PlotsClient from "./PlotsClient";

export default async function PlotsRegistry() {
    const supabase = await createClient();

    const { data: projects } = await supabase.from("projects").select("id, name, region").order("name");
    const { data: plots } = await supabase
        .from("sample_plots")
        .select("id, plot_name, stratum, status, created_at, project_id, plot_measurements ( measurement_date )")
        .order("created_at", { ascending: false });

    return <PlotsClient projects={projects || []} plots={plots || []} />;
}
