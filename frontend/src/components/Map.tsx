"use client";

import { MapContainer, TileLayer, GeoJSON, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icon issues in Next.js if a point is ever rendered
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface MapProps {
    plots?: any[];
    alerts?: any[];
    leakageZones?: any[];
    samplePlots?: any[];
    projectAreas?: any[];
}

const projectAreaStyleByType: Record<string, { color: string; fillOpacity: number }> = {
    restoration: { color: '#22c55e', fillOpacity: 0.12 },
    conservation: { color: '#3b82f6', fillOpacity: 0.12 },
    protection: { color: '#f97316', fillOpacity: 0.12 },
    buffer: { color: '#a855f7', fillOpacity: 0.1 },
    reference: { color: '#14b8a6', fillOpacity: 0.1 },
};

export default function Map({ plots = [], alerts = [], leakageZones = [], samplePlots = [], projectAreas = [] }: MapProps) {
    const ghanaCenter: [number, number] = [5.6, -0.2];

    return (
        <MapContainer center={ghanaCenter} zoom={8} scrollWheelZoom={true} className="w-full h-full rounded-xl z-0 relative">
            <TileLayer
                attribution='&copy; <a href="https://carto.com/">Carto</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {plots.map((plot) => (
                <GeoJSON
                    key={plot.id}
                    data={plot.geojson}
                    pathOptions={{ color: '#10b981', weight: 2, fillOpacity: 0.15 }}
                >
                    <Tooltip sticky>
                        <div className="text-sm p-1">
                            <strong className="text-emerald-700">{plot.stratum_name}</strong><br />
                            <span className="text-slate-600">Area: {plot.area_ha} ha</span><br />
                            <span className="text-slate-600">Planted: {plot.planting_date}</span>
                        </div>
                    </Tooltip>
                </GeoJSON>
            ))}

            {alerts.map((alert) => (
                <GeoJSON
                    key={alert.id}
                    data={alert.geojson}
                    pathOptions={{
                        color: alert.severity === 'High' || alert.severity === 'Critical' ? '#f43f5e' : '#f59e0b',
                        weight: 2,
                        fillOpacity: 0.4
                    }}
                >
                    <Tooltip sticky>
                        <div className="text-sm p-1">
                            <strong className="text-slate-800">{alert.alert_type} Alert</strong><br />
                            <span className="text-slate-600">Severity: {alert.severity}</span><br />
                            <span className="text-slate-600">Status: {alert.status}</span><br />
                            <span className="text-slate-600">Area: {alert.detected_area_ha} ha</span>
                        </div>
                    </Tooltip>
                </GeoJSON>
            ))}

            {leakageZones.map((zone) => (
                <GeoJSON
                    key={zone.id}
                    data={zone.geojson}
                    pathOptions={{ color: '#8b5cf6', weight: 2, dashArray: '5, 5', fillOpacity: 0.1 }}
                >
                    <Tooltip sticky>
                        <div className="text-sm p-1">
                            <strong className="text-violet-600">Buffer Zone</strong><br />
                            <span className="text-slate-600">Name: {zone.zone_name}</span><br />
                            <span className="text-slate-600">Area: {zone.area_ha} ha</span>
                        </div>
                    </Tooltip>
                </GeoJSON>
            ))}

            {samplePlots.map((plot) => (
                <GeoJSON
                    key={plot.id}
                    data={plot.geojson}
                    pointToLayer={(feature, latlng) => {
                        return L.circleMarker(latlng, {
                            radius: 6,
                            fillColor: "#0ea5e9",
                            color: "#fff",
                            weight: 2,
                            opacity: 1,
                            fillOpacity: 0.9
                        });
                    }}
                >
                    <Tooltip sticky>
                        <div className="text-sm p-1">
                            <strong className="text-sky-600">Sample Plot QA/QC</strong><br />
                            <span className="text-slate-600">Name: {plot.plot_name}</span><br />
                            <span className="text-slate-600">Stratum: {plot.stratum}</span><br />
                            <span className="text-slate-600 leading-tight">Status: <span className="font-medium text-slate-800">{plot.status}</span></span>
                        </div>
                    </Tooltip>
                </GeoJSON>
            ))}

            {projectAreas.map((area) => {
                const areaType = area.area_type || 'reference';
                const style = projectAreaStyleByType[areaType] || projectAreaStyleByType.reference;

                return (
                    <GeoJSON
                        key={area.id}
                        data={area.geojson}
                        pathOptions={{ color: style.color, weight: 2, fillOpacity: style.fillOpacity }}
                    >
                        <Tooltip sticky>
                            <div className="text-sm p-1">
                                <strong className="text-slate-800">{area.area_name}</strong><br />
                                <span className="text-slate-600">Type: {areaType}</span><br />
                                <span className="text-slate-600">Area: {area.area_ha ?? 'N/A'} ha</span>
                            </div>
                        </Tooltip>
                    </GeoJSON>
                );
            })}
        </MapContainer>
    );
}
