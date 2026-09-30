/* Café Paraíso — contenido de páginas legales. */
(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", async () => {
        const content = document.getElementById("legal-content");
        const setting = content?.dataset.legalSetting;
        if (!content || !setting) return;

        try {
            await loadComponents();
            const settings = await window.CafeAppSiteSettings.getSettings();
            const text = String(settings[setting] || "").trim();

            if (text) {
                content.textContent = text;
                content.classList.remove("legal-empty");
            }
        } catch (error) {
            console.error("[Páginas legales] No se pudo cargar la configuración pública.", error);
        }
    });
})();
