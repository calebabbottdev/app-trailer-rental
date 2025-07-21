import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_PUBLIC_KEY as string
);
