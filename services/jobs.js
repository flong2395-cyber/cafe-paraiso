/* Café Paraíso — candidaturas de empleo */
(function () {
    "use strict";

    const BUCKET = "job-applications";

    function getClient() {
        if (!window.CafeAppSupabase) {
            throw createJobsError("Supabase no está configurado.", "CONFIG");
        }
        return window.CafeAppSupabase;
    }

    function createJobsError(message, stage, original = null) {
        const error = new Error(message);
        error.stage = stage;
        error.original = original;
        error.code = original?.code || null;
        error.status = original?.status || null;
        return error;
    }

    function normalizeStorageError(error) {
        const code = error?.statusCode || error?.status || error?.code;
        const message = String(error?.message || "").toLowerCase();

        if (code === 401 || code === 403 || message.includes("row-level security")) {
            return createJobsError(
                "Supabase ha bloqueado la subida del currículum. Ejecuta el SQL de configuración de candidaturas para activar Storage y sus políticas.",
                "STORAGE_RLS",
                error
            );
        }

        if (code === 404 || message.includes("bucket") || message.includes("not found")) {
            return createJobsError(
                "El almacenamiento de currículums no está configurado. Crea o actualiza el bucket «job-applications» ejecutando el SQL de candidaturas.",
                "STORAGE_BUCKET",
                error
            );
        }

        if (message.includes("mime") || message.includes("type")) {
            return createJobsError(
                "El formato del currículum no está permitido. Usa PDF, DOC o DOCX.",
                "STORAGE_TYPE",
                error
            );
        }

        if (message.includes("size") || message.includes("large")) {
            return createJobsError(
                "El currículum supera el límite de 5 MB.",
                "STORAGE_SIZE",
                error
            );
        }

        return createJobsError(
            "No se pudo subir el currículum. Comprueba la configuración de Storage en Supabase e inténtalo de nuevo.",
            "STORAGE",
            error
        );
    }

    function normalizeDatabaseError(error) {
        if (error?.code === "42501" || error?.status === 403 || String(error?.message || "").toLowerCase().includes("rls")) {
            return createJobsError(
                "Supabase ha rechazado el registro de la candidatura. Ejecuta la migración final de candidaturas en Supabase y vuelve a intentarlo.",
                "DATABASE_RLS",
                error
            );
        }

        if (error?.code === "23514") {
            return createJobsError(
                "La candidatura contiene un dato que no cumple las reglas de Supabase. Revisa los campos y vuelve a intentarlo.",
                "DATABASE_VALIDATION",
                error
            );
        }

        if (error?.code === "42P01" || String(error?.message || "").includes("job_applications")) {
            return createJobsError(
                "La tabla de candidaturas no está instalada en Supabase. Ejecuta el SQL de candidaturas.",
                "DATABASE_TABLE",
                error
            );
        }

        return createJobsError(
            "La candidatura se ha subido, pero no se pudo registrar en la base de datos. Se ha intentado limpiar el archivo temporal.",
            "DATABASE",
            error
        );
    }

    async function createApplication({ position, message, cvFile }) {
        const supabase = getClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            throw createJobsError(
                "Debes iniciar sesión para enviar una candidatura.",
                "AUTH",
                userError
            );
        }

        // Nombre, correo y teléfono proceden exclusivamente del perfil
        // autenticado. El formulario de candidatura nunca los envía como
        // datos editables por el usuario.
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("full_name, email, phone")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) {
            throw createJobsError(
                "No se pudieron cargar tus datos personales. Actualízalos desde «Datos personales» e inténtalo de nuevo.",
                "PROFILE",
                profileError
            );
        }

        const name = String(profile?.full_name || "").trim();
        const email = String(user.email || profile?.email || "").trim().toLowerCase();
        const phone = String(profile?.phone || "").trim();

        if (!cvFile || !(cvFile instanceof File)) {
            throw createJobsError("Selecciona un currículum válido.", "CV_VALIDATION");
        }

        if (!position || !["produccion", "almacen", "administracion", "comercial", "reparto", "otro"].includes(position)) {
            throw createJobsError("Selecciona un puesto de interés válido.", "VALIDATION");
        }

        const cleanMessage = String(message || "").trim();
        if (cleanMessage.length < 10 || cleanMessage.length > 5000) {
            throw createJobsError("El mensaje debe tener entre 10 y 5000 caracteres.", "VALIDATION");
        }

        if (name.length < 2) {
            throw createJobsError("Completa tu nombre y apellidos en «Datos personales».", "PROFILE_VALIDATION");
        }
        if (!email) {
            throw createJobsError("Tu cuenta no tiene un correo electrónico válido.", "PROFILE_VALIDATION");
        }
        if (phone.length < 6) {
            throw createJobsError("Completa tu teléfono en «Datos personales».", "PROFILE_VALIDATION");
        }

        const applicationId = crypto.randomUUID();
        const extension = getExtension(cvFile.name);
        const storagePath = `${user.id}/${applicationId}/curriculum${extension}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, cvFile, {
                cacheControl: "3600",
                contentType: cvFile.type || "application/octet-stream",
                upsert: false,
            });

        if (uploadError) {
            throw normalizeStorageError(uploadError);
        }

        const { data, error } = await supabase.rpc("submit_job_application", {
            p_id: applicationId,
            p_name: name.trim(),
            p_email: email.trim().toLowerCase(),
            p_phone: phone.trim(),
            p_position: position,
            p_message: cleanMessage,
            p_cv_path: storagePath,
            p_cv_name: cvFile.name,
            p_cv_size: cvFile.size,
            p_cv_type: cvFile.type || null,
        });

        if (error) {
            await supabase.storage.from(BUCKET).remove([storagePath]);
            throw normalizeDatabaseError(error);
        }

        return { id: data };
    }

    function getExtension(filename) {
        const dot = filename.lastIndexOf(".");
        return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
    }

    async function getMyApplications() {
        const supabase = getClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            throw createJobsError(
                "Debes iniciar sesión para consultar tus candidaturas.",
                "AUTH",
                userError
            );
        }

        /*
         * Preferimos el RPC seguro para el seguimiento del usuario.
         * De esta forma la consulta queda limitada en el servidor a auth.uid()
         * y no depende de que el navegador tenga permisos de lectura globales.
         *
         * El fallback mantiene compatibilidad con instalaciones anteriores
         * que todavía no hayan ejecutado la función SQL de seguimiento.
         */
        const { data: rpcData, error: rpcError } = await supabase.rpc(
            "get_my_job_applications"
        );

        if (!rpcError) {
            return rpcData || [];
        }

        const rpcCode = rpcError?.code || "";
        const rpcMessage = String(rpcError?.message || "").toLowerCase();
        const rpcMissing =
            rpcCode === "PGRST202" ||
            rpcCode === "42883" ||
            rpcMessage.includes("get_my_job_applications") ||
            rpcMessage.includes("does not exist");

        if (!rpcMissing) {
            throw createJobsError(
                "No se pudieron consultar tus candidaturas. Comprueba la configuración de permisos en Supabase.",
                "DATABASE_RPC",
                rpcError
            );
        }

        const { data, error } = await supabase
            .from("job_applications")
            .select(
                "id, name, email, phone, position, message, cv_name, cv_size, cv_type, status, created_at, updated_at"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            throw createJobsError(
                "No se pudieron consultar tus candidaturas. Comprueba la configuración de permisos en Supabase.",
                "DATABASE_SELECT",
                error
            );
        }

        return data || [];
    }

    window.CafeAppJobs = { createApplication, getMyApplications };
})();
