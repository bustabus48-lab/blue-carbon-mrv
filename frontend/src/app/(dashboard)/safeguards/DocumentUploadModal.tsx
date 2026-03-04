"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { X, CheckCircle2, UploadCloud, FileText } from "lucide-react";

export default function DocumentUploadModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const file = formData.get("file") as File;
        const documentType = formData.get("document_type") as string;
        const communityName = formData.get("community_name") as string;
        const notes = formData.get("notes") as string;

        if (!file || file.size === 0) {
            alert("Please select a file to upload.");
            setIsSubmitting(false);
            return;
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            alert("You must be logged in to upload documents.");
            setIsSubmitting(false);
            return;
        }

        try {
            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${communityName.replace(/\s+/g, '_')}_${documentType.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;
            const filePath = `fpic/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('safeguard_documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('safeguard_documents')
                .getPublicUrl(filePath);

            // 2. Insert Metadata into Database
            const { error: dbError } = await supabase.from('safeguard_documents').insert([{
                document_type: documentType,
                community_name: communityName,
                file_url: publicUrl,
                verification_status: 'Pending',
                notes: notes,
                uploaded_by: user.email
            }]);

            if (dbError) throw dbError;

            setSuccess(true);
            setTimeout(() => {
                setIsOpen(false);
                setSuccess(false);
                router.refresh();
            }, 1500);

        } catch (error: any) {
            console.error("Upload failed:", error);
            alert(`Failed to upload document: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="bg-indigo-600/20 border-indigo-500/30 border hover:bg-indigo-600/30 text-indigo-300 font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
                <UploadCloud className="w-4 h-4" />
                Upload Document
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-400" />
                        Upload Compliance Document
                    </h2>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto">
                    {success ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
                            <h3 className="text-xl font-bold text-white">Upload Successful!</h3>
                            <p className="text-slate-400 mt-2">The document is now pending verification.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Community / Stakeholder Group</label>
                                <input
                                    type="text"
                                    name="community_name"
                                    required
                                    placeholder="e.g. Anyanui Chiefdom"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Document Category</label>
                                <select
                                    name="document_type"
                                    required
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="FPIC">Free Prior Informed Consent (FPIC)</option>
                                    <option value="Benefit-Sharing Agreement">Benefit-Sharing Agreement</option>
                                    <option value="Governance Composition">Governance Composition Record</option>
                                    <option value="Social Impact Assessment">Social Impact Assessment</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">File Attachment</label>
                                <input
                                    type="file"
                                    name="file"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    required
                                    className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                                />
                                <p className="text-xs text-slate-400 mt-2">Max 10MB. Accepted formats: PDF, DOCX, Images.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Upload Notes (Optional)</label>
                                <textarea
                                    name="notes"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                                    placeholder="Add context about signatories..."
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 mt-2 rounded-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 mt-2 rounded-lg font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting ? "Uploading..." : (
                                        <>
                                            <UploadCloud className="w-4 h-4" />
                                            Upload File
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
