import { createClient } from "@/utils/supabase/server";
import { ShieldCheck } from "lucide-react";
import ComplianceManager from "./ComplianceManager";

export const dynamic = "force-dynamic";

export default async function ComplianceDashboardPage() {
    const supabase = await createClient();

    const { data: projects } = await supabase.from("projects").select("id, name, region").order("name");
    const { data: cycles } = await supabase.from("monitoring_cycles").select("*").order("start_date", { ascending: false });
    const { data: checklists } = await supabase
        .from("compliance_checklists")
        .select(`id, cycle_id, requirement_type, is_met, verified_by, verified_at, notes, project_id, monitoring_cycles ( name, status )`)
        .order("requirement_type", { ascending: true });

    const { data: { user } } = await supabase.auth.getUser();
    let isAdmin = false;
    if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (profile?.role === "admin") isAdmin = true;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                        Traceability & Compliance
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage mandatory MRV checkpoints to unlock Carbon Accounting extraction.
                    </p>
                </div>
            </div>

            <ComplianceManager
                cycles={cycles || []}
                initialChecklists={checklists || []}
                isAdmin={isAdmin}
                userEmail={user?.email || ""}
                projects={projects || []}
            />
        </div>
    );
}
