const supabase = window.CafeAppSupabase;

const COOKIE_SETTING_NAMES = [
    "cookies_banner_enabled",
    "cookies_analytics_enabled",
    "cookies_marketing_enabled",
];

export function getCookieConsentSettings(form) {
    return Object.fromEntries(
        COOKIE_SETTING_NAMES.map(name => [name, form.elements[name]?.checked === true])
    );
}

export async function requireAdmin() {
    if (!supabase) throw new Error("Supabase no está configurado.");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { window.location.replace("../login.html"); return null; }
    const { data: isAdmin, error } = await supabase.rpc("is_admin");
    if (error || isAdmin !== true) { window.location.replace("../index.html"); return null; }
    return user;
}

export async function getBusinessSettings() {
    const { data, error } = await supabase.from("business_settings").select("*").limit(1).maybeSingle();
    if (error) throw error;
    return data;
}

export async function saveBusinessSettings(payload) {
    const { data: { user } } = await supabase.auth.getUser();
    const clean = Object.fromEntries(Object.entries(payload).map(([key, value]) => {
        if (typeof value === "string") return [key, value.trim() === "" ? null : value.trim()];
        return [key, value];
    }));
    clean.updated_by = user?.id ?? null;

    const { data: existing, error: readError } = await supabase.from("business_settings").select("id").limit(1).maybeSingle();
    if (readError) throw readError;

    const result = existing?.id
        ? await supabase.from("business_settings").update(clean).eq("id", existing.id).select().single()
        : await supabase.from("business_settings").insert(clean).select().single();
    if (result.error) throw result.error;
    return result.data;
}

export async function signOutAdmin() {
    await supabase.auth.signOut();
    window.location.replace("../login.html");
}
