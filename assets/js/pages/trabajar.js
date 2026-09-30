/* Café Paraíso — página pública de empleo */
document.addEventListener("DOMContentLoaded", async () => {
    const link = document.getElementById("trabajar-cta-link");
    const title = document.getElementById("trabajar-cta-title");
    const text = document.getElementById("trabajar-cta-text");

    if (!link || !window.CafeAppAuth) return;

    try {
        const user = await window.CafeAppAuth.getCurrentUser();
        if (!user) return;

        link.href = "mi-cuenta.html#jobs";
        link.querySelector("span").textContent = "Ver mis candidaturas";
        if (title) title.textContent = "Ya tienes una cuenta.";
        if (text) text.textContent = "Consulta tus candidaturas y presenta nuevas solicitudes desde tu área personal.";
    } catch (error) {
        console.warn("[Trabajar] No se pudo comprobar la sesión:", error);
    }
});
