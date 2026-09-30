/* =========================================================
   LOGIN — CAFÉ PARAÍSO
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login-form");
    if (!form) return;

    const submitButton = form.querySelector(".login-submit");
    const forgotPassword = document.getElementById("forgot-password");
    const emailInput = document.getElementById("login-email");
    const message = document.createElement("div");
    message.id = "login-message";
    message.className = "auth-message";
    message.hidden = true;
    form.prepend(message);

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
            ? 'Iniciando sesión <span class="auth-spinner" aria-hidden="true"></span>'
            : 'Iniciar sesión <i class="bi bi-arrow-right"></i>';
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearMessage();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const email = document.getElementById("login-email").value.trim().toLowerCase();
        const password = document.getElementById("login-password").value;

        setLoading(true);

        try {
            const { data, error } = await window.CafeAppAuth.login({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            if (!data.session) {
                showMessage(
                    "La cuenta necesita confirmación por correo antes de iniciar sesión."
                );
                return;
            }

            const role = await window.CafeAppAuth.getRole();
            const destination = window.CafeAppAuth.getRoleDestination(role);

            showMessage("Sesión iniciada correctamente. Redirigiendo...", "success");

            window.setTimeout(() => {
                window.location.replace(destination);
            }, 450);
        } catch (error) {
            console.error("[Login]", error);
            showMessage(getAuthErrorMessage(error));
        } finally {
            setLoading(false);
        }
    });

    forgotPassword?.addEventListener("click", async (event) => {
        event.preventDefault();
        clearMessage();

        if (!emailInput.checkValidity()) {
            showMessage("Introduce primero un correo electrónico válido.");
            emailInput.focus();
            emailInput.reportValidity();
            return;
        }

        forgotPassword.setAttribute("aria-disabled", "true");

        try {
            const { error } = await window.CafeAppAuth.requestPasswordReset(
                emailInput.value.trim().toLowerCase()
            );
            if (error) throw error;

            showMessage(
                "Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña.",
                "success"
            );
        } catch (error) {
            console.error("[Recuperación]", error);
            showMessage("No se pudo solicitar la recuperación. Inténtalo de nuevo.");
        } finally {
            forgotPassword.removeAttribute("aria-disabled");
        }
    });

    function getAuthErrorMessage(error) {
        const message = String(error?.message || "").toLowerCase();

        if (message.includes("invalid login credentials")) {
            return "El correo o la contraseña no son correctos.";
        }

        if (message.includes("email not confirmed")) {
            return "Debes confirmar tu correo electrónico antes de iniciar sesión.";
        }

        if (message.includes("apikey") || message.includes("invalid api key")) {
            return "La configuración de Supabase no es válida. Revisa la URL y la clave pública.";
        }

        return error?.message || "No se ha podido iniciar sesión. Inténtalo de nuevo.";
    }
});
