const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing env vars!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixProfiles() {
    console.log("Fetching users...");
    // 1. Get auth users
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error("Error fetching users:", error);
        return;
    }

    for (const user of users) {
        // Ensure profile exists
        const { data: existingProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

        const role = user.email === 'admin@gab.com' ? 'admin' : 'crema_agent';

        if (!existingProfile) {
            console.log(`Creating profile for ${user.email} with role ${role}`);
            await supabase.from('profiles').insert({ id: user.id, role: role });
        } else {
            console.log(`Updating profile for ${user.email} to role ${role}`);
            await supabase.from('profiles').update({ role: role }).eq('id', user.id);
        }
    }
    console.log("Done.");
}

fixProfiles();
