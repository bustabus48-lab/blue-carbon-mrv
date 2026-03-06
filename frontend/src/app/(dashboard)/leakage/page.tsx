import { createClient } from "@/utils/supabase/server";
import LeakageClient from "./LeakageClient";

export const dynamic = "force-dynamic";

export default async function LeakageDashboardPage() {
    const supabase = await createClient();

    const { data: projects } = await supabase.from("projects").select("id, name, region").order("name");
    const { data: riskScores } = await supabase.from("risk_scoring").select("*").order("assessment_date", { ascending: false });
    const { data: reversals } = await supabase.from("reversal_events").select("*, sample_plots(plot_name)").order("event_date", { ascending: false });
    const { data: surveys } = await supabase.from("market_surveys").select("*").order("survey_date", { ascending: false });
    const { data: calcAggs } = await supabase.from("carbon_calculations").select("buffer_deduction_t, gross_tco2e, project_id");

    return (
        <LeakageClient
            projects={projects || []}
            riskScores={riskScores || []}
            reversals={reversals || []}
            surveys={surveys || []}
            calcAggs={calcAggs || []}
        />
    );
}
