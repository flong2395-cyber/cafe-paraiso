/* Café Paraíso — mensajes de contacto */
(function () {
    "use strict";

    function getClient() {
        if (!window.CafeAppSupabase) throw new Error("Supabase no está configurado.");
        return window.CafeAppSupabase;
    }

    async function createMessage({ name, email, phone, subject, message }) {
        const supabase = getClient();
        return supabase.from("contact_messages").insert({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone?.trim() || null,
            subject,
            message: message.trim(),
        });
    }

    window.CafeAppMessages = { createMessage };
})();
