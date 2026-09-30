/* =========================================================
   CAFÉ PARAÍSO — MI CUENTA
   ========================================================= */

(function () {
    "use strict";

    const auth = window.CafeAppAuth;
    const supabase = window.CafeAppSupabase;

    const loading = document.getElementById("account-loading");
    const errorBox = document.getElementById("account-error");
    const errorText = document.getElementById("account-error-text");
    const content = document.getElementById("account-content");

    const form = document.getElementById("profile-form");
    const nameInput = document.getElementById("profile-name");
    const emailInput = document.getElementById("profile-email");
    const phoneInput = document.getElementById("profile-phone");

    const summaryName = document.getElementById("account-navbar-name");
    const summaryEmail = document.getElementById("account-dropdown-email");
    const dropdownName = document.getElementById("account-dropdown-name");

    const avatarInput = document.getElementById("avatar-input");
    const avatarPreview = document.getElementById("profile-avatar-preview");
    const avatarPlaceholder = document.getElementById("profile-avatar-placeholder");
    const avatarStatus = document.getElementById("avatar-status");

    const navbarAvatar = document.getElementById("account-navbar-avatar");
    const navbarAvatarPlaceholder = document.getElementById("account-navbar-avatar-placeholder");

    const statusBox = document.getElementById("profile-status");
    const submitButton = document.getElementById("profile-submit");
    const logoutButton = document.getElementById("logout-button");
    const dropdownLogout = document.getElementById("account-dropdown-logout");

    let currentUser = null;
    let profileData = null;
    let applicationsLoaded = false;
    let applicationsChannel = null;
    let notificationsChannel = null;
    let notificationsLoaded = false;

    const jobsApi = window.CafeAppJobs;
    const notificationsApi = window.CafeAppNotifications;
    const jobForm = document.getElementById("account-job-form");
    const jobName = document.getElementById("account-job-name");
    const jobEmail = document.getElementById("account-job-email");
    const jobPhone = document.getElementById("account-job-phone");
    const jobPosition = document.getElementById("account-job-position");
    const jobMessage = document.getElementById("account-job-message");
    const jobCv = document.getElementById("account-job-cv");
    const jobCvName = document.getElementById("account-job-cv-name");
    const jobConsent = document.getElementById("account-job-consent");
    const jobSubmit = document.getElementById("account-job-submit");
    const jobStatus = document.getElementById("account-job-status");
    const applicationsList = document.getElementById("account-applications-list");
    const applicationsStatus = document.getElementById("account-applications-status");
    const applicationsRefresh = document.getElementById("account-job-refresh");

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

    function setStatus(element, message, type) {
        element.textContent = message;
        element.className =
            "account-status " +
            (type === "success"
                ? "account-status-success"
                : "account-status-error");
    }

    function clearStatus(element) {
        element.textContent = "";
        element.className = "account-status d-none";
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getDisplayName(user, profile) {
        return (
            profile?.full_name ||
            user?.user_metadata?.full_name ||
            user?.email?.split("@")[0] ||
            "Usuario"
        );
    }

    async function loadProfile(user) {
        const { data, error } = await supabase
            .from("profiles")
            .select("id, full_name, email, phone, avatar_url")
            .eq("id", user.id)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    function renderAvatar(url) {
        if (url) {
            avatarPreview.src =
                `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;

            avatarPreview.classList.remove("d-none");
            avatarPlaceholder.classList.add("d-none");

            navbarAvatar.src =
                `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;

            navbarAvatar.classList.remove("d-none");
            navbarAvatarPlaceholder.classList.add("d-none");
        } else {
            avatarPreview.removeAttribute("src");
            avatarPreview.classList.add("d-none");
            avatarPlaceholder.classList.remove("d-none");

            navbarAvatar.removeAttribute("src");
            navbarAvatar.classList.add("d-none");
            navbarAvatarPlaceholder.classList.remove("d-none");
        }
    }

    function renderProfile(user, profile) {
        const displayName = getDisplayName(user, profile);
        const email = user.email || profile?.email || "";

        nameInput.value = displayName;
        emailInput.value = email;
        phoneInput.value = profile?.phone || "";

        summaryName.textContent = displayName;
        dropdownName.textContent = displayName;
        summaryEmail.textContent = email;

        renderAvatar(profile?.avatar_url);
    }

    function validateAvatar(file) {
        const allowed = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ];

        if (!allowed.includes(file.type)) {
            throw new Error(
                "Formato no permitido. Usa JPG, PNG, WEBP o GIF."
            );
        }

        if (file.size > 5 * 1024 * 1024) {
            throw new Error("La imagen supera el límite de 5 MB.");
        }
    }

    function resizeToWebp(file) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            const objectUrl = URL.createObjectURL(file);

            image.onload = () => {
                URL.revokeObjectURL(objectUrl);

                const maxSize = 512;
                const scale = Math.min(
                    1,
                    maxSize / Math.max(image.width, image.height)
                );

                const width = Math.max(1, Math.round(image.width * scale));
                const height = Math.max(1, Math.round(image.height * scale));

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const context = canvas.getContext("2d");
                context.drawImage(image, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(
                                new Error(
                                    "No se pudo procesar la imagen."
                                )
                            );
                            return;
                        }

                        resolve(blob);
                    },
                    "image/webp",
                    0.85
                );
            };

            image.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error("No se pudo leer la imagen."));
            };

            image.src = objectUrl;
        });
    }

    async function uploadAvatar(file, user) {
        validateAvatar(file);

        const blob = await resizeToWebp(file);
        const path = `${user.id}/avatar.webp`;

        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(path, blob, {
                cacheControl: "3600",
                contentType: "image/webp",
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from("avatars")
            .getPublicUrl(path);

        if (!data?.publicUrl) {
            throw new Error(
                "No se pudo obtener la URL de la imagen."
            );
        }

        const { error: profileError } = await supabase
            .from("profiles")
            .update({
                avatar_url: data.publicUrl
            })
            .eq("id", user.id);

        if (profileError) throw profileError;

        return data.publicUrl;
    }

    async function init() {
        if (!auth || !supabase) {
            showError(
                "No se pudo inicializar la autenticación."
            );
            return;
        }

        try {
            currentUser = await auth.getCurrentUser();

            if (!currentUser) {
                window.location.replace("login.html");
                return;
            }

            const profile = await loadProfile(currentUser);
            profileData = profile;

            renderProfile(currentUser, profile);
            fillJobForm(currentUser, profile);
            showContent();

            // Cargar el contenido de la pestaña abierta y preparar el buzón.
            const initialPanel = window.location.hash.slice(1);
            if (initialPanel === "jobs") {
                await loadMyApplications();
            }
            if (initialPanel === "notifications") {
                await loadNotifications();
            }

            await refreshNotificationBadge();
            subscribeToApplicationUpdates();
            subscribeToNotificationUpdates();
        } catch (error) {
            console.error("[Mi cuenta]", error);

            showError(
                "No se pudo cargar tu perfil. Comprueba que la tabla profiles esté creada en Supabase."
            );
        }
    }

    /* =====================================================
       GUARDAR PERFIL
       ===================================================== */

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearStatus(statusBox);

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();

        if (!name) {
            setStatus(
                statusBox,
                "Introduce tu nombre y apellidos.",
                "error"
            );
            return;
        }

        submitButton.disabled = true;
        submitButton.innerHTML =
            '<span>Guardando...</span><i class="bi bi-arrow-repeat spin"></i>';

        try {
            const user = await auth.getCurrentUser();

            if (!user) {
                window.location.replace("login.html");
                return;
            }

            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: name,
                    phone: phone || null
                })
                .eq("id", user.id);

            if (error) throw error;

            await supabase.auth.updateUser({
                data: {
                    full_name: name
                }
            });

            profileData = {
                ...(profileData || {}),
                full_name: name,
                phone: phone || null
            };
            fillJobForm(user, profileData);

            summaryName.textContent = name;
            dropdownName.textContent = name;

            setStatus(
                statusBox,
                "Tus datos se han guardado correctamente.",
                "success"
            );
        } catch (error) {
            console.error(
                "[Mi cuenta] Error al guardar:",
                error
            );

            setStatus(
                statusBox,
                "No se pudieron guardar los cambios. Inténtalo de nuevo.",
                "error"
            );
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML =
                '<span>Guardar cambios</span><i class="bi bi-check2"></i>';
        }
    });

    /* =====================================================
       AVATAR
       ===================================================== */

    avatarInput.addEventListener("change", async () => {
        clearStatus(avatarStatus);

        const file = avatarInput.files?.[0];
        if (!file) return;

        avatarInput.disabled = true;

        setStatus(
            avatarStatus,
            "Subiendo foto...",
            "success"
        );

        try {
            const user = await auth.getCurrentUser();

            if (!user) {
                window.location.replace("login.html");
                return;
            }

            const url = await uploadAvatar(file, user);

            renderAvatar(url);

            setStatus(
                avatarStatus,
                "Foto de perfil actualizada.",
                "success"
            );
        } catch (error) {
            console.error(
                "[Mi cuenta] Error al subir avatar:",
                error
            );

            setStatus(
                avatarStatus,
                error.message || "No se pudo subir la foto.",
                "error"
            );
        } finally {
            avatarInput.disabled = false;
            avatarInput.value = "";
        }
    });

    /* =====================================================
       CAMBIO DE CONTRASEÑA
       ===================================================== */

    const passwordForm = document.getElementById("password-form");
    const currentPassword = document.getElementById("current-password");
    const newPassword = document.getElementById("new-password");
    const confirmPassword = document.getElementById("confirm-password");
    const passwordSubmit = document.getElementById("password-submit");
    const passwordStatus = document.getElementById("password-status");

    if (passwordForm) {
        passwordForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            clearStatus(passwordStatus);

            const current = currentPassword.value;
            const next = newPassword.value;
            const confirm = confirmPassword.value;

            if (current.length < 6) {
                setStatus(
                    passwordStatus,
                    "Introduce tu contraseña actual.",
                    "error"
                );
                return;
            }

            if (next.length < 6) {
                setStatus(
                    passwordStatus,
                    "La nueva contraseña debe tener al menos 6 caracteres.",
                    "error"
                );
                return;
            }

            if (next !== confirm) {
                setStatus(
                    passwordStatus,
                    "Las nuevas contraseñas no coinciden.",
                    "error"
                );
                return;
            }

            if (current === next) {
                setStatus(
                    passwordStatus,
                    "La nueva contraseña debe ser diferente de la actual.",
                    "error"
                );
                return;
            }

            passwordSubmit.disabled = true;
            passwordSubmit.innerHTML =
                '<span>Actualizando...</span><i class="bi bi-arrow-repeat spin"></i>';

            try {
                const user = await auth.getCurrentUser();

                if (!user?.email) {
                    throw new Error(
                        "No se pudo identificar tu cuenta."
                    );
                }

                const { error: verifyError } =
                    await supabase.auth.signInWithPassword({
                        email: user.email,
                        password: current
                    });

                if (verifyError) {
                    throw new Error(
                        "La contraseña actual no es correcta."
                    );
                }

                const { error: updateError } =
                    await supabase.auth.updateUser({
                        password: next
                    });

                if (updateError) throw updateError;

                passwordForm.reset();

                setStatus(
                    passwordStatus,
                    "Tu contraseña se ha actualizado correctamente.",
                    "success"
                );
            } catch (error) {
                console.error(
                    "[Mi cuenta] Error de contraseña:",
                    error
                );

                setStatus(
                    passwordStatus,
                    error.message ||
                    "No se pudo actualizar la contraseña.",
                    "error"
                );
            } finally {
                passwordSubmit.disabled = false;
                passwordSubmit.innerHTML =
                    '<span>Cambiar contraseña</span><i class="bi bi-check2"></i>';
            }
        });
    }

    /* =====================================================
       VISIBILIDAD DE CONTRASEÑAS
       ===================================================== */

    document.querySelectorAll("[data-password-toggle]").forEach((button) => {
        button.addEventListener("click", () => {
            const input = document.getElementById(
                button.dataset.passwordToggle
            );

            if (!input) return;

            const visible = input.type === "text";
            input.type = visible ? "password" : "text";

            button.innerHTML = visible
                ? '<i class="bi bi-eye"></i>'
                : '<i class="bi bi-eye-slash"></i>';

            button.setAttribute(
                "aria-label",
                visible
                    ? "Mostrar contraseña"
                    : "Ocultar contraseña"
            );
        });
    });

    /* =====================================================
       NOTIFICACIONES
       ===================================================== */

    const notificationBadge = document.getElementById("account-notification-badge");
    const notificationsList = document.getElementById("account-notifications-list");
    const notificationsStatus = document.getElementById("account-notifications-status");
    const notificationsCount = document.getElementById("account-notifications-count");
    const notificationsReadAll = document.getElementById("account-notifications-read-all");
    const notificationsDeleteAll = document.getElementById("account-notifications-delete-all");

    function notificationDate(value) {
        if (!value) return "";
        return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
    }

    function setNotificationsStatus(message, type = "error") {
        if (!notificationsStatus) return;
        notificationsStatus.textContent = message;
        notificationsStatus.className = `account-status ${type === "success" ? "account-status-success" : "account-status-error"}`;
    }

    function clearNotificationsStatus() {
        if (!notificationsStatus) return;
        notificationsStatus.textContent = "";
        notificationsStatus.className = "account-status d-none";
    }

    function renderNotificationBadge(count) {
        if (!notificationBadge) return;
        const value = Number(count || 0);
        notificationBadge.textContent = value > 99 ? "99+" : String(value);
        notificationBadge.classList.toggle("d-none", value <= 0);
    }

    async function refreshNotificationBadge() {
        if (!notificationsApi) return;
        try {
            renderNotificationBadge(await notificationsApi.getUnreadCount());
        } catch (error) {
            console.warn("[Mi cuenta] No se pudo actualizar el contador de notificaciones.", error);
        }
    }

    function renderNotifications(notifications) {
        if (!notificationsList) return;
        if (!notifications.length) {
            notificationsList.innerHTML = `
                <div class="account-notifications-empty">
                    <i class="bi bi-bell-slash"></i>
                    <strong>No tienes notificaciones.</strong>
                    <span>Cuando RRHH te envíe un mensaje, aparecerá aquí.</span>
                </div>`;
            if (notificationsCount) notificationsCount.textContent = "No tienes notificaciones";
            return;
        }

        const unread = notifications.filter(n => !n.read_at).length;
        if (notificationsCount) {
            notificationsCount.textContent = unread
                ? `${notifications.length} notificación${notifications.length === 1 ? "" : "es"} · ${unread} sin leer`
                : `${notifications.length} notificación${notifications.length === 1 ? "" : "es"}`;
        }

        notificationsList.innerHTML = notifications.map((notification) => `
            <article class="account-notification-card ${notification.read_at ? "is-read" : "is-unread"}" data-notification-id="${escapeHtml(notification.id)}">
                <div class="account-notification-icon"><i class="bi bi-${notification.read_at ? "bell" : "bell-fill"}"></i></div>
                <div class="account-notification-content">
                    <div class="account-notification-top"><strong>${escapeHtml(notification.title || "Notificación")}</strong><time>${escapeHtml(notificationDate(notification.created_at))}</time></div>
                    <p>${escapeHtml(notification.message || "")}</p>
                    <div class="account-notification-actions">
                        ${notification.read_at ? "" : '<button type="button" class="account-notification-read" data-notification-read>Marcar como leída</button>'}
                        <button type="button" class="account-notification-delete" data-notification-delete aria-label="Borrar notificación" title="Borrar notificación"><i class="bi bi-trash3"></i><span>Borrar</span></button>
                    </div>
                </div>
            </article>`).join("");

        notificationsList.querySelectorAll("[data-notification-read]").forEach((button) => {
            button.addEventListener("click", async () => {
                const card = button.closest("[data-notification-id]");
                const id = card?.dataset.notificationId;
                if (!id) return;
                button.disabled = true;
                try {
                    await notificationsApi.markAsRead(id);
                    await loadNotifications({ silent: true });
                } catch (error) {
                    console.error("[Mi cuenta] Marcar notificación", error);
                    button.disabled = false;
                    setNotificationsStatus("No se pudo marcar la notificación como leída.");
                }
            });
        });

        notificationsList.querySelectorAll("[data-notification-delete]").forEach((button) => {
            button.addEventListener("click", async () => {
                const card = button.closest("[data-notification-id]");
                const id = card?.dataset.notificationId;
                if (!id) return;
                if (!window.confirm("¿Quieres borrar esta notificación? Esta acción no se puede deshacer.")) return;

                button.disabled = true;
                try {
                    await notificationsApi.deleteNotification(id);
                    await loadNotifications({ silent: true });
                    await refreshNotificationBadge();
                    setNotificationsStatus("Notificación borrada correctamente.", "success");
                } catch (error) {
                    console.error("[Mi cuenta] Borrar notificación", error);
                    button.disabled = false;
                    setNotificationsStatus(error?.message || "No se pudo borrar la notificación.");
                }
            });
        });
    }

    async function loadNotifications({ silent = false } = {}) {
        if (!notificationsList || !notificationsApi) return;
        if (!silent) {
            notificationsList.innerHTML = '<div class="account-notifications-empty"><i class="bi bi-arrow-repeat spin"></i><span>Cargando notificaciones…</span></div>';
            clearNotificationsStatus();
        }
        try {
            const notifications = await notificationsApi.getMyNotifications();
            renderNotifications(notifications);
            notificationsLoaded = true;
            renderNotificationBadge(notifications.filter(n => !n.read_at).length);
        } catch (error) {
            console.error("[Mi cuenta] Notificaciones", error);
            notificationsList.innerHTML = '<div class="account-notifications-empty account-notifications-error"><i class="bi bi-exclamation-circle"></i><strong>No se pudieron cargar las notificaciones.</strong><span>Inténtalo de nuevo en unos segundos.</span></div>';
            setNotificationsStatus(error?.message || "No se pudieron cargar las notificaciones.");
        }
    }

    function subscribeToNotificationUpdates() {
        if (!supabase || !currentUser || notificationsChannel) return;
        notificationsChannel = supabase
            .channel(`notifications-${currentUser.id}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${currentUser.id}` }, () => {
                if (window.location.hash.slice(1) === "notifications") loadNotifications({ silent: true });
                else refreshNotificationBadge();
            })
            .subscribe((status) => {
                if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                    console.warn("[Mi cuenta] No se pudo activar el tiempo real de notificaciones.");
                }
            });
    }

    notificationsReadAll?.addEventListener("click", async () => {
        if (!notificationsApi) return;
        const button = notificationsReadAll;
        const original = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="bi bi-arrow-repeat spin"></i><span>Actualizando…</span>';
        try {
            await notificationsApi.markAllAsRead();
            await loadNotifications({ silent: true });
            setNotificationsStatus("Todas las notificaciones están marcadas como leídas.", "success");
        } catch (error) {
            console.error("[Mi cuenta] Marcar todo como leído", error);
            setNotificationsStatus(error?.message || "No se pudieron actualizar las notificaciones.");
        } finally {
            button.disabled = false;
            button.innerHTML = original;
        }
    });

    notificationsDeleteAll?.addEventListener("click", async () => {
        if (!notificationsApi) return;
        if (!window.confirm("¿Quieres borrar todas tus notificaciones? Esta acción no se puede deshacer.")) return;

        const button = notificationsDeleteAll;
        const original = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="bi bi-arrow-repeat spin"></i><span>Borrando…</span>';
        try {
            await notificationsApi.deleteAllNotifications();
            await loadNotifications({ silent: true });
            await refreshNotificationBadge();
            setNotificationsStatus("Todas las notificaciones han sido borradas.", "success");
        } catch (error) {
            console.error("[Mi cuenta] Borrar todas las notificaciones", error);
            setNotificationsStatus(error?.message || "No se pudieron borrar las notificaciones.");
        } finally {
            button.disabled = false;
            button.innerHTML = original;
        }
    });

    /* =====================================================
       TRABAJA CON NOSOTROS
       ===================================================== */

    const JOB_ALLOWED_TYPES = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    const JOB_ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];
    const JOB_MAX_SIZE = 5 * 1024 * 1024;

    function fillJobForm(user, profile) {
        if (!jobForm) return;

        // Estos tres datos no se editan desde la candidatura.
        // La única fuente editable es Mi cuenta > Datos personales.
        jobName.value = profile?.full_name || "";
        jobEmail.value = user?.email || profile?.email || "";
        jobPhone.value = profile?.phone || "";

        const missing = [];
        if (!profile?.full_name?.trim()) missing.push("nombre y apellidos");
        if (!jobEmail.value.trim()) missing.push("correo electrónico");
        if (!profile?.phone?.trim()) missing.push("teléfono");

        jobForm.dataset.personalDataReady = missing.length ? "false" : "true";
        jobForm.dataset.personalDataMissing = missing.join(", ");
    }

    function jobExtension(filename) {
        const dot = filename.lastIndexOf(".");
        return dot === -1 ? "" : filename.slice(dot).toLowerCase();
    }

    function validateJobCv(file) {
        if (!file) return "Selecciona tu currículum para continuar.";
        const extension = jobExtension(file.name);
        if (!JOB_ALLOWED_TYPES.includes(file.type) && !JOB_ALLOWED_EXTENSIONS.includes(extension)) {
            return "El currículum debe estar en formato PDF, DOC o DOCX.";
        }
        if (file.size <= 0) return "El archivo seleccionado está vacío.";
        if (file.size > JOB_MAX_SIZE) return "El currículum no puede superar los 5 MB.";
        return "";
    }

    function setJobStatus(message, type = "error") {
        if (!jobStatus) return;
        jobStatus.textContent = message;
        jobStatus.className = `account-status ${type === "success" ? "account-status-success" : "account-status-error"}`;
    }

    function clearJobStatus() {
        if (!jobStatus) return;
        jobStatus.textContent = "";
        jobStatus.className = "account-status d-none";
    }

    function setApplicationsStatus(message, type = "error") {
        if (!applicationsStatus) return;
        applicationsStatus.textContent = message;
        applicationsStatus.className = `account-status ${type === "success" ? "account-status-success" : "account-status-error"}`;
    }

    function statusMeta(status) {
        return {
            pending: {
                label: "Pendiente",
                className: "pending",
                icon: "bi-hourglass-split",
                text: "Tu candidatura está pendiente de revisión."
            },
            approved: {
                label: "Aprobada",
                className: "approved",
                icon: "bi-check-circle",
                text: "Tu candidatura ha sido aprobada y continúa en el proceso de selección."
            },
            rejected: {
                label: "Rechazada",
                className: "rejected",
                icon: "bi-x-circle",
                text: "Tu candidatura no continúa en el proceso de selección."
            },
            archived: {
                label: "Archivada",
                className: "archived",
                icon: "bi-archive",
                text: "La candidatura está archivada."
            }
        }[String(status || "").toLowerCase()] || {
            label: status || "Sin estado",
            className: "pending",
            icon: "bi-info-circle",
            text: "El estado de esta candidatura no está disponible."
        };
    }

    function positionLabel(position) {
        return ({
            produccion: "Producción",
            almacen: "Almacén y logística",
            administracion: "Administración",
            comercial: "Comercial y ventas",
            reparto: "Reparto y distribución",
            otro: "Otro / candidatura espontánea"
        })[position] || position || "—";
    }

    function formatApplicationDate(value) {
        if (!value) return "—";
        return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
    }

    function renderApplications(applications) {
        if (!applicationsList) return;
        if (!applications.length) {
            applicationsList.innerHTML = `
                <div class="account-applications-empty">
                    <i class="bi bi-briefcase"></i>
                    <strong>Aún no has enviado ninguna candidatura.</strong>
                    <span>Completa el formulario de arriba para presentar tu perfil.</span>
                </div>`;
            return;
        }

        applicationsList.innerHTML = applications.map((application) => {
            const meta = statusMeta(application.status);
            return `
                <article class="account-application-card">
                    <div class="account-application-card-top">
                        <div>
                            <span class="account-panel-eyebrow">Candidatura</span>
                            <h4>${escapeHtml(positionLabel(application.position))}</h4>
                            <small>
                                Enviada el ${escapeHtml(formatApplicationDate(application.created_at))}
                                ${application.updated_at && application.updated_at !== application.created_at
                                    ? ` · Actualizada el ${escapeHtml(formatApplicationDate(application.updated_at))}`
                                    : ""}
                            </small>
                        </div>
                        <span class="account-application-status ${meta.className}"><i class="bi ${meta.icon}"></i>${escapeHtml(meta.label)}</span>
                    </div>
                    <div class="account-application-card-body">
                        <div><span>Estado</span><strong>${escapeHtml(meta.text)}</strong></div>
                        <div><span>Currículum</span><strong>${escapeHtml(application.cv_name || "Documento adjunto")}</strong></div>
                    </div>
                </article>`;
        }).join("");
    }

    async function loadMyApplications({ silent = false } = {}) {
        if (!applicationsList || !jobsApi) return;

        if (!silent) {
            applicationsList.innerHTML =
                '<div class="account-applications-empty"><i class="bi bi-arrow-repeat spin"></i><span>Cargando candidaturas…</span></div>';
            if (applicationsStatus) applicationsStatus.className = "account-status d-none";
        }

        try {
            const applications = await jobsApi.getMyApplications();
            renderApplications(applications);
            applicationsLoaded = true;
        } catch (error) {
            console.error("[Mi cuenta] Candidaturas", error);
            applicationsList.innerHTML =
                '<div class="account-applications-empty account-applications-error"><i class="bi bi-exclamation-circle"></i><strong>No se pudieron cargar tus candidaturas.</strong><span>Inténtalo de nuevo en unos segundos.</span></div>';
            setApplicationsStatus(
                error?.message || "No se pudieron cargar tus candidaturas."
            );
        }
    }

    function subscribeToApplicationUpdates() {
        if (!supabase || !currentUser || applicationsChannel) return;

        applicationsChannel = supabase
            .channel(`job-applications-${currentUser.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "job_applications",
                    filter: `user_id=eq.${currentUser.id}`
                },
                () => loadMyApplications({ silent: true })
            )
            .subscribe((status) => {
                if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                    console.warn(
                        "[Mi cuenta] No se pudo activar el seguimiento en tiempo real. Puedes usar «Actualizar»."
                    );
                }
            });
    }

    jobCv?.addEventListener("change", () => {
        const file = jobCv.files?.[0];
        const error = validateJobCv(file);
        if (error) {
            jobCvName.textContent = error;
            jobCvName.classList.add("is-error");
            jobCv.value = "";
            return;
        }
        jobCvName.classList.remove("is-error");
        jobCvName.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
        clearJobStatus();
    });

    jobForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (jobForm.dataset.submitting === "true") return;
        clearJobStatus();

        const file = jobCv.files?.[0];
        const fileError = validateJobCv(file);
        if (!jobForm.checkValidity() || fileError || !jobConsent.checked) {
            jobForm.classList.add("was-validated");
            setJobStatus(fileError || "Revisa los campos obligatorios y acepta el tratamiento de datos.");
            return;
        }

        jobForm.dataset.submitting = "true";
        const original = jobSubmit.innerHTML;
        jobSubmit.disabled = true;
        jobSubmit.innerHTML = '<span>Enviando…</span><i class="bi bi-arrow-repeat spin"></i>';

        try {
            if (jobForm.dataset.personalDataReady !== "true") {
                const missing = jobForm.dataset.personalDataMissing || "tus datos personales";
                throw new Error(`Completa ${missing} en «Datos personales» antes de enviar una candidatura.`);
            }

            await jobsApi.createApplication({
                position: jobPosition.value,
                message: jobMessage.value,
                cvFile: file
            });

            jobPosition.value = "";
            jobMessage.value = "";
            jobCv.value = "";
            jobConsent.checked = false;
            jobCvName.textContent = "Ningún archivo seleccionado";
            jobCvName.classList.remove("is-error");
            jobForm.classList.remove("was-validated");
            setJobStatus("Tu candidatura se ha enviado correctamente. Puedes consultar su estado en esta misma sección.", "success");
            await loadMyApplications();
        } catch (error) {
            console.error("[Mi cuenta] Envío de candidatura", error);
            setJobStatus(error?.message || "No se pudo enviar la candidatura. Inténtalo de nuevo.");
        } finally {
            jobForm.dataset.submitting = "false";
            jobSubmit.disabled = false;
            jobSubmit.innerHTML = original;
        }
    });

    applicationsRefresh?.addEventListener("click", loadMyApplications);

    /* =====================================================
       CERRAR SESIÓN
       ===================================================== */

    async function logout() {
        try {
            if (applicationsChannel) {
                await supabase?.removeChannel(applicationsChannel);
                applicationsChannel = null;
            }
            if (notificationsChannel) {
                await supabase?.removeChannel(notificationsChannel);
                notificationsChannel = null;
            }

            await auth.logout();
            window.location.replace("index.html");
        } catch (error) {
            console.error(
                "[Mi cuenta] Error al cerrar sesión:",
                error
            );

            alert(
                "No se pudo cerrar la sesión. Inténtalo de nuevo."
            );
        }
    }

    logoutButton?.addEventListener("click", logout);
    dropdownLogout?.addEventListener("click", logout);
    window.addEventListener("cafe:load-jobs", loadMyApplications);
    window.addEventListener("cafe:load-notifications", loadNotifications);

    init();
})();

/* =========================================================
   NAVEGACIÓN INTERNA + NAVBAR DEL ÁREA DE CUENTA
   ========================================================= */

(function () {
    "use strict";

    const navItems =
        document.querySelectorAll("[data-account-panel]");

    const panels =
        document.querySelectorAll("[data-account-content]");

    const userTrigger =
        document.getElementById("account-user-trigger");

    const userDropdown =
        document.getElementById("account-user-dropdown");

    const dropdownProfileLink =
        document.querySelector('[data-account-dropdown-link="profile"]');

    const accountNavbarJobLinks =
        document.querySelectorAll('[data-account-navbar-link="jobs"]');

    const mobileToggle =
        document.getElementById("account-mobile-toggle");

    const mobileMenu =
        document.getElementById("account-mobile-menu");

    function activatePanel(panelName) {
        navItems.forEach((item) => {
            const active =
                item.dataset.accountPanel === panelName;

            item.classList.toggle("active", active);
            item.setAttribute(
                "aria-selected",
                String(active)
            );
        });

        panels.forEach((panel) => {
            const active =
                panel.dataset.accountContent === panelName;

            panel.classList.toggle("active", active);
            panel.hidden = !active;
        });
    }

    navItems.forEach((item) => {
        item.addEventListener("click", () => {
            if (item.disabled) return;

            const panel =
                item.dataset.accountPanel;

            activatePanel(panel);

            window.history.replaceState(
                null,
                "",
                `#${panel}`
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    });

    function activateAndNavigate(panelName) {
        activatePanel(panelName);
        window.history.replaceState(null, "", `#${panelName}`);
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (panelName === "jobs") {
            window.dispatchEvent(new CustomEvent("cafe:load-jobs"));
        }
    }

    dropdownProfileLink?.addEventListener("click", (event) => {
        event.preventDefault();

        activatePanel("profile");

        window.history.replaceState(
            null,
            "",
            "#profile"
        );

        closeUserDropdown();
    });

    function openUserDropdown() {
        if (!userDropdown || !userTrigger) return;

        userDropdown.hidden = false;
        userTrigger.setAttribute(
            "aria-expanded",
            "true"
        );
    }

    function closeUserDropdown() {
        if (!userDropdown || !userTrigger) return;

        userDropdown.hidden = true;
        userTrigger.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    userTrigger?.addEventListener("click", (event) => {
        event.stopPropagation();

        if (userDropdown?.hidden) {
            openUserDropdown();
        } else {
            closeUserDropdown();
        }
    });

    document.addEventListener("click", (event) => {
        if (
            userDropdown &&
            !userDropdown.hidden &&
            !event.target.closest(".account-user-menu")
        ) {
            closeUserDropdown();
        }
    });

    mobileToggle?.addEventListener("click", () => {
        if (!mobileMenu) return;

        const open = mobileMenu.hidden;

        mobileMenu.hidden = !open;

        mobileToggle.setAttribute(
            "aria-expanded",
            String(open)
        );

        mobileToggle.innerHTML = open
            ? '<i class="bi bi-x-lg"></i>'
            : '<i class="bi bi-list"></i>';
    });

    accountNavbarJobLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            activateAndNavigate("jobs");
            closeUserDropdown();
            mobileMenu?.setAttribute("hidden", "");
        });
    });

    navItems.forEach((item) => {
        item.addEventListener("click", () => {
            if (item.dataset.accountPanel === "jobs") {
                window.dispatchEvent(new CustomEvent("cafe:load-jobs"));
            }
            if (item.dataset.accountPanel === "notifications") {
                window.dispatchEvent(new CustomEvent("cafe:load-notifications"));
            }
            if (["orders", "payments", "addresses"].includes(item.dataset.accountPanel)) {
                window.dispatchEvent(new CustomEvent(`cafe:load-${item.dataset.accountPanel}`));
            }
        });
    });

    mobileMenu?.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            mobileMenu.hidden = true;

            mobileToggle?.setAttribute(
                "aria-expanded",
                "false"
            );

            if (mobileToggle) {
                mobileToggle.innerHTML =
                    '<i class="bi bi-list"></i>';
            }
        });
    });

    const initialPanel = ["profile", "password", "jobs", "orders", "payments", "addresses", "notifications", "preferences"].includes(window.location.hash.slice(1))
        ? window.location.hash.slice(1)
        : "profile";

    activatePanel(initialPanel);
    if (initialPanel === "jobs") window.dispatchEvent(new CustomEvent("cafe:load-jobs"));
    if (initialPanel === "notifications") window.dispatchEvent(new CustomEvent("cafe:load-notifications"));
    if (["orders", "payments", "addresses"].includes(initialPanel)) window.dispatchEvent(new CustomEvent(`cafe:load-${initialPanel}`));
})();


/* =========================================================
   PREFERENCIAS DE PANTALLA — MODO OSCURO
   ========================================================= */
(function () {
    "use strict";

    const STORAGE_KEY = "cafe-el-caracol-theme";
    const root = document.documentElement;
    const toggle = document.getElementById("account-theme-toggle");
    const icon = document.getElementById("theme-preference-icon");

    if (!toggle) return;

    function isDark() {
        return root.classList.contains("account-dark");
    }

    function render() {
        const dark = isDark();
        toggle.setAttribute("aria-checked", String(dark));
        toggle.setAttribute("aria-label", dark ? "Desactivar modo oscuro" : "Activar modo oscuro");
        if (icon) {
            icon.className = dark ? "bi bi-sun" : "bi bi-moon-stars";
        }
    }

    function setTheme(dark) {
        root.classList.toggle("account-dark", dark);
        try {
            localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
        } catch (_) {}
        render();
    }

    toggle.addEventListener("click", () => setTheme(!isDark()));
    render();
})();
