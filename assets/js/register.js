/* =========================================================
   REGISTRO — CAFÉ PARAÍSO
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("register-form");
    if (!form) return;

    const submitButton = form.querySelector(".register-submit");
    const password = document.getElementById("register-password");
    const passwordConfirmation = document.getElementById("register-password-confirm");

    const existingMessage = document.getElementById("register-message");
    const message = existingMessage || document.createElement("div");

    if (!existingMessage) {
        message.id = "register-message";
        message.className = "auth-message";
        form.prepend(message);
    }

    function showMessage(text, type = "error") {
        message.textContent = text;
        message.className = `auth-message auth-message-${type}`;
        message.hidden = false;
    }

    function clearMessage() {
        message.textContent = "";
        message.hidden = true;
    }

    function setLoading(loading) {
        submitButton.disabled = loading;
        submitButton.setAttribute("aria-busy", String(loading));

        submitButton.innerHTML = loading
            ? 'Creando cuenta <span class="auth-spinner" aria-hidden="true"></span>'
            : 'Crear cuenta <i class="bi bi-arrow-right"></i>';
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearMessage();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        if (password.value !== passwordConfirmation.value) {
            showMessage("Las contraseñas no coinciden.");
            passwordConfirmation.focus();
            return;
        }

        const name = document.getElementById("register-name").value.trim();
        const email = document.getElementById("register-email").value.trim().toLowerCase();

        setLoading(true);

        try {
            const { data, error } = await window.CafeAppAuth.register({
                name,
                email,
                password: password.value,
            });

            if (error) {
                throw error;
            }

            if (data.session) {
                showMessage("Cuenta creada correctamente. Redirigiendo...", "success");
                window.setTimeout(() => {
                    window.location.href = "index.html";
                }, 900);
                return;
            }

            showMessage(
                "Cuenta creada. Revisa tu correo electrónico para confirmar la cuenta antes de iniciar sesión.",
                "success"
            );
            form.reset();
        } catch (error) {
            console.error("[Registro]", error);
            showMessage(getAuthErrorMessage(error));
        } finally {
            setLoading(false);
        }
    });

    function getAuthErrorMessage(error) {
        const message = String(error?.message || "").toLowerCase();

        if (message.includes("invalid api key") || message.includes("apikey")) {
            return "La configuración de Supabase no es válida. Revisa la URL y la clave pública.";
        }

        if (message.includes("password") && message.includes("at least")) {
            return "La contraseña no cumple los requisitos mínimos de Supabase.";
        }

        if (message.includes("email")) {
            return "Revisa el correo electrónico introducido.";
        }

        return error?.message || "No se ha podido crear la cuenta. Inténtalo de nuevo.";
    }
});
