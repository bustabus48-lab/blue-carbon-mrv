"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle2, Loader2, X } from "lucide-react";

const AREA_TYPE_OPTIONS = [
    { value: "restoration", label: "Restoration" },
    { value: "conservation", label: "Conservation" },
    { value: "protection", label: "Protection" },
    { value: "buffer", label: "Buffer Zone" },
    { value: "reference", label: "Reference Area" },
];

export default function PolygonUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [areaType, setAreaType] = useState("restoration");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<{
        message: string;
        feature_count?: number;
        inserted_count?: number;
        skipped_count?: number;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setError(null);
            setUploadResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file first.");
            return;
        }

        if (!file.name.endsWith(".geojson") && !file.name.endsWith(".json")) {
            setError("Only .geojson files are supported.");
            return;
        }

        setIsUploading(true);
        setError(null);
        setUploadResult(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("area_type", areaType);

        try {
            const res = await fetch("http://127.0.0.1:8000/api/v1/uploads/spatial", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || "Upload failed");
            }

            const data = await res.json();
            setUploadResult({
                message: data.message,
                feature_count: data.feature_count,
                inserted_count: data.inserted_count,
                skipped_count: data.skipped_count,
            });
            setFile(null);
        } catch (err: any) {
            console.error("Upload error:", err);
            setError(err.message || "An unexpected error occurred during upload.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <UploadCloud className="text-emerald-500 w-5 h-5" />
                Upload Spatial Data
            </h3>

            <p className="text-sm text-slate-400 mb-6">
                Upload polygon GeoJSON and assign the area type for restoration, conservation, protection, buffer, or reference mapping.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-slate-300 mb-2">Area Type</label>
                    <select
                        value={areaType}
                        onChange={(e) => setAreaType(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    >
                        {AREA_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-800/50 hover:bg-slate-800 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-8 h-8 mb-3 text-slate-400" />
                            <p className="mb-2 text-sm text-slate-400">
                                <span className="font-semibold text-emerald-500">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-slate-500">GeoJSON or JSON (MAX. 50MB)</p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept=".geojson,.json,application/geo+json,application/json"
                            onChange={handleFileChange}
                        />
                    </label>
                </div>

                {file && (
                    <div className="flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded-lg">
                        <span className="text-sm font-medium text-slate-300 truncate">{file.name}</span>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            <button onClick={() => setFile(null)} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {error && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-sm text-rose-400">{error}</div>}

                {uploadResult && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                            {uploadResult.message} ({uploadResult.inserted_count}/{uploadResult.feature_count} inserted, {uploadResult.skipped_count} skipped)
                        </span>
                    </div>
                )}

                <div className="flex justify-end pt-2">
                    <button
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        {isUploading ? "Uploading..." : "Upload Polygon"}
                    </button>
                </div>
            </div>
        </div>
    );
}
