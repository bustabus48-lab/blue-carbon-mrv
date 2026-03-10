"use client";

import { useState, useEffect } from "react";
import { UploadCloud, CheckCircle2, Loader2, X, MapPin, Calendar, Globe, Map as MapIcon, ArrowRight, ArrowLeft, AlertCircle, Layers, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

const AREA_TYPE_OPTIONS = [
    { value: "project_boundary", label: "Project Boundary (outermost perimeter)" },
    { value: "mangrove_extent", label: "Mangrove Extent Map" },
    { value: "restoration", label: "Restoration Zone" },
    { value: "conservation", label: "Conservation / Protection Zone" },
    { value: "buffer", label: "Buffer Zone" },
    { value: "hydrology", label: "Hydrology / Creek Zone" },
    { value: "reference", label: "Reference Area" },
];

const PROJECT_TYPE_OPTIONS = [
    { value: "restoration", label: "Restoration (Afforestation / Reforestation)" },
    { value: "protection", label: "Protection (Avoided Deforestation)" },
    { value: "conservation", label: "Conservation (REDD+)" },
    { value: "hydrology", label: "Hydrology Management (Creeks)" },
];

interface ProjectOption {
    id: string;
    name: string;
}

export default function ProjectWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Step 1 State — Create Project
    const [projectName, setProjectName] = useState("");
    const [region, setRegion] = useState("");
    const [district, setDistrict] = useState("");
    const [startDate, setStartDate] = useState("");
    const [selectedProjectTypes, setSelectedProjectTypes] = useState<string[]>(["restoration"]);
    const [description, setDescription] = useState("");
    const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

    // Step 2 State — Upload Layers
    const [file, setFile] = useState<File | null>(null);
    const [areaType, setAreaType] = useState("project_boundary");
    const [uploadedLayers, setUploadedLayers] = useState<{ type: string; filename: string; count: number }[]>([]);

    // Existing projects for reference
    const [existingProjects, setExistingProjects] = useState<ProjectOption[]>([]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/v1/projects/`)
            .then(res => res.json())
            .then(data => setExistingProjects(data))
            .catch(() => { });
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const toggleProjectType = (pt: string) => {
        setSelectedProjectTypes(prev =>
            prev.includes(pt) ? prev.filter(t => t !== pt) : [...prev, pt]
        );
    };

    const handleCreateProject = async () => {
        if (!projectName || !region) {
            setError("Please fill in at least the Project Name and Region.");
            return;
        }
        if (selectedProjectTypes.length === 0) {
            setError("Please select at least one project type.");
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/projects/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: projectName,
                    region,
                    district: district || null,
                    project_types: selectedProjectTypes,
                    start_date: startDate || null,
                    description: description || null,
                })
                .select('id')
                .single();

            if (error) throw new Error(error.message || "Failed to create project");

            setCreatedProjectId(data.id);
            setStep(2);
        } catch (err: any) {
            setError(err.message || "An error occurred.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleUploadLayer = async () => {
        if (!file) {
            setError("Please upload a GeoJSON file.");
            return;
        }
        if (!createdProjectId) {
            setError("No project ID found. Please go back and create a project first.");
            return;
        }

        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith(".geojson") && !fileName.endsWith(".json")) {
            setError("Only .geojson / .json files are supported for direct upload.");
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("area_type", areaType);
            formData.append("project_id", createdProjectId);

            const res = await fetch(`${API_BASE_URL}/api/v1/uploads/spatial`, {
                method: "POST",
                body: formData,
            });

            const features = geojson.features ?? [];
            if (features.length === 0) {
                throw new Error("No features found in the uploaded file");
            }

            const supabase = createClient();
            const { data, error } = await supabase.rpc('insert_project_area_geojson', {
                p_features: features,
                p_area_type: areaType,
                p_project_id: createdProjectId,
                p_filename: file.name,
            });

            if (error) throw new Error(error.message || "Upload failed");

            setUploadedLayers(prev => [
                ...prev,
                { type: areaType, filename: file.name, count: data.inserted_count },
            ]);
            setFile(null);
            setAreaType("mangrove_extent"); // Default to next likely layer
        } catch (err: any) {
            setError(err.message || "An error occurred while uploading.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFinish = () => {
        setSuccess(true);
        setStep(3);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            {/* Header / Stepper */}
            <div className="flex border-b border-slate-800 bg-slate-900/50">
                <div className={`flex-1 p-4 flex items-center justify-center border-r border-slate-800 transition-colors ${step >= 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-2 ${step >= 1 ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>1</span>
                    Create Project
                </div>
                <div className={`flex-1 p-4 flex items-center justify-center border-r border-slate-800 transition-colors ${step >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-2 ${step >= 2 ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>2</span>
                    Upload Layers
                </div>
                <div className={`flex-1 p-4 flex items-center justify-center transition-colors ${step >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-2 ${step >= 3 ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>3</span>
                    Complete
                </div>
            </div>

            <div className="p-8">
                {error && (
                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* STEP 1: CREATE PROJECT */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-1">Create New Project</h2>
                            <p className="text-sm text-slate-400 mb-6">
                                Define the metadata for a new Blue Carbon intervention. Multiple projects can exist within the same Ramsar Complex.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-300">Project Name *</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="e.g. Keta Lagoon Restoration Phase 1"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-300">Region *</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="e.g. Volta Region"
                                        value={region}
                                        onChange={(e) => setRegion(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-300">District</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Keta Municipal"
                                    value={district}
                                    onChange={(e) => setDistrict(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-300">Project Start Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Project Types Multi-Select */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-300">Project Types * (select all that apply)</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {PROJECT_TYPE_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => toggleProjectType(opt.value)}
                                        className={`flex items-center gap-3 p-3 rounded-lg border text-sm font-medium text-left transition-all ${selectedProjectTypes.includes(opt.value)
                                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                            : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedProjectTypes.includes(opt.value) ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'}`}>
                                            {selectedProjectTypes.includes(opt.value) && (
                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                            )}
                                        </div>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">Description (optional)</label>
                            <textarea
                                placeholder="Brief description of the project scope and objectives..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600 resize-none"
                            />
                        </div>

                        <div className="pt-6 flex justify-end border-t border-slate-800">
                            <button
                                onClick={handleCreateProject}
                                disabled={isUploading}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                            >
                                {isUploading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                                ) : (
                                    <><Plus className="w-4 h-4" /> Create Project & Continue</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: UPLOAD LAYERS */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-1">Upload Spatial Layers</h2>
                            <p className="text-sm text-slate-400 mb-2">
                                Upload GeoJSON files for <span className="text-emerald-400 font-medium">{projectName}</span>. Start with the Project Boundary, then the Mangrove Extent, then any zones.
                            </p>
                            <p className="text-xs text-slate-500">
                                You can upload multiple layers. Click &quot;Finish&quot; when done.
                            </p>
                        </div>

                        {/* Already Uploaded Layers */}
                        {uploadedLayers.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-emerald-500" />
                                    Uploaded Layers
                                </h3>
                                <div className="space-y-2">
                                    {uploadedLayers.map((layer, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                <span className="text-sm text-emerald-400 font-medium capitalize">{layer.type.replace('_', ' ')}</span>
                                            </div>
                                            <span className="text-xs text-slate-400">{layer.filename} ({layer.count} features)</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Area Type Selector */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">Layer Type</label>
                            <select
                                value={areaType}
                                onChange={(e) => setAreaType(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                            >
                                {AREA_TYPE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* File Upload */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-600 border-dashed rounded-xl cursor-pointer hover:bg-slate-800 hover:border-emerald-500/50 transition-all">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <MapIcon className="w-8 h-8 mb-3 text-slate-400" />
                                        <p className="mb-1 text-sm text-slate-300">
                                            <span className="font-semibold text-emerald-400">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1">GeoJSON Only</p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".geojson,.json"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>

                            {file && (
                                <div className="mt-4 flex items-center justify-between p-4 bg-slate-900 border border-slate-700 rounded-lg">
                                    <div className="flex items-center gap-3 truncate">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                        <span className="text-sm font-medium text-slate-200 truncate">{file.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0 pl-4">
                                        <span className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                        <button onClick={() => setFile(null)} className="text-slate-400 hover:text-rose-400 transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 flex justify-between border-t border-slate-800">
                            <button
                                onClick={handleFinish}
                                disabled={uploadedLayers.length === 0}
                                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                            >
                                Finish Setup
                            </button>
                            <button
                                onClick={handleUploadLayer}
                                disabled={!file || isUploading}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20"
                            >
                                {isUploading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                                ) : (
                                    <><UploadCloud className="w-4 h-4" /> Upload Layer</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: SUCCESS */}
                {step === 3 && success && (
                    <div className="text-center py-12 animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Project Initialized!</h2>
                        <p className="text-slate-400 max-w-md mx-auto mb-4">
                            <span className="text-emerald-400 font-medium">{projectName}</span> has been created with {uploadedLayers.length} spatial layer(s).
                        </p>
                        <div className="mb-8 max-w-sm mx-auto space-y-2">
                            {uploadedLayers.map((layer, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-slate-800/50 border border-slate-700 rounded-lg text-xs">
                                    <span className="text-emerald-400 capitalize">{layer.type.replace('_', ' ')}</span>
                                    <span className="text-slate-400">{layer.count} features</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => router.push('/maps')}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20"
                            >
                                View on Map
                            </button>
                            <button
                                onClick={() => {
                                    setStep(1);
                                    setFile(null);
                                    setProjectName("");
                                    setRegion("");
                                    setDistrict("");
                                    setStartDate("");
                                    setDescription("");
                                    setSelectedProjectTypes(["restoration"]);
                                    setCreatedProjectId(null);
                                    setUploadedLayers([]);
                                    setSuccess(false);
                                    setError(null);
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                            >
                                Setup Another Project
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
