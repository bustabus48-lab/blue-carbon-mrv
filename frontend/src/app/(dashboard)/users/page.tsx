import { createClient } from "@/utils/supabase/server"
import { Shield, ShieldAlert, Mail, Clock, ShieldCheck } from "lucide-react"
import InviteUserModal from "./InviteUserModal"
import RoleSelect from "./RoleSelect"
import { format } from "date-fns"

export default async function UsersPage() {
    const supabase = await createClient()

    // 1. Verify caller is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return <div className="p-8 text-red-500">Authentication required</div>
    }

    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!currentUserProfile || currentUserProfile.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[70vh]">
                <div className="w-16 h-16 bg-red-900/20 text-red-500 flex items-center justify-center rounded-full mb-6">
                    <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-100 mb-2">Access Denied</h2>
                <p className="text-slate-400 max-w-md">
                    You do not have the required administrative privileges to view or manage users in the National MRV Platform.
                </p>
            </div>
        )
    }

    // 2. Fetch all profiles
    const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (fetchError) {
        return <div className="p-8 text-red-500">Failed to load users: {fetchError.message}</div>
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
                        <Shield className="w-8 h-8 text-blue-400" />
                        User Administration
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Manage platform access, invite new personnel, and configure role-based permissions.
                    </p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                    <InviteUserModal />
                </div>
            </div>

            <div className="bg-[#1f2937] border border-slate-700/50 rounded-xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#111827]/50 border-b border-slate-700/50">
                                <th className="p-4 text-sm font-semibold text-slate-300">Personnel / Email</th>
                                <th className="p-4 text-sm font-semibold text-slate-300">Registered</th>
                                <th className="p-4 text-sm font-semibold text-slate-300">Role & Access Level</th>
                                <th className="p-4 text-sm font-semibold text-slate-300 text-right">Identifier</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50 text-slate-300">
                            {profiles?.map((profile: any) => (
                                <tr key={profile.id} className="hover:bg-[#374151]/20 transition-colors">
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 flex items-center justify-center bg-slate-800 text-slate-400 rounded-full shrink-0 border border-slate-700/50">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <div className="font-medium text-slate-200">
                                                {profile.email || "No Email"}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-4 align-middle text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-slate-500" />
                                            {format(new Date(profile.created_at), "MMM d, yyyy")}
                                        </div>
                                    </td>

                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-3">
                                            <RoleSelect userId={profile.id} currentRole={profile.role} />

                                            {profile.role === 'admin' && (
                                                <span title="Full Administrative Privileges">
                                                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="p-4 align-middle text-right">
                                        <code className="text-[11px] text-slate-500 px-2 py-1 bg-slate-800 rounded">
                                            {profile.id.split('-')[0]}...
                                        </code>
                                    </td>
                                </tr>
                            ))}

                            {(!profiles || profiles.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">
                                        No users registered in the system.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
