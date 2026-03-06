"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { DownloadCloud, FileText, Database, ShieldAlert, AlertTriangle, DatabaseZap } from "lucide-react";
import Link from "next/link";

export default function ExportManager({ activeCycle, isGatewayUnlocked, projects }: { activeCycle: any, isGatewayUnlocked: boolean, projects?: any[] }) {
    const supabase = createClient();
    const [isExporting, setIsExporting] = useState<string | null>(null);

    // Simple JSON to CSV Converter
    const convertToCSV = (arr: any[]) => {
        if (arr.length === 0) return "";
        const array = [Object.keys(arr[0])].concat(arr);

        return array.map(it => {
            return Object.values(it).map(val => {
                // Ensure strings with commas are quoted
                if (typeof val === 'string' && val.includes(',')) {
                    return `"${val}"`;
                }
                // Handle nulls and objects
                if (val === null || val === undefined) return '';
                if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
                return val;
            }).join(',');
        }).join('\n');
    };

    const triggerDownload = (csvContent: string, filename: string) => {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportPlotRegistry = async () => {
        setIsExporting("plots");
        try {
            const { data, error } = await supabase
                .from('plot_measurements')
                .select(`
                    id,
                    plot_id,
                    measurement_date,
                    tree_count,
                    canopy_cover_percent,
                    average_dbh_cm,
                    average_height_m,
                    agb_t_ha,
                    bgb_t_ha,
                    logged_by,
                    sample_plots ( plot_name, location_lat, location_lng, area_ha, stratum )
                `);

            if (error) throw error;

            // Flatten the nested object for easier CSV reading
            const flatData = data.map(row => {
                const sp: any = row.sample_plots;
                return {
                    Measurement_ID: row.id,
                    Plot_Name: sp?.plot_name,
                    Latitude: sp?.location_lat,
                    Longitude: sp?.location_lng,
                    Area_HA: sp?.area_ha,
                    Stratum: sp?.stratum,
                    Date: row.measurement_date,
                    Tree_Count: row.tree_count,
                    Canopy_Cover: row.canopy_cover_percent,
                    Avg_DBH_cm: row.average_dbh_cm,
                    Avg_Height_m: row.average_height_m,
                    AGB_t_ha: row.agb_t_ha,
                    BGB_t_ha: row.bgb_t_ha,
                    Logged_By: row.logged_by
                };
            });

            const csv = convertToCSV(flatData);
            triggerDownload(csv, `blue_carbon_plot_registry_${new Date().toISOString().split('T')[0]}.csv`);
        } catch (error) {
            console.error("Export Failed:", error);
            alert("Failed to export Plot Registry");
        }
        setIsExporting(null);
    };

    const exportSoilRegistry = async () => {
        setIsExporting("soil");
        try {
            const { data, error } = await supabase
                .from('soil_samples')
                .select(`
                    sample_id,
                    plot_id,
                    collection_date,
                    core_depth_cm,
                    core_volume_cm3,
                    dry_weight_g,
                    bulk_density_g_cm3,
                    carbon_fraction,
                    soil_carbon_density_t_ha,
                    lab_technician,
                    sample_plots ( plot_name, stratum )
                `);

            if (error) throw error;

            const flatData = data.map(row => {
                const sp: any = row.sample_plots;
                return {
                    Sample_ID: row.sample_id,
                    Plot_Name: sp?.plot_name,
                    Stratum: sp?.stratum,
                    Collection_Date: row.collection_date,
                    Depth_cm: row.core_depth_cm,
                    Volume_cm3: row.core_volume_cm3,
                    Dry_Weight_g: row.dry_weight_g,
                    Bulk_Density_g_cm3: row.bulk_density_g_cm3,
                    Carbon_Fraction: row.carbon_fraction,
                    Soil_Carbon_Density_t_ha: row.soil_carbon_density_t_ha,
                    Lab_Technician: row.lab_technician
                };
            });

            const csv = convertToCSV(flatData);
            triggerDownload(csv, `blue_carbon_soil_registry_${new Date().toISOString().split('T')[0]}.csv`);
        } catch (error) {
            console.error("Export Failed:", error);
            alert("Failed to export Soil Registry");
        }
        setIsExporting(null);
    };

    const exportCalculationLedger = async () => {
        setIsExporting("ledger");
        try {
            const { data, error } = await supabase
                .from('carbon_calculations')
                .select(`
                    id,
                    plot_id,
                    calculation_date,
                    total_agb_c_t,
                    total_bgb_c_t,
                    total_soc_t,
                    total_ecosystem_c_t,
                    gross_tco2e,
                    leakage_deduction_t,
                    buffer_deduction_t,
                    net_issuable_tco2e,
                    sample_plots ( plot_name, area_ha, stratum )
                `);

            if (error) throw error;

            const flatData = data.map(row => {
                const sp: any = row.sample_plots;
                return {
                    Calculation_ID: row.id,
                    Plot_Name: sp?.plot_name,
                    Stratum: sp?.stratum,
                    Area_HA: sp?.area_ha,
                    Date: row.calculation_date,
                    Total_AGB_C_t: row.total_agb_c_t,
                    Total_BGB_C_t: row.total_bgb_c_t,
                    Total_SOC_t: row.total_soc_t,
                    Total_Ecosystem_C_t: row.total_ecosystem_c_t,
                    Gross_tCO2e: row.gross_tco2e,
                    Leakage_Deduction_t: row.leakage_deduction_t,
                    Buffer_Deduction_t: row.buffer_deduction_t,
                    Net_Issuable_tCO2e: row.net_issuable_tco2e
                };
            });

            const csv = convertToCSV(flatData);
            triggerDownload(csv, `blue_carbon_master_ledger_${new Date().toISOString().split('T')[0]}.csv`);
        } catch (error) {
            console.error("Export Failed:", error);
            alert("Failed to export Master Ledger");
        }
        setIsExporting(null);
    };

    if (!activeCycle) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center border border-gray-200 dark:border-gray-700">
                <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Active Monitoring Cycle</h3>
                <p className="text-gray-500 mt-2">Cannot generate a registry export without an active audit period.</p>
            </div>
        );
    }

    if (!isGatewayUnlocked) {
        return (
            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-xl shadow p-8 text-center">
                <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Verification Gateway Locked</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl mx-auto mb-6">
                    The Registry Export packs cannot be downloaded because the <span className="font-semibold text-rose-600">"{activeCycle.name}"</span> audit cycle still has pending compliance requirements.
                </p>
                <Link
                    href="/compliance"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                    Review Traceability Checklists
                </Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Plot Data Regstry */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full">
                <div className="mb-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Plot Measurements Registry</h3>
                    <p className="text-sm text-gray-500 mt-2 flex-grow">
                        Extract structural forest data including Tree Counts, AGB, BGB, Canopy Cover, and DBH measurements formatted for registry upload.
                    </p>
                </div>

                <button
                    onClick={exportPlotRegistry}
                    disabled={isExporting !== null}
                    className="mt-auto w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    {isExporting === "plots" ? "Compiling..." : <><DownloadCloud className="h-4 w-4" /> Export CSV Pack</>}
                </button>
            </div>

            {/* Soil Data Registry */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full">
                <div className="mb-4">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-4">
                        <Database className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Soil Carbon Registry</h3>
                    <p className="text-sm text-gray-500 mt-2 flex-grow">
                        Extract laboratory core samples, Bulk Density, Carbon Fraction, and absolute SOC values used inside the issuance engine.
                    </p>
                </div>

                <button
                    onClick={exportSoilRegistry}
                    disabled={isExporting !== null}
                    className="mt-auto w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    {isExporting === "soil" ? "Compiling..." : <><DownloadCloud className="h-4 w-4" /> Export CSV Pack</>}
                </button>
            </div>

            {/* Master Ledger */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-primary/20 p-6 flex flex-col h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <DatabaseZap className="h-24 w-24 text-primary" />
                </div>

                <div className="mb-4 relative z-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 border border-primary/20">
                        <DatabaseZap className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Calculation Master Ledger
                    </h3>
                    <p className="text-sm text-gray-500 mt-2 flex-grow">
                        The fully auditable ledger containing Plot IDs, system Carbon pools, executed Risk Buffer deductions, and final Net Issuable VCUs.
                    </p>
                </div>

                <button
                    onClick={exportCalculationLedger}
                    disabled={isExporting !== null}
                    className="relative z-10 mt-auto w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
                >
                    {isExporting === "ledger" ? "Compiling..." : <><DownloadCloud className="h-4 w-4" /> Export VCU Ledger</>}
                </button>
            </div>

        </div>
    );
}
