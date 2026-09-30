/* =========================================================
   CAFÉ PARAÍSO — AUTENTICACIÓN
   ========================================================= */

(function () {
    "use strict";

    function getClient() {
        if (!window.CafeAppSupabase) {
            throw new Error(
                "Supabase no está configurado. Revisa services/config/supabase.js."
            );
        }

        return window.CafeAppSupabase;
    }

    function getRedirectUrl(pathname) {
        const appUrl = window.CafeAppConfig?.appUrl;
        if (!appUrl) {
            throw new Error("APP_URL no está configurada.");
        }
        return new URL(pathname, `${appUrl}/`).toString();
    }

    function getEmailRedirectUrl() {
        return getRedirectUrl("confirmacion.html");
    }

    let passwordRecoverySession = null;
    const passwordRecoveryListeners = new Set();

    getClient().auth.onAuthStateChange((event, session) => {
        if (event !== "PASSWORD_RECOVERY" || !session) return;
        passwordRecoverySession = session;
        for (const listener of passwordRecoveryListeners) listener(session);
    });

    async function register({ name, email, password }) {
        const supabase = getClient();
        const emailRedirectTo = getEmailRedirectUrl();

        const options = {
            data: {
                full_name: name,
            },
        };

        if (emailRedirectTo) {
            options.emailRedirectTo = emailRedirectTo;
        }

        return supabase.auth.signUp({
            email,
            password,
            options,
        });
    }

    async function login({ email, password }) {
        const supabase = getClient();

        return supabase.auth.signInWithPassword({
            email,
            password,
        });
    }

    async function requestPasswordReset(email) {
        const supabase = getClient();
        return supabase.auth.resetPasswordForEmail(email, {
            redirectTo: getRedirectUrl("reset-password.html"),
        });
    }

    function onPasswordRecovery(callback) {
        passwordRecoveryListeners.add(callback);
        if (passwordRecoverySession) {
            queueMicrotask(() => callback(passwordRecoverySession));
        }
        return () => passwordRecoveryListeners.delete(callback);
    }

    function waitForPasswordRecovery(timeout = 5000) {
        if (passwordRecoverySession) return Promise.resolve(passwordRecoverySession);

        return new Promise((resolve) => {
            let unsubscribe;
            const timer = window.setTimeout(() => {
                unsubscribe?.();
                resolve(null);
            }, timeout);

            unsubscribe = onPasswordRecovery((session) => {
                window.clearTimeout(timer);
                unsubscribe();
                resolve(session);
            });
        });
    }

    function hasPasswordRecoverySession() {
        return Boolean(passwordRecoverySession);
    }

    async function changeRecoveredPassword(password) {
        if (!passwordRecoverySession) {
            throw new Error("No existe un contexto válido de recuperación.");
        }

        const supabase = getClient();
        const { data, error: sessionError } = await supabase.auth.getSession();
        const activeSession = data?.session;

        if (
            sessionError ||
            !activeSession?.user ||
            activeSession.user.id !== passwordRecoverySession.user?.id
        ) {
            passwordRecoverySession = null;
            throw sessionError || new Error("La sesión de recuperación ya no es válida.");
        }

        const result = await supabase.auth.updateUser({ password });
        if (!result.error) passwordRecoverySession = null;
        return result;
    }

    async function logout() {
        const supabase = getClient();
        return supabase.auth.signOut();
    }

    async function changePassword(password) {
        const supabase = getClient();

        return supabase.auth.updateUser({
            password,
        });
    }

    async function getCurrentUser() {
        const supabase = getClient();
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            throw sessionError;
        }

        if (!sessionData?.session) {
            return null;
        }

        const { data, error } = await supabase.auth.getUser();

        if (error) {
            throw error;
        }

        return data.user;
    }

    async function getRole() {
        const supabase = getClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
            return null;
        }

        const { data, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", userData.user.id)
            .single();

        if (error) throw error;
        return data?.role || "user";
    }

    async function getSession() {
        const supabase = getClient();
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            throw error;
        }

        return data.session;
    }

    function onAuthStateChange(callback) {
        const supabase = getClient();
        return supabase.auth.onAuthStateChange(callback);
    }

    const ROLE_DESTINATIONS = Object.freeze({
        admin: "admin/index.html",
        rrhh: "rrhh/index.html",
        user: "index.html",
    });

    function getRoleDestination(role) {
        return ROLE_DESTINATIONS[role] || ROLE_DESTINATIONS.user;
    }

    window.CafeAppAuth = {
        register,
        login,
        requestPasswordReset,
        onPasswordRecovery,
        waitForPasswordRecovery,
        hasPasswordRecoverySession,
        changeRecoveredPassword,
        logout,
        changePassword,
        getCurrentUser,
        getRole,
        getRoleDestination,
        getRedirectUrl,
        getSession,
        onAuthStateChange,
    };
})();
