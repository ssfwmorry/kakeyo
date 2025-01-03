import { createClient } from '@supabase/supabase-js';
const config = useRuntimeConfig();

const supabase = createClient(config.public.supabaseUrl, config.public.supabaseAnonKey, {
  db: { schema: config.public.supabaseSchema },
});

export default supabase;
