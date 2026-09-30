/* Café Paraíso — buzón de notificaciones del usuario */
(function () {
    "use strict";

    const supabase = window.CafeAppSupabase;

    function requireClient() {
        if (!supabase) throw new Error("Supabase no está configurado.");
        return supabase;
    }

    async function getMyNotifications({ unreadOnly = false } = {}) {
        const client = requireClient();
        let query = client
            .from("notifications")
            .select("id, title, message, type, application_id, created_at, read_at")
            .order("created_at", { ascending: false })
            .limit(100);

        if (unreadOnly) query = query.is("read_at", null);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    async function getUnreadCount() {
        const client = requireClient();
        const { count, error } = await client
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .is("read_at", null);
        if (error) throw error;
        return Number(count || 0);
    }

    async function markAsRead(notificationId) {
        const client = requireClient();
        const { error } = await client
            .from("notifications")
            .update({ read_at: new Date().toISOString() })
            .eq("id", notificationId);
        if (error) throw error;
    }

    async function markAllAsRead() {
        const client = requireClient();
        const { error } = await client
            .from("notifications")
            .update({ read_at: new Date().toISOString() })
            .is("read_at", null);
        if (error) throw error;
    }

    async function deleteNotification(notificationId) {
        const client = requireClient();
        const { error } = await client
            .from("notifications")
            .delete()
            .eq("id", notificationId);
        if (error) throw error;
    }

    async function deleteAllNotifications() {
        const client = requireClient();
        const { error } = await client
            .from("notifications")
            .delete()
            .not("id", "is", null);
        if (error) throw error;
    }

    window.CafeAppNotifications = {
        getMyNotifications,
        getUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
    };
})();
