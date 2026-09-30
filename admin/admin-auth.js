/* Café Paraíso — autorización del panel administrativo */
(function () {
    "use strict";

    const supabase = window.CafeAppSupabase;

    async function requireAdmin() {
        if (!supabase) {
            throw new Error("Supabase no está configurado.");
        }

        const { data, error } = await supabase.auth.getUser();

        if (error || !data?.user) {
            window.location.replace("../login.html");
            return null;
        }

        const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin");

        if (roleError || isAdmin !== true) {
            window.location.replace("../index.html");
            return null;
        }

        return data.user;
    }

    async function requireHR() {
        if (!supabase) {
            throw new Error("Supabase no está configurado.");
        }

        const { data, error } = await supabase.auth.getUser();

        if (error || !data?.user) {
            window.location.replace("../login.html");
            return null;
        }

        const { data: role, error: roleError } = await supabase.rpc("get_my_role");

        // Administración puede consultar RRHH, pero un usuario normal no.
        if (roleError || !["rrhh", "admin"].includes(role)) {
            window.location.replace("../index.html");
            return null;
        }

        return data.user;
    }

    async function getUsers() {
        const { data, error } = await supabase
            .from("profiles")
            .select("id, full_name, email, phone, role, created_at, updated_at")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async function setUserRole(userId, role) {
        const { data, error } = await supabase.rpc("set_user_role", {
            target_user_id: userId,
            new_role: role,
        });

        if (error) throw error;
        return data;
    }

    async function getMessages({ status = "all", search = "" } = {}) {
        let query = supabase
            .from("contact_messages")
            .select("id, name, email, phone, subject, message, status, created_at, updated_at")
            .order("created_at", { ascending: false });

        if (status !== "all") query = query.eq("status", status);
        if (search.trim()) {
            const term = search.trim().replace(/[%_]/g, "\\$&");
            query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,message.ilike.%${term}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    async function getMessageStats() {
        const { data, error } = await supabase
            .from("contact_messages")
            .select("id, status");
        if (error) throw error;
        const messages = data || [];
        return {
            total: messages.length,
            unread: messages.filter(m => m.status === "unread").length,
            read: messages.filter(m => m.status === "read").length,
            archived: messages.filter(m => m.status === "archived").length,
        };
    }

    async function setMessageStatus(messageId, status) {
        const { error } = await supabase
            .from("contact_messages")
            .update({ status })
            .eq("id", messageId);
        if (error) throw error;
    }

    async function deleteMessage(messageId) {
        const { error } = await supabase
            .from("contact_messages")
            .delete()
            .eq("id", messageId);
        if (error) throw error;
    }

    async function getJobApplications({ status = "all", search = "" } = {}) {
        const { data, error } = await supabase.rpc("get_hr_job_applications", {
            p_status: status || "all",
            p_search: search || "",
        });

        if (error) throw error;
        return data || [];
    }

    async function getJobApplicationStats() {
        const { data, error } = await supabase.rpc("get_hr_job_application_stats");
        if (error) throw error;

        const stats = Array.isArray(data) ? data[0] : data;
        return {
            total: Number(stats?.total || 0),
            pending: Number(stats?.pending || 0),
            approved: Number(stats?.approved || 0),
            rejected: Number(stats?.rejected || 0),
            archived: Number(stats?.archived || 0),
        };
    }

    async function setJobApplicationStatus(applicationId, status) {
        const { data, error } = await supabase.rpc("set_job_application_status", {
            p_application_id: applicationId,
            p_status: status,
        });
        if (error) throw error;
        return data;
    }

    async function sendCandidateNotification(applicationId, message) {
        const cleanMessage = String(message || "").trim();
        if (cleanMessage.length < 2 || cleanMessage.length > 5000) {
            throw new Error("El mensaje debe tener entre 2 y 5000 caracteres.");
        }

        const { data, error } = await supabase.rpc("send_candidate_notification", {
            p_application_id: applicationId,
            p_message: cleanMessage,
        });
        if (error) throw error;
        return data;
    }

    async function createJobCvSignedUrl(path, expiresIn = 300) {
        const { data, error } = await supabase
            .storage
            .from("job-applications")
            .createSignedUrl(path, expiresIn);
        if (error) throw error;
        return data?.signedUrl || null;
    }

    async function deleteJobApplication(application) {
        if (application?.cv_path) {
            const { error: storageError } = await supabase
                .storage
                .from("job-applications")
                .remove([application.cv_path]);
            if (storageError) throw storageError;
        }

        const { error } = await supabase
            .from("job_applications")
            .delete()
            .eq("id", application.id);
        if (error) throw error;
    }

    async function logout() {
        await supabase.auth.signOut();
        window.location.replace("../login.html");
    }

    window.CafeAppAdmin = {
        requireAdmin,
        requireHR,
        getUsers,
        setUserRole,
        getMessages,
        getMessageStats,
        setMessageStatus,
        deleteMessage,
        getJobApplications,
        getJobApplicationStats,
        setJobApplicationStatus,
        sendCandidateNotification,
        createJobCvSignedUrl,
        deleteJobApplication,
        logout,
    };
})();
