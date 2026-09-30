(function () {
    "use strict";
    const admin = window.CafeAppAdmin;
    const $ = id => document.getElementById(id);
    let currentMessage = null;

    (async function init() {
        const user = await admin.requireAdmin();
        if (!user) return;
        $("admin-email").textContent = user.email || "Administrador";
        $("admin-logout").addEventListener("click", admin.logout);
        $("refresh-messages").addEventListener("click", load);
        $("message-status").addEventListener("change", load);
        let searchTimer;
        $("message-search").addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(load, 250); });
        $("close-message").addEventListener("click", closeModal);
        $("message-modal").addEventListener("click", e => { if (e.target === $("message-modal")) closeModal(); });
        $("modal-read").addEventListener("click", async () => { if (currentMessage) await changeStatus(currentMessage.id, "read", true); });
        $("modal-archive").addEventListener("click", async () => { if (currentMessage) await changeStatus(currentMessage.id, "archived", true); });
        await Promise.all([loadStats(), load()]);
    })();

    async function loadStats() {
        try {
            const stats = await admin.getMessageStats();
            $("stat-total").textContent = stats.total;
            $("stat-unread").textContent = stats.unread;
            $("stat-read").textContent = stats.read;
            $("stat-archived").textContent = stats.archived;
        } catch (error) { console.error("[Admin mensajes stats]", error); }
    }

    async function load() {
        const tbody = $("messages-list");
        tbody.innerHTML = '<tr><td colspan="6" class="admin-empty">Cargando…</td></tr>';
        try {
            const messages = await admin.getMessages({ status: $("message-status").value, search: $("message-search").value });
            tbody.innerHTML = messages.map(messageRow).join("") || '<tr><td colspan="6" class="admin-empty">No hay mensajes.</td></tr>';
            tbody.querySelectorAll("[data-view]").forEach(btn => btn.addEventListener("click", () => openMessage(messages.find(m => m.id === btn.dataset.view))));
            tbody.querySelectorAll("[data-read]").forEach(btn => btn.addEventListener("click", () => changeStatus(btn.dataset.read, "read")));
            tbody.querySelectorAll("[data-archive]").forEach(btn => btn.addEventListener("click", () => changeStatus(btn.dataset.archive, "archived")));
            tbody.querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", () => removeMessage(btn.dataset.delete)));
        } catch (error) {
            console.error("[Admin mensajes]", error);
            tbody.innerHTML = '<tr><td colspan="6" class="admin-empty admin-danger">No se pudieron cargar los mensajes.</td></tr>';
        }
    }

    function messageRow(m) {
        return `<tr class="${m.status === "unread" ? "message-row-unread" : ""}">
            <td><div class="message-sender"><strong>${escapeHtml(m.name)}</strong><small>${escapeHtml(m.email)}</small></div></td>
            <td>${escapeHtml(subjectLabel(m.subject))}</td>
            <td><div class="message-preview">${escapeHtml(m.message)}</div></td>
            <td><span class="message-status ${escapeHtml(m.status)}">${escapeHtml(statusLabel(m.status))}</span></td>
            <td>${formatDate(m.created_at)}</td>
            <td><div class="message-actions"><button type="button" data-view="${m.id}" title="Ver"><i class="bi bi-eye"></i></button>${m.status === "unread" ? `<button type="button" data-read="${m.id}" title="Marcar leído"><i class="bi bi-check2"></i></button>` : ""}${m.status !== "archived" ? `<button type="button" data-archive="${m.id}" title="Archivar"><i class="bi bi-archive"></i></button>` : ""}<button class="danger" type="button" data-delete="${m.id}" title="Eliminar"><i class="bi bi-trash"></i></button></div></td>
        </tr>`;
    }

    function openMessage(message) {
        if (!message) return;
        currentMessage = message;
        $("message-modal-title").textContent = message.name || "Mensaje";
        $("message-detail").innerHTML = `<div class="message-meta"><div><strong>Correo</strong><a href="mailto:${encodeURIComponent(message.email)}">${escapeHtml(message.email)}</a></div><div><strong>Teléfono</strong>${message.phone ? `<a href="tel:${escapeHtml(message.phone)}">${escapeHtml(message.phone)}</a>` : "—"}</div><div><strong>Motivo</strong>${escapeHtml(subjectLabel(message.subject))}</div><div><strong>Fecha</strong>${formatDate(message.created_at)}</div></div><p class="message-content">${escapeHtml(message.message)}</p>`;
        $("message-modal").hidden = false;
        if (message.status === "unread") changeStatus(message.id, "read");
    }

    function closeModal() { $("message-modal").hidden = true; currentMessage = null; }

    async function changeStatus(id, status, closeAfter = false) {
        try { await admin.setMessageStatus(id, status); await Promise.all([loadStats(), load()]); if (closeAfter) closeModal(); }
        catch (error) { console.error(error); showStatus("No se pudo actualizar el mensaje.", true); }
    }

    async function removeMessage(id) {
        if (!confirm("¿Eliminar este mensaje definitivamente?")) return;
        try { await admin.deleteMessage(id); await Promise.all([loadStats(), load()]); if (currentMessage?.id === id) closeModal(); }
        catch (error) { console.error(error); showStatus("No se pudo eliminar el mensaje.", true); }
    }

    function showStatus(text, error = false) { const el = $("messages-status"); el.textContent = text; el.className = `admin-status ${error ? "error" : "success"}`; setTimeout(() => { el.className = "admin-status d-none"; }, 3500); }
    function subjectLabel(value) { return ({ informacion:"Información general", productos:"Productos", distribucion:"Distribución", empleo:"Empleo", otros:"Otros" })[value] || value; }
    function statusLabel(value) { return ({ unread:"Sin leer", read:"Leído", archived:"Archivado" })[value] || value; }
    function formatDate(value) { return value ? new Intl.DateTimeFormat("es-ES", { dateStyle:"medium", timeStyle:"short" }).format(new Date(value)) : "—"; }
    function escapeHtml(value) { return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
})();
