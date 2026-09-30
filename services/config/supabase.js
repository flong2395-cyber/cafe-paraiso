/*
 * Supabase configuration for the browser.
 *
 * Installation-specific values are generated in runtime-config.js.
 * NEVER place the Supabase service_role key in frontend code.
 */

const runtimeConfig = window.CafeAppRuntimeConfig || {};
const SUPABASE_URL = String(runtimeConfig.supabaseUrl || "").trim();
const SUPABASE_PUBLISHABLE_KEY = String(runtimeConfig.supabasePublishableKey || "").trim();
const APP_URL = String(runtimeConfig.appUrl || "").trim().replace(/\/$/, "");

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !APP_URL) {
    console.warn(
        "[Supabase] Configuración incompleta. Ejecuta npm run supabase:start o npm run configure."
    );
}

const supabaseClient =
    SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
        ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
              auth: {
                  persistSession: true,
                  autoRefreshToken: true,
                  detectSessionInUrl: true,
              },
          })
        : null;

window.CafeAppConfig = Object.freeze({
    supabaseUrl: SUPABASE_URL,
    appUrl: APP_URL,
});
window.CafeAppSupabase = supabaseClient;
window.__cafeSupabaseConfigLoaded = true;
