import { createClient } from '@supabase/supabase-js';

// Use environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xrruljrhjftcfxllaesa.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycnVsanJoamZ0Y2Z4bGxhZXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NzMzOTIsImV4cCI6MjA3NzI0OTM5Mn0.a0ZEzfor8WQrhXC6gq5OYLAlGGU6pvd0mkx4VX6Qoe8';

// Singleton pattern to prevent multiple instances
let supabaseInstance = null;

const createSupabaseClient = () => {
  if (!supabaseInstance) {
    console.log('🚀 Creating Supabase client instance...');
    
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // Set to false if not using OAuth
        storageKey: 'sb-auth-token', // Explicit storage key
      },
      global: {
        headers: {
          'x-application-name': 'pharmacare-cdss'
        }
      }
    });
    
    console.log('✅ Supabase client created successfully!');
  }
  
  return supabaseInstance;
};

// Create and export a single instance
const supabase = createSupabaseClient();

export default supabase;