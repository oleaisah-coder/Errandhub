/**
 * seedSupabaseUsers.js
 * ─────────────────────────────────────────────────────────────
 * Creates the three demo accounts in Supabase Auth and upserts
 * their profiles into the `users` table.
 *
 * Run: node scripts/seedSupabaseUsers.js
 * ─────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL  = process.env.SUPABASE_URL  || 'https://zjystdpxlobcdukjxcii.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_WCWhvsqUjiW2trWe6MBdGg_PRbhQzRi';

// ── Accounts to seed ────────────────────────────────────────
const DEMO_USERS = [
  {
    email:     'user@errandhub.com',
    password:  'user123',
    firstName: 'John',
    lastName:  'Doe',
    phone:     '+2348022222222',
    role:      'user',
    address:   '45 Residential Ave',
    city:      'Lagos',
    state:     'Lagos',
  },
  {
    email:     'runner@errandhub.com',
    password:  'runner123',
    firstName: 'Alice',
    lastName:  'Smith',
    phone:     '+2348033333333',
    role:      'runner',
    address:   '78 Runner Street',
    city:      'Lagos',
    state:     'Lagos',
  },
  {
    email:     'oleaisah@gmail.com',
    password:  'Theophilus',
    firstName: 'Admin',
    lastName:  'Isah',
    phone:     '+2348011111111',
    role:      'admin',
    address:   '123 Admin Street',
    city:      'Lagos',
    state:     'Lagos',
  },
];

async function seedUser(supabase, userData) {
  const { email, password, firstName, lastName, phone, role, address, city, state } = userData;

  console.log(`\n🔄  Processing: ${email} (${role})`);

  // ── Step 1: Sign up in Supabase Auth ─────────────────────
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { firstName, lastName, phone, role },
    },
  });

  let userId = signUpData?.user?.id;

  if (signUpError) {
    // "User already registered" means the Auth account exists
    if (signUpError.message.toLowerCase().includes('already registered') ||
        signUpError.message.toLowerCase().includes('already exists') ||
        signUpError.status === 422) {
      console.log(`  ⚠️  Auth account already exists for ${email}`);

      // Try signing in to get the user's id
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        console.error(`  ✗  Could not sign in (wrong password?): ${signInError.message}`);
        console.log(`  ℹ️  The password stored in Supabase differs from '${password}'.`);
        console.log(`     Please reset it manually in the Supabase Dashboard → Authentication → Users.`);
        return false;
      }

      userId = signInData.user?.id;
      console.log(`  ✓  Signed in successfully. User ID: ${userId}`);

      // Sign back out so we don't stay logged in as this user
      await supabase.auth.signOut();
    } else {
      console.error(`  ✗  signUp failed: ${signUpError.message}`);
      return false;
    }
  } else if (signUpData?.user) {
    console.log(`  ✓  Auth account created. User ID: ${userId}`);

    if (signUpData.session) {
      console.log(`  ✓  Session granted immediately (email confirmation disabled).`);
      await supabase.auth.signOut();
    } else {
      console.log(`  ⚠️  No session returned — email confirmation may be required.`);
      console.log(`     Go to Supabase Dashboard → Authentication → Providers → Email`);
      console.log(`     and disable "Confirm email" to allow instant sign-ins.`);
    }
  } else {
    console.error(`  ✗  Unexpected response — no user or error returned.`);
    return false;
  }

  if (!userId) {
    console.error(`  ✗  Could not determine user ID, skipping profile upsert.`);
    return false;
  }

  // ── Step 2: Sync profile in the `users` table ────────────
  // The table may already contain a row from the old PostgreSQL seed seeded with
  // a different UUID. We match on email and update the id (and all fields) so
  // the Supabase Auth UUID is the authoritative id going forward.
  const passwordHash = await bcrypt.hash(password, 12);

  // First try to UPDATE an existing row matched by email
  const { data: updateData, error: updateError } = await supabase
    .from('users')
    .update({
      id:            userId,          // align to Supabase Auth UUID
      first_name:    firstName,
      last_name:     lastName,
      phone,
      role,
      address,
      city,
      state,
      is_active:     true,
      password_hash: passwordHash,
    })
    .eq('email', email)
    .select('id');

  if (updateError) {
    // If update fails (e.g. id FK conflict), fall back to delete+insert
    console.log(`  ⚠️  Update failed (${updateError.message}), trying delete + insert...`);
    await supabase.from('users').delete().eq('email', email);

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id:            userId,
        email,
        first_name:    firstName,
        last_name:     lastName,
        phone,
        role,
        address,
        city,
        state,
        is_active:     true,
        password_hash: passwordHash,
      });

    if (insertError) {
      console.error(`  ✗  Profile insert failed: ${insertError.message}`);
      return false;
    }
    console.log(`  ✓  Profile deleted + re-inserted (id aligned to Supabase Auth UUID).`);
  } else if (!updateData || updateData.length === 0) {
    // No row existed — insert fresh
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id:            userId,
        email,
        first_name:    firstName,
        last_name:     lastName,
        phone,
        role,
        address,
        city,
        state,
        is_active:     true,
        password_hash: passwordHash,
      });

    if (insertError) {
      console.error(`  ✗  Profile insert failed: ${insertError.message}`);
      return false;
    }
    console.log(`  ✓  Profile inserted into users table.`);
  } else {
    console.log(`  ✓  Profile updated in users table (id aligned to Supabase Auth UUID).`);
  }

  return true;
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  ErrandHub — Supabase Demo User Seeder');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Supabase URL : ${SUPABASE_URL}`);
  console.log('');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      persistSession: false,   // script context — no browser storage
      autoRefreshToken: false,
    },
  });

  let ok = 0;
  let fail = 0;

  for (const user of DEMO_USERS) {
    const success = await seedUser(supabase, user);
    success ? ok++ : fail++;
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  Done  ✅ ${ok} succeeded  ❌ ${fail} failed`);
  console.log('');
  console.log('  Demo credentials:');
  console.log('  ┌─────────────────────────────────── ─────────────┐');
  console.log('  │ Role    │ Email                  │ Password      │');
  console.log('  ├─────────┼────────────────────────┼───────────────┤');
  console.log('  │ User    │ user@errandhub.com     │ user123       │');
  console.log('  │ Runner  │ runner@errandhub.com   │ runner123     │');
  console.log('  │ Admin   │ oleaisah@gmail.com     │ Theophilus    │');
  console.log('  └─────────┴────────────────────────┴───────────────┘');
  console.log('═══════════════════════════════════════════════════\n');

  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
