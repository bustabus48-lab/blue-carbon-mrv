import { createClient } from "@/utils/supabase/server";
import AlertsClient from "./AlertsClient";

export default async function AlertsPage() {
    const supabase = await createClient();

    const { data: projects } = await supabase.from("projects").select("id, name, region").order("name");
    const { data: alerts } = await supabase.from("sar_change_alerts").select("*").order("event_date", { ascending: false });

    return <AlertsClient projects={projects || []} alerts={alerts || []} />;
}
