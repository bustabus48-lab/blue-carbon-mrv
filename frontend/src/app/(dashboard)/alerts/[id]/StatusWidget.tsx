"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react";

export default function StatusWidget({ alertId, currentStatus }: { alertId: string, currentStatus: string }) {
    const [isUpdating, setIsUpdating] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdating(true);

        const { error } = await supabase
            .from("sar_change_alerts")
            .update({ status: newStatus })
            .eq("id", alertId);

        if (!error) {
            router.refresh();
        } else {
            console.error("Failed to update status", error);
        }

        setIsUpdating(false);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Verified': return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            case 'False Positive': return "bg-slate-800 text-slate-400 border-slate-700";
            case 'In Review': return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            default: return "bg-amber-500/10 text-amber-500 border-amber-500/20";
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-medium text-white mb-4">Verification Actions</h3>

            <div className="mb-6">
                <span className="text-sm text-slate-400 block mb-2">Current Status</span>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${getStatusStyle(currentStatus)}`}>
                    {currentStatus === 'Verified' && <CheckCircle className="w-4 h-4" />}
                    {currentStatus === 'False Positive' && <AlertCircle className="w-4 h-4" />}
                    {currentStatus === 'Pending' && <Clock className="w-4 h-4" />}
                    {currentStatus === 'In Review' && <RefreshCw className="w-4 h-4" />}
                    {currentStatus}
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-sm font-medium text-slate-400 mb-2">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        disabled={isUpdating || currentStatus === 'Verified'}
                        onClick={() => handleStatusChange('Verified')}
                        className="bg-slate-800 hover:bg-emerald-900/40 text-slate-200 text-sm py-2 px-3 rounded-lg border border-slate-700 hover:border-emerald-500/50 transition-colors disabled:opacity-50"
                    >
                        Mark Verified
                    </button>
                    <button
                        disabled={isUpdating || currentStatus === 'False Positive'}
                        onClick={() => handleStatusChange('False Positive')}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm py-2 px-3 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
                    >
                        False Positive
                    </button>
                    <button
                        disabled={isUpdating || currentStatus === 'In Review'}
                        onClick={() => handleStatusChange('In Review')}
                        className="bg-slate-800 hover:bg-blue-900/40 text-slate-200 text-sm py-2 px-3 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-colors disabled:opacity-50 col-span-2"
                    >
                        Mark In Review
                    </button>
                </div>
            </div>
        </div>
    );
}
