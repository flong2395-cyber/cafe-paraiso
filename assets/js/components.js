// ==========================================
// COMPONENTES DEL PROYECTO
// ==========================================

const COMPONENTS = [
    "navbar", "hero", "products", "about", "benefits",
    "statistics", "jobs", "footer"
];

let siteSettingsInitialization = null;

async function loadComponent(name) {
    const container = document.getElementById(name);
    if (!container) return;

    const response = await fetch(`components/${name}/${name}.html`, {
        headers: { Accept: "text/html" }
    });

    if (!response.ok) {
        throw new Error(`No se pudo cargar ${name}.html (${response.status}).`);
    }

    const html = await response.text();
    if (!html.trim()) throw new Error(`El componente ${name}.html está vacío.`);

    container.innerHTML = html;
}

function initializeSiteSettings() {
    if (siteSettingsInitialization) return siteSettingsInitialization;

    siteSettingsInitialization = new Promise((resolve, reject) => {
        const initialize = async () => {
            if (!window.CafeAppSiteSettings) {
                reject(new Error("No se pudo inicializar la configuración pública del sitio."));
                return;
            }

            try {
                await window.CafeAppSiteSettings.init();
                resolve();
            } catch (error) {
                reject(error);
            }
        };

        if (window.CafeAppSiteSettings) {
            initialize();
            return;
        }

        const script = document.createElement("script");
        script.src = "assets/js/site-settings.js";
        script.onload = initialize;
        script.onerror = () => reject(new Error("No se pudo cargar la configuración pública del sitio."));
        document.body.appendChild(script);
    });

    return siteSettingsInitialization;
}

async function loadComponents() {
    await Promise.all(COMPONENTS.map(loadComponent));

    // El footer no es decorativo: se sincroniza con la configuración guardada en Supabase.
    if (document.getElementById("footer")) {
        await initializeSiteSettings();
    }
}
