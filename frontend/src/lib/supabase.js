
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("Missing Supabase Env Vars in Frontend!");
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
