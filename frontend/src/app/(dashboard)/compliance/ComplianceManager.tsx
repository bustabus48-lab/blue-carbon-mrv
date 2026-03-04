"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import { CheckCircle2, Circle, ShieldCheck, AlertCircle, FileText, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

type MonitoringCycle = {
    id: string;
    start_date: string;
    end_date: string;
    name: string;
    status: string;
};

type ChecklistItem = {
    id: string;
    cycle_id: string;
    requirement_type: string;
    is_met: boolean;
    verified_by: string;
    verified_at: string;
    notes: string;
};

export default function ComplianceManager({ cycles, initialChecklists, isAdmin, userEmail }: {
    cycles: MonitoringCycle[],
    initialChecklists: ChecklistItem[],
    isAdmin: boolean,
    userEmail: string
}) {
    const router = useRouter();
    const supabase = createClient();
    const [selectedCycleId, setSelectedCycleId] = useState<string>(cycles.length > 0 ? cycles[0].id : "");
    const [checklists, setChecklists] = useState<ChecklistItem[]>(initialChecklists);
    const [isVerifying, setIsVerifying] = useState(false);

    const activeCycle = useMemo(() => cycles.find(c => c.id === selectedCycleId), [cycles, selectedCycleId]);

    // Filter checklists for the active cycle
    const currentChecklists = useMemo(() => {
        return checklists.filter(c => c.cycle_id === selectedCycleId);
    }, [checklists, selectedCycleId]);

    // Calculate score
    const totalItems = currentChecklists.length;
    const metItems = currentChecklists.filter(c => c.is_met).length;
    const percentComplete = totalItems === 0 ? 0 : Math.round((metItems / totalItems) * 100);
    const isReadyForAccounting = totalItems > 0 && metItems === totalItems;

    async function handleVerify(itemId: string) {
        if (!isAdmin) {
            alert("Only Admins can verify compliance items.");
            return;
        }

        setIsVerifying(true);
        const { error } = await supabase
            .from("compliance_checklists")
            .update({
                is_met: true,
                verified_by: userEmail,
                verified_at: new Date().toISOString()
            })
            .eq("id", itemId);

        if (error) {
            console.error("Verification failed:", error);
            alert("Failed to verify item.");
        } else {
            // Optimistic update
            setChecklists(prev => prev.map(c =>
                c.id === itemId
                    ? { ...c, is_met: true, verified_by: userEmail, verified_at: new Date().toISOString() }
                    : c
            ));
        }
        setIsVerifying(false);
    }

    return (
        <div className="space-y-6">
            {/* Top Stats Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b dark:border-gray-700 pb-4">
                    <div className="flex items-center gap-4">
                        <label className="font-semibold text-gray-700 dark:text-gray-300">Monitoring Cycle:</label>
                        <select
                            value={selectedCycleId}
                            onChange={(e) => setSelectedCycleId(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600"
                        >
                            {cycles.map(cycle => (
                                <option key={cycle.id} value={cycle.id}>{cycle.name} ({cycle.status})</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Scorecard:</span>
                        <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${percentComplete === 100 ? 'bg-green-500' : 'bg-primary'}`}
                                    style={{ width: `${percentComplete}%` }}
                                />
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white">{metItems} / {totalItems}</span>
                        </div>
                    </div>
                </div>

                {/* Gateway Status Banner */}
                <div className="mt-6 flex justify-between items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {isReadyForAccounting ? (
                                <><CheckCircle2 className="h-5 w-5 text-green-500" /> Carbon Accounting Gateway Unlocked</>
                            ) : (
                                <><AlertCircle className="h-5 w-5 text-amber-500" /> Carbon Accounting Gateway Locked</>
                            )}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {isReadyForAccounting
                                ? "All MRV mandatory requirements have been met. Standardized registry exports and credit issuance engines are active."
                                : "Standardized registry exports cannot be processed until the monitoring cycle hits 100% compliance."}
                        </p>
                    </div>
                    {isReadyForAccounting ? (
                        <button
                            onClick={() => router.push('/accounting')}
                            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Go to Accounting
                        </button>
                    ) : (
                        <button
                            disabled
                            className="bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                        >
                            Locked
                        </button>
                    )}
                </div>
            </div>

            {/* Checklist Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold font-heading text-gray-900 dark:text-white">Requirements Manager</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Requirement
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Verified By
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Admin Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {currentChecklists.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No requirements configured for this cycle.
                                    </td>
                                </tr>
                            ) : (
                                currentChecklists.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <FileText className="h-5 w-5 text-gray-400 mr-3" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {item.requirement_type}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {item.notes || "No notes provided"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.is_met ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Met
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                                    <Circle className="h-3.5 w-3.5" /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {item.verified_by || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {item.verified_at ? format(new Date(item.verified_at), "MMM d, yyyy") : "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            {!item.is_met && isAdmin ? (
                                                <button
                                                    disabled={isVerifying}
                                                    onClick={() => handleVerify(item.id)}
                                                    className="text-primary hover:text-primary/80 disabled:opacity-50"
                                                >
                                                    Verify Document
                                                </button>
                                            ) : (
                                                <span className="text-gray-300 dark:text-gray-600">
                                                    {item.is_met ? "Verified" : "No Access"}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
