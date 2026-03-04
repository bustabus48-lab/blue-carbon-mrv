"use client";

import dynamic from "next/dynamic";

const DashboardMap = dynamic(() => import("@/components/Map"), {
    ssr: false,
    loading: () => <p className="text-slate-500 font-medium animate-pulse w-full h-full flex items-center justify-center">Loading Geospatial Data...</p>
});

interface MapWrapperProps {
    plots?: any[];
    alerts?: any[];
    leakageZones?: any[];
    samplePlots?: any[];
    projectAreas?: any[];
}

export default function MapWrapper(props: MapWrapperProps) {
    return <DashboardMap {...props} />;
}
