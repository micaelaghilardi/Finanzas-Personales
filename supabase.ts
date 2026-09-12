import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "Faltan las variables VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY (revisá el archivo .env).",
  );
}

export const supabase = createClient(url, key);
