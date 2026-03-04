"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";

export default function ExportAlertsCSV() {
    const [isExporting, setIsExporting] = useState(false);
    const supabase = createClient();

    const handleExport = async () => {
        setIsExporting(true);
        try {
            // Fetch alerts with their assigned profile emails if available
            const { data, error } = await supabase
                .from("sar_change_alerts")
                .select(`
                    id,
                    alert_type,
                    severity,
                    confidence_score,
                    status,
                    detected_area_ha,
                    event_date,
                    assigned_to,
                    profiles ( email )
                `)
                .order("event_date", { ascending: false });

            if (error) throw error;
            if (!data || data.length === 0) {
                alert("No data to export.");
                return;
            }

            // Convert JSON array to CSV string
            const headers = [
                "ID",
                "Alert Type",
                "Severity",
                "Confidence Score (%)",
                "Status",
                "Detected Area (Ha)",
                "Event Date",
                "Assigned Agent"
            ];

            const csvRows = [
                headers.join(","),
                ...data.map((row: any) => {
                    const assignee = row.profiles?.email || "Unassigned";
                    const confidence = Math.round((row.confidence_score || 0) * 100);
                    return [
                        row.id,
                        `"${row.alert_type}"`,
                        row.severity,
                        confidence,
                        `"${row.status}"`,
                        row.detected_area_ha,
                        row.event_date,
                        `"${assignee}"`
                    ].join(",");
                })
            ];

            const csvString = csvRows.join("\n");

            // Create a Blob and trigger a download
            const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `MRV_Alerts_Report_${format(new Date(), "yyyy-MM-dd")}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export operational report.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700 disabled:opacity-50"
        >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-emerald-500" />}
            <span>Export CSV</span>
        </button>
    );
}
