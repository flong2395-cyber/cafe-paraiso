// ==========================================
// APP
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await loadComponents();
        initNavbar();

        if (window.CafeAppProducts) {
            await window.CafeAppProducts.init();
        }
    } catch (error) {
        console.error(
            "No se pudo inicializar la aplicación:",
            error
        );
    }
});

// ==========================================
// FIN APP
// ==========================================
