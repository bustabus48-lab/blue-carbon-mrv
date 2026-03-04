"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { X, CheckCircle2, MessageSquare } from "lucide-react";

export default function GrievanceModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error("Authentication Error", authError);
            alert("You must be logged in to report a grievance.");
            setIsSubmitting(false);
            return;
        }

        const data = {
            date_reported: formData.get("date_reported"),
            community_name: formData.get("community_name"),
            category: formData.get("category"),
            description: formData.get("description"),
            reported_by_phone: formData.get("reported_by_phone"),
            status: 'Open',
            logged_by: user.email
        };

        const { error } = await supabase.from('grievances').insert([data]);

        if (!error) {
            setSuccess(true);
            setTimeout(() => {
                setIsOpen(false);
                setSuccess(false);
                router.refresh();
            }, 1500);
        } else {
            console.error("Failed to log grievance", error);
            alert("Error logging grievance ticket.");
        }
        setIsSubmitting(false);
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="bg-rose-600/20 border-rose-500/30 border hover:bg-rose-600/30 text-rose-300 font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
                <MessageSquare className="w-4 h-4" />
                Log Grievance
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-rose-400" />
                        Log Community Grievance
                    </h2>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto">
                    {success ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
                            <h3 className="text-xl font-bold text-white">Grievance Logged!</h3>
                            <p className="text-slate-400 mt-2">The ticket has been opened for investigation.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Date Reported</label>
                                    <input
                                        type="date"
                                        name="date_reported"
                                        required
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Community Name</label>
                                    <input
                                        type="text"
                                        name="community_name"
                                        required
                                        placeholder="e.g. Fuveme"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                                    <select
                                        name="category"
                                        required
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    >
                                        <option value="Land Dispute">Land Dispute</option>
                                        <option value="Benefit-Sharing">Benefit-Sharing</option>
                                        <option value="Employment">Employment</option>
                                        <option value="Access Restriction">Access Restriction</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Contact Phone (Optional)</label>
                                    <input
                                        type="text"
                                        name="reported_by_phone"
                                        placeholder="+233..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Grievance Description</label>
                                <textarea
                                    name="description"
                                    required
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 h-24 resize-none"
                                    placeholder="Detail the nature of the complaint..."
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 rounded-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 rounded-lg font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? "Logging..." : "Submit Grievance"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
