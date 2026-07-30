import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nfontltqqygjllytkcnh.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_fn6PgbsK7QW2_5NWt1f6Gg_uNeckBmP';

export const supabase = createClient(supabaseUrl, supabaseKey);
