"use client";

import { useState, useEffect } from "react";
import { UploadCloud, CheckCircle2, Loader2, X } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

const AREA_TYPE_OPTIONS = [
    { value: "project_boundary", label: "Project Boundary" },
    { value: "mangrove_extent", label: "Mangrove Extent Map" },
    { value: "restoration", label: "Restoration Zone" },
    { value: "conservation", label: "Conservation" },
    { value: "protection", label: "Protection" },
    { value: "buffer", label: "Buffer Zone" },
    { value: "hydrology", label: "Hydrology / Creek" },
    { value: "reference", label: "Reference Area" },
];

interface ProjectOption {
    id: string;
    name: string;
}

type UploadResult = {
    message: string;
    ingestion_job_id?: string;
    feature_count?: number;
    inserted_count?: number;
    skipped_count?: number;
};

export default function PolygonUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [areaType, setAreaType] = useState("restoration");
    const [coastalAreaName, setCoastalAreaName] = useState("");
    const [districtName, setDistrictName] = useState("");
    const [projectId, setProjectId] = useState("");
    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/v1/projects/`)
            .then(res => res.json())
            .then(data => {
                setProjects(data);
                if (data.length > 0) setProjectId(data[0].id);
            })
            .catch(() => { });
    }, []);

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
        if (!projectId) {
            setError("Please select a project to attach this layer to.");
            return;
        }

        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith(".geojson") && !fileName.endsWith(".json")) {
            setError("Only .geojson / .json files are supported for direct upload.");
            return;
        }

        setIsUploading(true);
        setError(null);
        setUploadResult(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("area_type", areaType);
        formData.append("project_id", projectId);
        if (coastalAreaName.trim()) {
            formData.append("coastal_area_name", coastalAreaName.trim());
        }
        if (districtName.trim()) {
            formData.append("district_name", districtName.trim());
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/uploads/spatial`, {
                method: "POST",
                body: formData,
            });

            const features = geojson.features ?? [];
            if (features.length === 0) {
                throw new Error("No features found in the uploaded file");
            }

            const supabase = createClient();
            const { data, error: rpcError } = await supabase.rpc('insert_project_area_geojson', {
                p_features: features,
                p_area_type: areaType,
                p_project_id: projectId,
                p_filename: file.name,
            });

            if (rpcError) throw new Error(rpcError.message || "Upload failed");

            setUploadResult({
                message: data.message,
                ingestion_job_id: data.ingestion_job_id,
                feature_count: data.feature_count,
                inserted_count: data.inserted_count,
                skipped_count: data.skipped_count,
            });
            setFile(null);
        } catch (err: unknown) {
            console.error("Upload error:", err);
            if (err instanceof Error) {
                setError(err.message || "An unexpected error occurred during upload.");
            } else {
                setError("An unexpected error occurred during upload.");
            }
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
                Upload a GeoJSON, KML, or TIFF layer and assign it to a project.
            </p>

            <div className="space-y-4">
                {/* Project Selector */}
                <div>
                    <label className="block text-sm text-slate-300 mb-2">Project</label>
                    <select
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    >
                        {projects.length === 0 && (
                            <option value="">No projects found — create one first</option>
                        )}
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {/* Area Type */}
                <div>
                    <label className="block text-sm text-slate-300 mb-2">Layer Type</label>
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

                {/* Coastal Area Name */}
                <div>
                    <label className="block text-sm text-slate-300 mb-2">Coastal Area Name <span className="text-slate-500">(optional)</span></label>
                    <input
                        value={coastalAreaName}
                        onChange={(e) => setCoastalAreaName(e.target.value)}
                        placeholder="e.g. Keta Lagoon Complex"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                </div>

                {/* District */}
                <div>
                    <label className="block text-sm text-slate-300 mb-2">District <span className="text-slate-500">(optional)</span></label>
                    <input
                        value={districtName}
                        onChange={(e) => setDistrictName(e.target.value)}
                        placeholder="e.g. Keta Municipal"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                </div>

                <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-800/50 hover:bg-slate-800 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-8 h-8 mb-3 text-slate-400" />
                            <p className="mb-2 text-sm text-slate-400">
                                <span className="font-semibold text-emerald-500">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-slate-500">GeoJSON only (MAX. 50MB)</p>
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
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                                {uploadResult.message} ({uploadResult.inserted_count}/{uploadResult.feature_count} inserted, {uploadResult.skipped_count} skipped)
                            </span>
                        </div>
                        {uploadResult.ingestion_job_id && (
                            <span className="text-xs text-emerald-300/80">Ingestion Job ID: {uploadResult.ingestion_job_id}</span>
                        )}
                    </div>
                )}

                <div className="flex justify-end pt-2">
                    <button
                        onClick={handleUpload}
                        disabled={!file || isUploading || !projectId}
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

