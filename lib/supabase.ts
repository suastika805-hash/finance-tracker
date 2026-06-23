import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client untuk browser / auth (pakai anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client untuk API routes server-side (pakai service role key, bypass RLS)
const rawServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const hasPlaceholder = rawServiceRoleKey === 'ISI_DENGAN_SERVICE_ROLE_KEY_DARI_SUPABASE_DASHBOARD'

if (hasPlaceholder) {
  console.warn('⚠️ Warning: SUPABASE_SERVICE_ROLE_KEY is using a placeholder value. Please set a valid service_role key in .env.local.')
}

const serviceRoleKey = rawServiceRoleKey && !hasPlaceholder ? rawServiceRoleKey : supabaseAnonKey
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
