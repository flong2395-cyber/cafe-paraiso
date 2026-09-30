/* =========================================================
   MI CUENTA — COMPRAS, PAGOS Y DIRECCIONES
   ========================================================= */
(function () {
    "use strict";

    const supabase = window.CafeAppSupabase;
    const auth = window.CafeAppAuth;
    const commerce = window.CafeAppOrders;
    const cart = window.CafeAppCart;

    const ordersList = document.getElementById("account-orders-list");
    const ordersStatus = document.getElementById("account-orders-status");
    const paymentOptions = document.getElementById("account-payment-options");
    const paymentStatus = document.getElementById("account-payment-status");
    const addressList = document.getElementById("account-address-list");
    const addressStatus = document.getElementById("account-address-status");
    const addressForm = document.getElementById("account-address-form");
    const addressNew = document.getElementById("account-address-new");
    const addressCancel = document.getElementById("account-address-cancel");
    let loadedOrders = [];

    function escapeHtml(value) {
        return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
    }

    function money(value) {
        return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value || 0));
    }

    function date(value) {
        return value ? new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "";
    }

    async function refreshAccountCartBadge() {
        const badge = document.querySelector(".account-cart-badge");
        if (!badge || !cart) return;
        try {
            const count = await cart.getCount();
            badge.textContent = count > 99 ? "99+" : String(count);
            badge.classList.toggle("d-none", count <= 0);
        } catch (_) {}
    }

    window.addEventListener("cafe:cart-updated", refreshAccountCartBadge);

    function setStatus(element, message, type = "error") {
        if (!element) return;
        element.textContent = message;
        element.className = `account-status ${type === "success" ? "account-status-success" : "account-status-error"}`;
    }

    function clearStatus(element) {
        if (!element) return;
        element.textContent = "";
        element.className = "account-status d-none";
    }

    async function loadOrders() {
        if (!ordersList || !commerce) return;
        ordersList.innerHTML = '<div class="account-applications-empty"><i class="bi bi-arrow-repeat spin"></i><span>Cargando pedidos…</span></div>';
        clearStatus(ordersStatus);
        try {
            const orders = await commerce.getOrders();
            loadedOrders = orders;
            if (!orders.length) {
                ordersList.innerHTML = `<div class="commerce-account-empty"><i class="bi bi-bag"></i><strong>Aún no tienes compras.</strong><span>Cuando realices tu primer pedido aparecerá aquí.</span><a href="productos.html">Ver productos</a></div>`;
                return;
            }

            ordersList.innerHTML = orders.map(order => `
                <article class="commerce-order-card">
                    <div class="commerce-order-top">
                        <div><span>Pedido #${escapeHtml(order.order_number)}</span><strong>${escapeHtml(date(order.created_at))}</strong></div>
                        <span class="commerce-order-status status-${escapeHtml(order.status)}">${escapeHtml(commerce.statusLabel(order.status))}</span>
                    </div>
                    <div class="commerce-order-products">
                        ${(order.order_items || []).map(item => `<div><span>${Number(item.quantity)} × ${escapeHtml(item.product_name)}</span><strong>${money(item.line_total)}</strong></div>`).join("")}
                    </div>
                    <div class="commerce-order-bottom">
                        <div><small>Pago</small><strong>${escapeHtml(commerce.paymentLabel(order.payment_method))}</strong></div>
                        <div><small>Total</small><strong>${money(order.total)}</strong></div>
                    </div>
                    <div class="commerce-order-address"><i class="bi bi-geo-alt"></i><span>${escapeHtml(order.address_line)}, ${escapeHtml(order.postal_code)} ${escapeHtml(order.city)} · ${escapeHtml(order.province)}</span></div>
                    <div class="commerce-order-actions">
                        <button type="button" class="account-icon-button" data-print-order="${escapeHtml(order.id)}"><i class="bi bi-printer"></i> Imprimir factura</button>
                        ${["pending", "confirmed"].includes(order.status) ? `<button type="button" class="account-icon-button account-order-cancel-button" data-cancel-order="${escapeHtml(order.id)}"><i class="bi bi-x-circle"></i> Cancelar pedido</button>` : ""}
                    </div>
                </article>`).join("");
        } catch (error) {
            console.error("[Mi cuenta compras]", error);
            ordersList.innerHTML = "";
            setStatus(ordersStatus, error?.message || "No se pudieron cargar tus compras.");
        }
    }

    async function loadPaymentPreference() {
        if (!paymentOptions) return;
        clearStatus(paymentStatus);
        try {
            const user = await auth.getCurrentUser();
            if (!user) return;
            const { data, error } = await supabase.from("profiles").select("default_payment_method").eq("id", user.id).maybeSingle();
            if (error) throw error;
            const current = data?.default_payment_method || "";

            paymentOptions.innerHTML = Object.entries(commerce.PAYMENT_METHODS).map(([key, method]) => `
                <label class="account-payment-option ${current === key ? "selected" : ""}">
                    <input type="radio" name="account-default-payment" value="${key}" ${current === key ? "checked" : ""}>
                    <span class="account-payment-option-icon"><i class="bi bi-${method.icon}"></i></span>
                    <span><strong>${escapeHtml(method.label)}</strong><small>${key === "cash" ? "Pago en efectivo cuando se entregue el pedido." : "Disponible al finalizar un pedido."}</small></span>
                </label>`).join("");

            paymentOptions.querySelectorAll("input[name=account-default-payment]").forEach(input => {
                input.addEventListener("change", async () => {
                    try {
                        const { error: updateError } = await supabase.from("profiles").update({ default_payment_method: input.value }).eq("id", user.id);
                        if (updateError) throw updateError;
                        paymentOptions.querySelectorAll(".account-payment-option").forEach(el => el.classList.toggle("selected", el.querySelector("input") === input));
                        setStatus(paymentStatus, "Método de pago preferido actualizado.", "success");
                    } catch (error) {
                        console.error("[Mi cuenta pagos]", error);
                        setStatus(paymentStatus, error?.message || "No se pudo guardar el método de pago.");
                    }
                });
            });
        } catch (error) {
            console.error("[Mi cuenta pagos]", error);
            setStatus(paymentStatus, error?.message || "No se pudieron cargar los métodos de pago.");
        }
    }

    function resetAddressForm() {
        addressForm?.reset();
        document.getElementById("account-address-id").value = "";
        document.getElementById("account-address-form-title").textContent = "Nueva dirección";
        addressForm?.classList.add("d-none");
    }

    function fillAddressForm(address) {
        document.getElementById("account-address-id").value = address.id || "";
        document.getElementById("account-address-form-title").textContent = address.id ? "Editar dirección" : "Nueva dirección";
        document.getElementById("address-label").value = address.label || "";
        document.getElementById("address-recipient").value = address.recipient_name || "";
        document.getElementById("address-phone").value = address.phone || "";
        document.getElementById("address-line").value = address.address_line || "";
        document.getElementById("address-postal").value = address.postal_code || "";
        document.getElementById("address-city").value = address.city || "";
        document.getElementById("address-province").value = address.province || "";
        document.getElementById("address-notes").value = address.notes || "";
        document.getElementById("address-default").checked = Boolean(address.is_default);
        addressForm?.classList.remove("d-none");
        addressForm?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    async function loadAddresses() {
        if (!addressList || !commerce) return;
        addressList.innerHTML = '<div class="account-applications-empty"><i class="bi bi-arrow-repeat spin"></i><span>Cargando direcciones…</span></div>';
        clearStatus(addressStatus);
        try {
            const addresses = await commerce.getAddresses();
            if (!addresses.length) {
                addressList.innerHTML = `<div class="commerce-account-empty"><i class="bi bi-geo-alt"></i><strong>No tienes direcciones guardadas.</strong><span>Añade una para poder finalizar tus pedidos.</span></div>`;
                return;
            }
            addressList.innerHTML = addresses.map(address => `
                <article class="account-address-card ${address.is_default ? "is-default" : ""}">
                    <div class="account-address-card-icon"><i class="bi bi-geo-alt"></i></div>
                    <div class="account-address-card-copy"><div><strong>${escapeHtml(address.label)}</strong>${address.is_default ? '<span class="account-address-default-pill">Principal</span>' : ""}</div><span>${escapeHtml(address.recipient_name)} · ${escapeHtml(address.phone)}</span><span>${escapeHtml(address.address_line)}</span><span>${escapeHtml(address.postal_code)} ${escapeHtml(address.city)} · ${escapeHtml(address.province)}</span></div>
                    <div class="account-address-card-actions"><button type="button" data-edit-address="${escapeHtml(address.id)}"><i class="bi bi-pencil"></i> Editar</button>${address.is_default ? "" : `<button type="button" data-default-address="${escapeHtml(address.id)}">Principal</button>`}<button type="button" class="danger" data-delete-address="${escapeHtml(address.id)}"><i class="bi bi-trash3"></i></button></div>
                </article>`).join("");

            addressList.querySelectorAll("[data-edit-address]").forEach(button => button.addEventListener("click", () => {
                const address = addresses.find(item => item.id === button.dataset.editAddress);
                if (address) fillAddressForm(address);
            }));
            addressList.querySelectorAll("[data-default-address]").forEach(button => button.addEventListener("click", async () => {
                try { await commerce.setDefaultAddress(button.dataset.defaultAddress); await loadAddresses(); setStatus(addressStatus, "Dirección principal actualizada.", "success"); }
                catch (error) { setStatus(addressStatus, error?.message || "No se pudo actualizar la dirección."); }
            }));
            addressList.querySelectorAll("[data-delete-address]").forEach(button => button.addEventListener("click", async () => {
                if (!confirm("¿Quieres eliminar esta dirección?")) return;
                try { await commerce.deleteAddress(button.dataset.deleteAddress); await loadAddresses(); setStatus(addressStatus, "Dirección eliminada.", "success"); }
                catch (error) { setStatus(addressStatus, error?.message || "No se pudo eliminar la dirección."); }
            }));
        } catch (error) {
            console.error("[Mi cuenta direcciones]", error);
            setStatus(addressStatus, error?.message || "No se pudieron cargar las direcciones.");
        }
    }

    addressNew?.addEventListener("click", () => { resetAddressForm(); addressForm?.classList.remove("d-none"); document.getElementById("address-label").focus(); });
    addressCancel?.addEventListener("click", resetAddressForm);

    addressForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearStatus(addressStatus);
        const payload = {
            id: document.getElementById("account-address-id").value || null,
            label: document.getElementById("address-label").value,
            recipient_name: document.getElementById("address-recipient").value,
            phone: document.getElementById("address-phone").value,
            address_line: document.getElementById("address-line").value,
            postal_code: document.getElementById("address-postal").value,
            city: document.getElementById("address-city").value,
            province: document.getElementById("address-province").value,
            notes: document.getElementById("address-notes").value,
            is_default: document.getElementById("address-default").checked
        };
        const button = addressForm.querySelector("button[type=submit]");
        button.disabled = true;
        try {
            await commerce.saveAddress(payload);
            resetAddressForm();
            await loadAddresses();
            setStatus(addressStatus, "Dirección guardada correctamente.", "success");
        } catch (error) {
            console.error("[Mi cuenta dirección]", error);
            setStatus(addressStatus, error?.message || "No se pudo guardar la dirección.");
        } finally { button.disabled = false; }
    });

    ordersList?.addEventListener("click", async event => {
        const cancelButton = event.target.closest("[data-cancel-order]");
        if (cancelButton) {
            const id = cancelButton.dataset.cancelOrder;
            const order = loadedOrders.find(item => String(item.id) === String(id));
            if (!order) return;
            const confirmed = confirm(`¿Seguro que quieres cancelar el pedido #${order.order_number}?\n\nSi necesitas modificar productos, dirección o método de pago, puedes cancelar este pedido y realizar uno nuevo.`);
            if (!confirmed) return;
            cancelButton.disabled = true;
            try {
                await commerce.cancelMyOrder(id);
                setStatus(ordersStatus, `Pedido #${order.order_number} cancelado correctamente.`, "success");
                await loadOrders();
            } catch (error) {
                console.error("[Cancelar pedido]", error);
                setStatus(ordersStatus, error?.message || "No se pudo cancelar el pedido.");
                cancelButton.disabled = false;
            }
            return;
        }

        const button = event.target.closest("[data-print-order]");
        if (!button || !window.CafeAppInvoice) return;
        const id = button.dataset.printOrder;
        const order = loadedOrders.find(item => String(item.id) === String(id));
        if (order) {
            window.CafeAppInvoice.printOrder(order);
        } else {
            console.error("[Imprimir pedido] Pedido no encontrado en la lista cargada.");
        }
    });

    window.addEventListener("cafe:load-orders", loadOrders);
    window.addEventListener("cafe:load-payments", loadPaymentPreference);
    window.addEventListener("cafe:load-addresses", loadAddresses);

    document.addEventListener("DOMContentLoaded", async () => {
        try {
            const user = await auth.getCurrentUser();
            if (!user) return;
            await cart?.mergeLocalIntoAccount();
            await refreshAccountCartBadge();
        } catch (error) { console.warn("[Mi cuenta comercio] No se pudo sincronizar el carrito.", error); }

        const initial = window.location.hash.slice(1);
        if (initial === "orders") loadOrders();
        if (initial === "payments") loadPaymentPreference();
        if (initial === "addresses") loadAddresses();
    });
})();
