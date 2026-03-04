"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { UserPlus, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AssignmentWidget({ alertId, currentAssigneeId }: { alertId: string, currentAssigneeId?: string | null }) {
    const supabase = createClient();
    const router = useRouter();
    const [profiles, setProfiles] = useState<{ id: string, email: string }[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>(currentAssigneeId || "");
    const [isUpdating, setIsUpdating] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const fetchProfiles = async () => {
            const { data, error } = await supabase.from("profiles").select("id, email");
            if (data) {
                setProfiles(data);
            }
            if (error) {
                console.error("Error fetching profiles:", error);
            }
        };
        fetchProfiles();
    }, [supabase]);

    const handleAssign = async () => {
        setIsUpdating(true);
        const { error } = await supabase
            .from("sar_change_alerts")
            .update({ assigned_to: selectedUserId || null })
            .eq("id", alertId);

        if (!error) {
            setSuccessMessage("Agent assigned successfully.");
            router.refresh();
            setTimeout(() => setSuccessMessage(""), 3000);
        } else {
            console.error("Failed to assign agent", error);
        }
        setIsUpdating(false);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-500" />
                Assign Field Agent
            </h3>

            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-slate-400">Select CREMA Agent</label>
                    <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                        <option value="">-- Unassigned --</option>
                        {profiles.map((profile) => (
                            <option key={profile.id} value={profile.id}>
                                {profile.email}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleAssign}
                    disabled={isUpdating}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                    {isUpdating ? "Assigning..." : "Update Assignment"}
                </button>

                {successMessage && (
                    <div className="flex items-center gap-2 text-emerald-500 text-sm mt-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{successMessage}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
