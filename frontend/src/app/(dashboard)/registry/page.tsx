import { createClient } from "@/utils/supabase/server";
import { DatabaseZap } from "lucide-react";
import ExportManager from "./ExportManager";

export const dynamic = "force-dynamic";

export default async function RegistryInterfacePage() {
    const supabase = await createClient();

    const { data: projects } = await supabase.from("projects").select("id, name, region").order("name");

    const { data: activeCycles } = await supabase
        .from('monitoring_cycles')
        .select('*')
        .eq('status', 'Active')
        .limit(1);

    const activeCycle = activeCycles?.[0];

    let isGatewayUnlocked = false;
    if (activeCycle) {
        const { data: checklists } = await supabase
            .from('compliance_checklists')
            .select('is_met')
            .eq('cycle_id', activeCycle.id);
        if (checklists && checklists.length > 0) {
            isGatewayUnlocked = checklists.every(c => c.is_met);
        }
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <DatabaseZap className="h-8 w-8 text-primary" />
                        Registry Interface
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Export structured MRV datasets for external National or International carbon registries.
                    </p>
                </div>
            </div>

            <ExportManager
                activeCycle={activeCycle}
                isGatewayUnlocked={isGatewayUnlocked}
                projects={projects || []}
            />
        </div>
    );
}
