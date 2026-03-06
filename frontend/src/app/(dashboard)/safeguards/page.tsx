import { createClient } from "@/utils/supabase/server";
import SafeguardsClient from "./SafeguardsClient";

export const dynamic = "force-dynamic";

export default async function SafeguardsDashboardPage() {
    const supabase = await createClient();

    const { data: projects } = await supabase.from("projects").select("id, name, region").order("name");
    const { data: grievances } = await supabase.from("grievances").select("*").order("date_reported", { ascending: false });
    const { data: documents } = await supabase.from("safeguard_documents").select("*").order("created_at", { ascending: false });

    return (
        <SafeguardsClient
            projects={projects || []}
            grievances={grievances || []}
            documents={documents || []}
        />
    );
}
