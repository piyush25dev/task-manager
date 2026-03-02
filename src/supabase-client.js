import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials!");
  console.error("VITE_SUPABASE_URL:", supabaseUrl ? "✓ Set" : "✗ Missing");
  console.error("VITE_SUPABASE_ANON_KEY:", supabaseKey ? "✓ Set" : "✗ Missing");
  console.error("Make sure your .env file is configured correctly");
} else {
  console.log("✓ Supabase URL:", supabaseUrl);
  console.log("✓ Supabase API Key configured");
}

export const supabase = createClient(supabaseUrl, supabaseKey);