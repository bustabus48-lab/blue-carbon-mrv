"use client";

import { MapContainer, TileLayer, GeoJSON, Tooltip, LayersControl, FeatureGroup } from 'react-leaflet';
import type { GeoJsonObject } from 'geojson';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icon issues in Next.js if a point is ever rendered
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

type FeatureRow = Record<string, unknown> & { id: string; geojson: GeoJsonObject };

interface MapProps {
    plots?: FeatureRow[];
    alerts?: FeatureRow[];
    leakageZones?: FeatureRow[];
    samplePlots?: FeatureRow[];
    projectAreas?: FeatureRow[];
    samplePlotBoundaries?: FeatureRow[];
}

const projectAreaStyleByType: Record<string, { color: string; fillOpacity: number }> = {
    restoration: { color: '#22c55e', fillOpacity: 0.12 },
    conservation: { color: '#3b82f6', fillOpacity: 0.12 },
    protection: { color: '#f97316', fillOpacity: 0.12 },
    buffer: { color: '#a855f7', fillOpacity: 0.1 },
    reference: { color: '#14b8a6', fillOpacity: 0.1 },
};

export default function Map({
    plots = [],
    alerts = [],
    leakageZones = [],
    samplePlots = [],
    projectAreas = [],
    samplePlotBoundaries = [],
}: MapProps) {
    const ghanaCenter: [number, number] = [5.6, -0.2];

    return (
        <MapContainer center={ghanaCenter} zoom={8} scrollWheelZoom={true} className="w-full h-full rounded-xl z-0 relative">
            <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Dark Satellite (Carto)">
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/">Carto</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                </LayersControl.BaseLayer>

                <LayersControl.Overlay checked name="National Mangrove Baseline">
                    <TileLayer
                        attribution='&copy; <a href="https://www.globalmangrovewatch.org">Global Mangrove Watch</a>'
                        url="https://tiles.globalmangrovewatch.org/gmw/v3/2020/{z}/{x}/{y}.png"
                        opacity={0.8}
                    />
                </LayersControl.Overlay>

                {(plots.length > 0 || projectAreas.length > 0 || samplePlots.length > 0 || alerts.length > 0 || leakageZones.length > 0 || samplePlotBoundaries.length > 0) && (
                    <LayersControl.Overlay checked name="Project Specific Data">
                        <FeatureGroup>
                            {plots.map((plot) => (
                                <GeoJSON
                                    key={plot.id}
                                    data={plot.geojson}
                                    pathOptions={{ color: '#10b981', weight: 2, fillOpacity: 0.15 }}
                                >
                                    <Tooltip sticky>
                                        <div className="text-sm p-1">
                                            <strong className="text-emerald-700">{String(plot.stratum_name ?? '')}</strong><br />
                                            <span className="text-slate-600">Area: {String(plot.area_ha ?? 'N/A')} ha</span><br />
                                            <span className="text-slate-600">Planted: {String(plot.planting_date ?? 'N/A')}</span>
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
                                        fillOpacity: 0.4,
                                    }}
                                >
                                    <Tooltip sticky>
                                        <div className="text-sm p-1">
                                            <strong className="text-slate-800">{String(alert.alert_type ?? '')} Alert</strong><br />
                                            <span className="text-slate-600">Severity: {String(alert.severity ?? '')}</span><br />
                                            <span className="text-slate-600">Status: {String(alert.status ?? '')}</span><br />
                                            <span className="text-slate-600">Area: {String(alert.detected_area_ha ?? 'N/A')} ha</span>
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
                                            <span className="text-slate-600">Name: {String(zone.zone_name ?? '')}</span><br />
                                            <span className="text-slate-600">Area: {String(zone.area_ha ?? 'N/A')} ha</span>
                                        </div>
                                    </Tooltip>
                                </GeoJSON>
                            ))}

                            {samplePlots.map((plot) => (
                                <GeoJSON
                                    key={plot.id}
                                    data={plot.geojson}
                                    pointToLayer={(_feature, latlng) => {
                                        return L.circleMarker(latlng, {
                                            radius: 6,
                                            fillColor: '#0ea5e9',
                                            color: '#fff',
                                            weight: 2,
                                            opacity: 1,
                                            fillOpacity: 0.9,
                                        });
                                    }}
                                >
                                    <Tooltip sticky>
                                        <div className="text-sm p-1">
                                            <strong className="text-sky-600">Sample Plot QA/QC</strong><br />
                                            <span className="text-slate-600">Name: {String(plot.plot_name ?? '')}</span><br />
                                            <span className="text-slate-600">Stratum: {String(plot.stratum ?? '')}</span><br />
                                            <span className="text-slate-600 leading-tight">Status: <span className="font-medium text-slate-800">{String(plot.status ?? '')}</span></span>
                                        </div>
                                    </Tooltip>
                                </GeoJSON>
                            ))}

                            {samplePlotBoundaries.map((boundary) => (
                                <GeoJSON
                                    key={boundary.id}
                                    data={boundary.geojson}
                                    pathOptions={{ color: '#f97316', weight: 2, dashArray: '4,4', fillOpacity: 0.05 }}
                                >
                                    <Tooltip sticky>
                                        <div className="text-sm p-1">
                                            <strong className="text-orange-600">PSP Boundary</strong><br />
                                            <span className="text-slate-600">Name: {String(boundary.boundary_name ?? 'Unnamed')}</span><br />
                                            <span className="text-slate-600">Area: {String(boundary.area_ha ?? 'N/A')} ha</span>
                                        </div>
                                    </Tooltip>
                                </GeoJSON>
                            ))}

                            {projectAreas.map((area) => {
                                const areaType = String(area.area_type ?? 'reference');
                                const style = projectAreaStyleByType[areaType] || projectAreaStyleByType.reference;

                                return (
                                    <GeoJSON
                                        key={area.id}
                                        data={area.geojson}
                                        pathOptions={{ color: style.color, weight: 2, fillOpacity: style.fillOpacity }}
                                    >
                                        <Tooltip sticky>
                                            <div className="text-sm p-1">
                                                <strong className="text-slate-800">{String(area.area_name ?? '')}</strong><br />
                                                <span className="text-slate-600">Type: {areaType}</span><br />
                                                <span className="text-slate-600">Area: {String(area.area_ha ?? 'N/A')} ha</span>
                                            </div>
                                        </Tooltip>
                                    </GeoJSON>
                                );
                            })}
                        </FeatureGroup>
                    </LayersControl.Overlay>
                )}
            </LayersControl>
        </MapContainer>
    );
}
