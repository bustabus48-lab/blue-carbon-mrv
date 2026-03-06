import { createClient } from "@/utils/supabase/server";
import AccountingClient from "./AccountingClient";

export default async function CarbonAccountingDashboard() {
    const supabase = await createClient();

    const { data: projects } = await supabase.from("projects").select("id, name, region").order("name");
    const { data: calculations } = await supabase
        .from("carbon_calculations")
        .select("*, sample_plots(plot_name, area_ha)")
        .order("calculation_date", { ascending: false });

    const { data: activeCycles } = await supabase
        .from("monitoring_cycles")
        .select("id, name")
        .eq("status", "Active")
        .limit(1);

    const activeCycle = activeCycles?.[0];
    let pendingRequirements = 0;

    if (activeCycle) {
        const { data: checklists } = await supabase
            .from("compliance_checklists")
            .select("is_met")
            .eq("cycle_id", activeCycle.id);
        if (checklists) {
            pendingRequirements = checklists.filter((c: any) => !c.is_met).length;
        }
    }

    return (
        <AccountingClient
            projects={projects || []}
            calculations={calculations || []}
            activeCycleName={activeCycle?.name || null}
            pendingRequirements={pendingRequirements}
        />
    );
}
