// seed_users.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.API_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing env vars!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
    console.log("Seeding users...");

    // 1. Create Admin
    const { data: admin, error: adminErr } = await supabase.auth.admin.createUser({
        email: 'admin@gab.com',
        password: 'password123',
        email_confirm: true
    });
    if (adminErr) console.error("Admin err:", adminErr.message);
    else {
        console.log("Admin created:", admin.user.id);
        // set role in profile
        await supabase.from('profiles').update({ role: 'admin' }).eq('id', admin.user.id);
    }

    // 2. Create Agent
    const { data: agent, error: agentErr } = await supabase.auth.admin.createUser({
        email: 'agent@gab.com',
        password: 'password123',
        email_confirm: true
    });
    if (agentErr) console.error("Agent err:", agentErr.message);
    else console.log("Agent created:", agent.user.id);

    console.log("Seeding complete.");
}

seed();
