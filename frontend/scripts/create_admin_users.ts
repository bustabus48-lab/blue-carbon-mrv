import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from the frontend folder
dotenv.config({ path: resolve(__dirname, '../../frontend/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

// Create a Supabase client with the SERVICE ROLE key to bypass RLS and access the Auth Admin API
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const defaultPassword = 'password123';

const adminUsers = [
    {
        email: 'admin@gab.com',
        password: defaultPassword,
        user_metadata: {
            role: 'admin',
            full_name: 'GAB Administrator',
            organization: 'GAB Climate Smart Ltd'
        }
    },
    {
        email: 'officer@crema.org',
        password: defaultPassword,
        user_metadata: {
            role: 'officer',
            full_name: 'CREMA Field Officer',
            organization: 'Keta CREMA'
        }
    }
];

async function createUsers() {
    console.log('Initiating Auth User Creation...');

    for (const user of adminUsers) {
        console.log(`\nAttempting to create Auth Identity for: ${user.email}`);

        // Check if the user already exists in auth.users
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

        if (listError) {
            console.error(`Error listing users: ${listError.message}`);
            continue;
        }

        const existingUser = listData.users.find(u => u.email === user.email);

        if (existingUser) {
            console.log(`- ✅ User ${user.email} already exists in Auth system. Attempting to update password to ensure consistency...`);

            const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                existingUser.id,
                { password: user.password }
            );

            if (updateError) {
                console.error(`  - ❌ Failed to update password for ${user.email}:`, updateError.message);
            } else {
                console.log(`  - ✅ Password updated successfully for ${user.email}`);
            }

        } else {
            console.log(`- 🔨 Creating new Auth Identity for ${user.email}...`);

            const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true,
                user_metadata: user.user_metadata
            });

            if (createError) {
                console.error(`  - ❌ Failed to create user ${user.email}:`, createError.message);
            } else {
                console.log(`  - ✅ User ${user.email} created successfully (ID: ${createData.user.id})`);
            }
        }
    }

    console.log('\nAuth User Creation Script Finished.');
}

createUsers().catch(console.error);
