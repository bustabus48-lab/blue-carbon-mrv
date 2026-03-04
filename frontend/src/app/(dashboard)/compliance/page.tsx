import { createClient } from "@/utils/supabase/server";
import { ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import ComplianceManager from "./ComplianceManager";

export const dynamic = "force-dynamic";

export default async function ComplianceDashboardPage() {
    const supabase = await createClient();

    // 1. Fetch all available monitoring cycles
    const { data: cycles } = await supabase
        .from("monitoring_cycles")
        .select("*")
        .order("start_date", { ascending: false });

    // 2. Fetch all checklist items along with their cycle
    const { data: checklists } = await supabase
        .from("compliance_checklists")
        .select(`
            id,
            cycle_id,
            requirement_type,
            is_met,
            verified_by,
            verified_at,
            notes,
            monitoring_cycles (
                name,
                status
            )
        `)
        .order("requirement_type", { ascending: true });

    // 3. Get the active user to control Admin-only toggles
    const { data: { user } } = await supabase.auth.getUser();
    let isAdmin = false;

    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
        if (profile?.role === "admin") {
            isAdmin = true;
        }
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

            {/* Client Component to filter cycles and manage toggle state */}
            <ComplianceManager
                cycles={cycles || []}
                initialChecklists={checklists || []}
                isAdmin={isAdmin}
                userEmail={user?.email || ""}
            />

        </div>
    );
}
