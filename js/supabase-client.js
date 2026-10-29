/* Dubani Creatives — shared Supabase browser client.
   The key below is the publishable key (safe to ship in static pages).
   Never put a database password, service-role key, or user password in this file. */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm";

export const SUPABASE_URL = "https://maofytcvzlapcqegrvpp.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_V1Og_p-4bcHqcmV8m2EnAA_lwH9A29T";

/** Only this auth user may use the dashboard and apps. Public sign-up stays closed here. */
export const OWNER_ID = "651904dd-e516-42cb-934a-93603744deef";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
    },
});
