"use client";

import { useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Leaf, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SoilSampleFormProps {
    plotId: string;
    onSuccess?: () => void;
}

export function SoilSampleForm({ plotId, onSuccess }: SoilSampleFormProps) {
    const supabase = createClient();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        sampleId: '',
        depthInterval: '0-15cm',
        coreVolume: '',
        dryWeight: '',
        organicCarbon: '',
        notes: ''
    });

    // Real-time QA/QC Calculations
    const calculations = useMemo(() => {
        const volume = parseFloat(formData.coreVolume);
        const weight = parseFloat(formData.dryWeight);
        const carbonPct = parseFloat(formData.organicCarbon);

        let bulkDensity = 0;
        let soilCarbonDensity = 0;

        if (volume > 0 && weight > 0) {
            bulkDensity = weight / volume;
        }

        if (bulkDensity > 0 && carbonPct >= 0) {
            // Formula: BD (g/cm3) * OC% * Depth Interval thickness (cm) * 100 (unit conversion)
            // Simplified assuming 15cm intervals for the demo UI calculating instantaneous density
            const depthThickness = formData.depthInterval.includes('15') ? 15 : 30;
            soilCarbonDensity = bulkDensity * (carbonPct / 100) * depthThickness * 100;
        }

        return {
            bulkDensity: isNaN(bulkDensity) ? 0 : bulkDensity.toFixed(3),
            soilCarbonDensity: isNaN(soilCarbonDensity) ? 0 : soilCarbonDensity.toFixed(2)
        };
    }, [formData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error: submitError } = await supabase
                .from('soil_samples')
                .insert({
                    plot_id: plotId,
                    sample_id: formData.sampleId,
                    collected_date: new Date().toISOString().split('T')[0],
                    collected_by: user?.email || 'Unknown',
                    depth_interval: formData.depthInterval,
                    core_volume_cm3: formData.coreVolume ? Number(formData.coreVolume) : null,
                    dry_weight_g: formData.dryWeight ? Number(formData.dryWeight) : null,
                    organic_carbon_percent: formData.organicCarbon ? Number(formData.organicCarbon) : null,
                    bulk_density_g_cm3: calculations.bulkDensity ? Number(calculations.bulkDensity) : null,
                    soil_carbon_density: calculations.soilCarbonDensity ? Number(calculations.soilCarbonDensity) : null,
                    analysis_status: (formData.coreVolume && formData.organicCarbon) ? 'Analysed' : 'Pending',
                    notes: formData.notes
                });

            if (submitError) throw submitError;

            // Reset form
            setFormData({
                sampleId: '',
                depthInterval: '0-15cm',
                coreVolume: '',
                dryWeight: '',
                organicCarbon: '',
                notes: ''
            });

            router.refresh();
            if (onSuccess) onSuccess();

        } catch (err: any) {
            setError(err.message || 'Failed to submit soil sample');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/50 text-rose-500 p-3 rounded-md text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Sample Barcode / ID</label>
                    <input
                        type="text"
                        name="sampleId"
                        required
                        value={formData.sampleId}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                        placeholder="e.g. CORE-A-001"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Depth Interval</label>
                    <select
                        name="depthInterval"
                        value={formData.depthInterval}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="0-15cm">0 - 15 cm</option>
                        <option value="15-30cm">15 - 30 cm</option>
                        <option value="30-50cm">30 - 50 cm</option>
                        <option value="50-100cm">50 - 100 cm</option>
                    </select>
                </div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Leaf className="w-4 h-4 text-emerald-500" />
                    <h4 className="font-medium text-emerald-400">Laboratory Measurements</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Core Volume (cm³)</label>
                        <input
                            type="number"
                            step="0.1"
                            name="coreVolume"
                            value={formData.coreVolume}
                            onChange={handleChange}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                            placeholder="e.g. 500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Dry Weight (g)</label>
                        <input
                            type="number"
                            step="0.1"
                            name="dryWeight"
                            value={formData.dryWeight}
                            onChange={handleChange}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                            placeholder="e.g. 320.5"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Organic Carbon (%)</label>
                        <input
                            type="number"
                            step="0.01"
                            name="organicCarbon"
                            value={formData.organicCarbon}
                            onChange={handleChange}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                            placeholder="e.g. 2.4"
                        />
                    </div>
                </div>

                {/* Real-time Calculation Display */}
                <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/50 p-3 rounded-md">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Info className="w-4 h-4 text-slate-500" />
                        <span>Live QA/QC Calculations:</span>
                    </div>
                    <div className="flex gap-6">
                        <div className="text-right">
                            <span className="block text-xs text-slate-500 uppercase tracking-wider">Bulk Density</span>
                            <span className="font-mono text-emerald-400 font-medium">
                                {calculations.bulkDensity} <span className="text-xs text-slate-500">g/cm³</span>
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="block text-xs text-slate-500 uppercase tracking-wider">Soil Carbon Density</span>
                            <span className="font-mono text-emerald-400 font-medium">
                                {calculations.soilCarbonDensity} <span className="text-xs text-slate-500">Mg C/ha</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Lab Notes</label>
                <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                    placeholder="Any contamination or anomalies observed..."
                ></textarea>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
                {loading ? 'Registering Sample...' : 'Log Sample & Results'}
            </button>
        </form>
    );
}
