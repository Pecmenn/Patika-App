import { createClient } from '@supabase/supabase-js';

// Tarayıcıda oturum, tarayıcının kendi depolamasında durur.
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);
