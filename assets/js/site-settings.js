// Café Paraíso — configuración pública del sitio.
// Lee la configuración publicada por el administrador desde Supabase.
(function () {
    "use strict";

    const DEFAULTS = {
        business_name: "Café Paraíso",
        description: "",
        address: "",
        phone: "",
        email: "",
        opening_hours: "",
        social_instagram: "",
        social_facebook: "",
        social_tiktok: "",
        social_linkedin: "",
        legal_company_name: "",
        legal_tax_id: "",
        legal_email: "",
        legal_address: "",
        legal_notice: "",
        privacy_policy: "",
        cookie_policy: "",
        purchase_terms: "",
        shipping_policy: "",
        returns_policy: "",
        cookies_banner_enabled: false,
        cookies_analytics_enabled: false,
        cookies_marketing_enabled: false,
    };

    let cache = null;
    let promise = null;

    async function ensureSupabase() {
        if (window.CafeAppSupabase) return window.CafeAppSupabase;

        if (!window.supabase) {
            await new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2";
                script.integrity = "sha384-WgXwGL6fUsYJWNaKJgVbrJKGRQwc1vieh2oy4kw9nXqpNDz3tdSsqEYUgeHD/NuF";
                script.crossOrigin = "anonymous";
                script.onload = resolve;
                script.onerror = () => reject(new Error("No se pudo cargar Supabase."));
                document.head.appendChild(script);
            });
        }

        if (!window.CafeAppRuntimeConfig) {
            await new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = "services/config/runtime-config.js";
                script.onload = resolve;
                script.onerror = () => reject(new Error("No se pudo cargar la configuración local de la instalación."));
                document.head.appendChild(script);
            });
        }

        if (!window.__cafeSupabaseConfigLoaded) {
            await new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = "services/config/supabase.js";
                script.onload = resolve;
                script.onerror = () => reject(new Error("No se pudo cargar la configuración de Supabase."));
                document.head.appendChild(script);
            });
            window.__cafeSupabaseConfigLoaded = true;
        }

        return window.CafeAppSupabase;
    }

    async function getSettings(force = false) {
        if (cache && !force) return cache;
        if (promise && !force) return promise;

        promise = (async () => {
            try {
                const supabase = await ensureSupabase();
                if (!supabase) return { ...DEFAULTS };
                const { data, error } = await supabase
                    .from("business_settings")
                    .select("*")
                    .limit(1)
                    .maybeSingle();
                if (error) throw error;
                cache = { ...DEFAULTS, ...(data || {}) };
                return cache;
            } catch (error) {
                console.warn("[Café Paraíso] No se pudo cargar la configuración pública.", error);
                cache = { ...DEFAULTS };
                return cache;
            } finally {
                promise = null;
            }
        })();
        return promise;
    }

    function setText(selector, value, { hideWhenEmpty = false } = {}) {
        document.querySelectorAll(selector).forEach((el) => {
            const text = String(value ?? "").trim();
            if (hideWhenEmpty && !text) {
                el.hidden = true;
                return;
            }
            el.hidden = false;
            el.textContent = text;
        });
    }

    function setLink(selector, value) {
        document.querySelectorAll(selector).forEach((el) => {
            const url = String(value ?? "").trim();
            if (!url) {
                el.hidden = true;
                el.removeAttribute("href");
                return;
            }
            el.hidden = false;
            el.href = url;
        });
    }

    function applyFooter(settings) {
        setText("[data-setting='business_name']", settings.business_name);
        setText("[data-setting='description']", settings.description, { hideWhenEmpty: true });
        setText("[data-setting='address']", settings.address, { hideWhenEmpty: true });
        setText("[data-setting='phone']", settings.phone, { hideWhenEmpty: true });
        setText("[data-setting='email']", settings.email, { hideWhenEmpty: true });
        setText("[data-setting='year']", new Date().getFullYear());

        setLink("[data-social='instagram']", settings.social_instagram);
        setLink("[data-social='facebook']", settings.social_facebook);
        setLink("[data-social='tiktok']", settings.social_tiktok);
        setLink("[data-social='linkedin']", settings.social_linkedin);

        const optionalGroups = document.querySelectorAll("[data-setting-group]");
        optionalGroups.forEach(group => {
            const hasVisible = [...group.querySelectorAll("[data-setting]")].some(el => !el.hidden && el.textContent.trim());
            group.hidden = !hasVisible;
        });
    }

    function ensureCookieBanner(settings) {
        if (!settings.cookies_banner_enabled) return;
        const key = "cafeelcaracol_cookie_consent_v1";
        if (localStorage.getItem(key)) return;

        const existing = document.getElementById("cafe-cookie-banner");
        if (existing) return;

        const banner = document.createElement("aside");
        banner.id = "cafe-cookie-banner";
        banner.className = "cafe-cookie-banner";
        banner.setAttribute("aria-label", "Preferencias de cookies");
        banner.innerHTML = `
            <div class="cafe-cookie-banner__text">
                <strong>Cookies</strong>
                <p>Utilizamos cookies necesarias para el funcionamiento de la web y, si se activan, cookies opcionales para analítica o marketing.</p>
            </div>
            <div class="cafe-cookie-banner__actions">
                <button type="button" data-cookie="necessary">Solo necesarias</button>
                <button type="button" data-cookie="all">Aceptar opcionales</button>
            </div>`;
        document.body.appendChild(banner);

        banner.querySelector("[data-cookie='necessary']").addEventListener("click", () => {
            localStorage.setItem(key, JSON.stringify({ necessary: true, analytics: false, marketing: false, at: new Date().toISOString() }));
            banner.remove();
        });
        banner.querySelector("[data-cookie='all']").addEventListener("click", () => {
            localStorage.setItem(key, JSON.stringify({
                necessary: true,
                analytics: !!settings.cookies_analytics_enabled,
                marketing: !!settings.cookies_marketing_enabled,
                at: new Date().toISOString()
            }));
            banner.remove();
        });
    }

    async function init() {
        const settings = await getSettings();
        applyFooter(settings);
        ensureCookieBanner(settings);
        return settings;
    }

    window.CafeAppSiteSettings = { getSettings, init, applyFooter };
})();
