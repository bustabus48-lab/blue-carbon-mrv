"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { createClient as createAdminClient } from '@supabase/supabase-js'

// We need an admin client to bypass RLS and invite users
function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Missing Supabase admin environment variables.")
    }

    return createAdminClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

// Ensure the caller is actually an admin before performing sensitive actions
async function requireAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin') {
        throw new Error("Forbidden: Requires Admin privileges")
    }

    return user
}

export async function inviteUser(formData: FormData) {
    try {
        await requireAdmin()

        const email = formData.get("email") as string
        const role = formData.get("role") as string

        if (!email || !role) {
            throw new Error("Email and Role are required.")
        }

        const adminAuthClient = getAdminClient()

        // 1. Send invite email via Supabase Admin API
        const { data, error } = await adminAuthClient.auth.admin.inviteUserByEmail(email)

        if (error) throw error

        // 2. The trigger `handle_new_user` creates the profile. 
        // We just need to update the role of that newly created profile.
        // The trigger runs synchronously in Postgres so the profile will exist immediately.
        if (data.user) {
            const { error: updateError } = await adminAuthClient
                .from('profiles')
                .update({ role })
                .eq('id', data.user.id)

            if (updateError) throw updateError
        }

        revalidatePath("/users")
        return { success: true }
    } catch (err: any) {
        return { success: false, message: err.message }
    }
}

export async function updateUserRole(userId: string, newRole: string) {
    try {
        await requireAdmin()

        if (!userId || !newRole) {
            throw new Error("User ID and Role are required.")
        }

        const adminAuthClient = getAdminClient()

        const { error } = await adminAuthClient
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId)

        if (error) throw error

        revalidatePath("/users")
        return { success: true }
    } catch (err: any) {
        return { success: false, message: err.message }
    }
}
