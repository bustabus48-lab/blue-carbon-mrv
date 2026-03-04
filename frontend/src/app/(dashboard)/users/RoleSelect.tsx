"use client"

import { useState } from "react"
import { updateUserRole } from "./actions"
import { Loader2 } from "lucide-react"

export default function RoleSelect({
    userId,
    currentRole
}: {
    userId: string;
    currentRole: string;
}) {
    const [isUpdating, setIsUpdating] = useState(false)
    const [role, setRole] = useState(currentRole)

    async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const newRole = e.target.value
        setRole(newRole)
        setIsUpdating(true)

        const result = await updateUserRole(userId, newRole)

        if (!result.success) {
            // Revert on failure
            setRole(currentRole)
            alert(result.message || "Failed to update role")
        }

        setIsUpdating(false)
    }

    return (
        <div className="relative">
            <select
                title="Change User Role"
                aria-label="Change User Role"
                value={role}
                onChange={handleChange}
                disabled={isUpdating}
                className="bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none pr-8 cursor-pointer disabled:opacity-50"
            >
                <option value="crema_agent">CREMA Agent</option>
                <option value="gis_unit">GIS Unit</option>
                <option value="soil_lab">Soil Lab Tech</option>
                <option value="admin">Administrator</option>
            </select>
            {isUpdating && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                </div>
            )}
        </div>
    )
}
