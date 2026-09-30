/* CAFÉ PARAÍSO — RECUPERAR CONTRASEÑA */

(function () {
    "use strict";

    const auth = window.CafeAppAuth;

    const loading = document.getElementById("password-loading");
    const errorBox = document.getElementById("password-error");
    const errorText = document.getElementById("password-error-text");
    const content = document.getElementById("password-content");

    const form = document.getElementById("password-form");
    const newPassword = document.getElementById("new-password");
    const confirmPassword = document.getElementById("confirm-password");
    const submitButton = document.getElementById("password-submit");
    const statusBox = document.getElementById("password-status");

    function showError(message) {
        loading.classList.add("d-none");
        content.classList.add("d-none");
        errorText.textContent = message;
        errorBox.classList.remove("d-none");
    }

    function showContent() {
        loading.classList.add("d-none");
        errorBox.classList.add("d-none");
        content.classList.remove("d-none");
    }

    function setStatus(message, type) {
        statusBox.textContent = message;
        statusBox.className =
            "account-status " +
            (type === "success"
                ? "account-status-success"
                : "account-status-error");
    }

    function clearStatus() {
        statusBox.textContent = "";
        statusBox.className = "account-status d-none";
    }

    function getAuthErrorMessage(error) {
        const message = String(error?.message || "").toLowerCase();

        if (message.includes("password should be at least")) {
            return "La nueva contraseña debe tener al menos 6 caracteres.";
        }

        if (message.includes("recovery") || message.includes("session")) {
            return "El enlace de recuperación no es válido o ha caducado.";
        }

        return "No se pudo cambiar la contraseña. Inténtalo de nuevo.";
    }

    async function init() {
        if (!auth) {
            showError("No se pudo inicializar la autenticación.");
            return;
        }

        try {
            const recoverySession = await auth.waitForPasswordRecovery();
            if (!recoverySession) {
                showError("Abre esta página desde un enlace de recuperación válido enviado por correo.");
                return;
            }

            showContent();
        } catch (error) {
            console.error("[Cambiar contraseña]", error);
            showError("No se pudo comprobar tu sesión.");
        }
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearStatus();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        if (newPassword.value !== confirmPassword.value) {
            setStatus("Las nuevas contraseñas no coinciden.", "error");
            confirmPassword.focus();
            return;
        }

        submitButton.disabled = true;
        submitButton.setAttribute("aria-busy", "true");
        submitButton.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Actualizando...';

        try {
            if (!auth.hasPasswordRecoverySession()) {
                throw new Error("No existe una sesión de recuperación válida.");
            }

            const { error } = await auth.changeRecoveredPassword(newPassword.value);

            if (error) {
                throw error;
            }

            form.reset();
            setStatus("Tu contraseña se ha restablecido correctamente. Ya puedes iniciar sesión.", "success");
            submitButton.disabled = true;
        } catch (error) {
            console.error("[Cambiar contraseña] Error:", error);
            setStatus(getAuthErrorMessage(error), "error");
        } finally {
            if (auth.hasPasswordRecoverySession()) submitButton.disabled = false;
            submitButton.removeAttribute("aria-busy");
            submitButton.innerHTML = 'Guardar nueva contraseña <i class="bi bi-check2"></i>';
        }
    });

    init();
})();
