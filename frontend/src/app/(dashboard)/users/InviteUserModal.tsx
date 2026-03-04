"use client"

import { useState } from "react"
import { inviteUser } from "./actions"
import { Plus, X, Loader2, CheckCircle2 } from "lucide-react"

export default function InviteUserModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" })

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsSubmitting(true)
        setStatus({ type: null, message: "" })

        const formData = new FormData(e.currentTarget)
        const result = await inviteUser(formData)

        if (result.success) {
            setStatus({ type: "success", message: "Invitation sent successfully!" })
            setTimeout(() => {
                setIsOpen(false)
                setStatus({ type: null, message: "" })
            }, 2000)
        } else {
            setStatus({ type: "error", message: result.message || "Failed to invite user." })
        }

        setIsSubmitting(false)
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
                <Plus className="w-4 h-4" />
                <span>Invite User</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1f2937] border border-slate-700/50 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-[#1f2937] border-b border-slate-700/50">
                            <h3 className="text-lg font-medium text-slate-100">Invite New User</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {status.type === "error" && (
                                <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg">
                                    {status.message}
                                </div>
                            )}

                            {status.type === "success" && (
                                <div className="p-3 text-sm text-emerald-400 bg-emerald-900/20 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    {status.message}
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    className="w-full bg-[#374151]/50 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    placeholder="agent@gab.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-1.5">
                                    Role Assignment
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    required
                                    className="w-full bg-[#374151]/50 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all cursor-pointer"
                                >
                                    <option value="crema_agent">CREMA Agent (Field Data & Alerts)</option>
                                    <option value="gis_unit">GIS Unit</option>
                                    <option value="soil_lab">Soil Lab Technician</option>
                                    <option value="admin">Administrator (Full Access)</option>
                                </select>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || status.type === "success"}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        "Send Invite"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
