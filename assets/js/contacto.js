/* Café Paraíso — formulario de contacto */
(function () {
    "use strict";

    const form = document.getElementById("contact-form");
    const status = document.getElementById("contact-form-status");
    const api = window.CafeAppMessages;
    if (!form || !status || !api) return;

    function showStatus(text, type) {
        status.hidden = false;
        status.className = `contact-form-status ${type}`;
        status.textContent = text;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (form.dataset.submitting === "true") return;

        form.dataset.submitting = "true";
        const button = form.querySelector("button[type='submit']");
        const original = button.innerHTML;
        button.disabled = true;
        button.innerHTML = 'Enviando… <i class="bi bi-arrow-repeat"></i>';
        status.hidden = true;

        const data = new FormData(form);
        try {
            const { error } = await api.createMessage({
                name: data.get("name") || "",
                email: data.get("email") || "",
                phone: data.get("phone") || "",
                subject: data.get("subject") || "",
                message: data.get("message") || "",
            });
            if (error) throw error;

            form.reset();
            showStatus("Mensaje enviado correctamente. Nos pondremos en contacto contigo.", "success");
        } catch (error) {
            console.error("[Contacto]", error);
            showStatus("No se ha podido enviar el mensaje. Inténtalo de nuevo.", "error");
        } finally {
            form.dataset.submitting = "false";
            button.disabled = false;
            button.innerHTML = original;
        }
    });
})();
