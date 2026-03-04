"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { uploadEvidencePhoto } from "@/utils/supabase/storage";
import { UploadCloud, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UploadEvidence({ alertId }: { alertId: string }) {
    const [file, setFile] = useState<File | null>(null);
    const [notes, setNotes] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError("Please select a photo.");
            return;
        }

        setIsUploading(true);
        setError(null);
        setSuccess(false);

        try {
            // 1. Upload photo to bucket
            const { url, error: uploadErr } = await uploadEvidencePhoto(file);

            if (uploadErr || !url) {
                throw new Error("Failed to upload photo to storage.");
            }

            // 2. Fetch authenticated user id
            const { data: { user } } = await supabase.auth.getUser();

            // 3. Save to alert_evidence table
            const { error: dbErr } = await supabase
                .from("alert_evidence")
                .insert({
                    alert_id: alertId,
                    uploaded_by: user?.id,
                    photo_url: url,
                    notes: notes
                });

            if (dbErr) {
                throw new Error("Failed to save evidence record.");
            }

            setSuccess(true);
            setFile(null);
            setNotes("");

            // Refresh server components to show the new evidence
            router.refresh();

        } catch (err: any) {
            setError(err.message || "An unknown error occurred.");
        } finally {
            setIsUploading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-emerald-900/20 border border-emerald-800 rounded-xl p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-semibold text-emerald-400">Evidence Uploaded</h3>
                <p className="text-sm text-emerald-500/80 mb-4">The field data has been saved to the alert record.</p>
                <button
                    onClick={() => setSuccess(false)}
                    className="text-sm bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    Upload Another
                </button>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-medium text-white mb-4">Upload Field Verification</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/50 rounded-lg text-rose-400 text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Photo Evidence</label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-800 hover:bg-slate-700 transition-colors ${file ? 'border-emerald-500/50' : 'border-slate-700'}`}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-2 text-slate-500" />
                                {file ? (
                                    <p className="text-sm text-emerald-400 font-medium">{file.name}</p>
                                ) : (
                                    <>
                                        <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-slate-300">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-slate-500">PNG, JPG or JPEG (MAX. 5MB)</p>
                                    </>
                                )}
                            </div>
                            <input
                                id="dropzone-file"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                capture="environment" // Hints mobile devices to open camera directly
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Field Notes (Optional)</label>
                    <textarea
                        rows={3}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                        placeholder="Describe observations, weather conditions, or local interactions..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isUploading || !file}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                    >
                        {isUploading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                        ) : (
                            "Submit Verification"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
