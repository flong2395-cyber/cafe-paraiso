(function () {
    "use strict";

    const auth = window.CafeAppAuth;
    const cart = window.CafeAppCart;
    const orders = window.CafeAppOrders;
    const content = document.getElementById("checkout-content");
    const status = document.getElementById("checkout-status");
    let addresses = [];
    let items = [];
    let defaultPayment = "";

    function escapeHtml(value) {
        return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
    }

    function setStatus(message, type = "error") {
        status.textContent = message;
        status.className = `commerce-status ${type === "success" ? "commerce-status-success" : "commerce-status-error"}`;
    }

    async function init() {
        try {
            const user = await auth.getCurrentUser();
            if (!user) {
                window.location.replace("login.html?redirect=checkout.html");
                return;
            }

            await cart.mergeLocalIntoAccount();
            items = await cart.getCart();
            if (!items.length) {
                content.innerHTML = `<div class="commerce-empty"><i class="bi bi-cart3"></i><h2>Tu carrito está vacío</h2><p>Añade productos antes de finalizar el pedido.</p><a class="commerce-primary" href="productos.html">Ver productos</a></div>`;
                return;
            }

            addresses = await orders.getAddresses();
            const { data: profile, error: profileError } = await window.CafeAppSupabase
                .from("profiles")
                .select("default_payment_method")
                .eq("id", user.id)
                .maybeSingle();
            if (!profileError) defaultPayment = profile?.default_payment_method || "";
            render();
        } catch (error) {
            console.error("[Checkout]", error);
            setStatus(error?.message || "No se pudo preparar el pedido.");
        }
    }

    function render() {
        const subtotal = items.reduce((sum, item) => sum + Number(item.product.price) * Number(item.quantity), 0);
        const selectedAddress = addresses.find(a => a.is_default)?.id || addresses[0]?.id || "";

        content.innerHTML = `
            <form id="checkout-form" class="checkout-layout">
                <div class="checkout-main-card">
                    <section class="checkout-section-block">
                        <div class="checkout-heading"><span>1</span><div><h2>Dirección de entrega</h2><p>Usaremos estos datos para entregar tu pedido.</p></div></div>
                        ${addresses.length ? `
                            <div class="checkout-address-list">
                                ${addresses.map(address => `
                                    <label class="checkout-address-option">
                                        <input type="radio" name="address" value="${escapeHtml(address.id)}" ${address.id === selectedAddress ? "checked" : ""}>
                                        <span><strong>${escapeHtml(address.label)}</strong><small>${escapeHtml(address.recipient_name)} · ${escapeHtml(address.phone)}</small><small>${escapeHtml(address.address_line)}, ${escapeHtml(address.postal_code)} ${escapeHtml(address.city)} · ${escapeHtml(address.province)}</small></span>
                                    </label>`).join("")}
                            </div>` : `
                            <div class="checkout-no-address"><i class="bi bi-geo-alt"></i><strong>Aún no tienes una dirección guardada.</strong><span>Puedes crearla desde Mi cuenta → Direcciones.</span><a href="mi-cuenta.html#addresses">Gestionar direcciones</a></div>`}
                    </section>

                    <section class="checkout-section-block">
                        <div class="checkout-heading"><span>2</span><div><h2>Método de pago</h2><p>Elige cómo quieres pagar tu pedido.</p></div></div>
                        <div class="payment-options">
                            ${Object.entries(orders.PAYMENT_METHODS).map(([key, method], index) => `
                                <label class="payment-option">
                                    <input type="radio" name="payment" value="${key}" ${defaultPayment ? defaultPayment === key ? "checked" : "" : index === 0 ? "checked" : ""}>
                                    <span class="payment-option-icon"><i class="bi bi-${method.icon}"></i></span>
                                    <span><strong>${escapeHtml(method.label)}</strong><small>${key === "bank_transfer" ? "Recibirás los datos bancarios al confirmar." : key === "card" ? "Pago con tarjeta; quedará pendiente de confirmación." : key === "bizum" ? "Te indicaremos el número de teléfono para realizar el Bizum." : "Paga en efectivo cuando recibas el pedido."}</small></span>
                                </label>`).join("")}
                        </div>
                    </section>

                    <section class="checkout-section-block">
                        <div class="checkout-heading"><span>3</span><div><h2>Observaciones</h2><p>Opcional: indicaciones para preparar o entregar el pedido.</p></div></div>
                        <textarea id="checkout-notes" class="commerce-input" maxlength="1000" placeholder="Ej.: llamar al llegar, dejar en recepción…"></textarea>
                    </section>
                </div>

                <aside class="checkout-summary">
                    <span class="cart-summary-kicker">Resumen del pedido</span>
                    <div class="checkout-products-mini">${items.map(item => `<div><span>${Number(item.quantity)} × ${escapeHtml(item.product.name)}</span><strong>${cart.money(Number(item.product.price) * Number(item.quantity))}</strong></div>`).join("")}</div>
                    <div class="cart-summary-row"><span>Subtotal</span><strong>${cart.money(subtotal)}</strong></div>
                    <div class="cart-summary-row"><span>Entrega</span><strong>Gratis</strong></div>
                    <div class="cart-summary-total"><span>Total</span><strong>${cart.money(subtotal)}</strong></div>
                    <button type="submit" class="commerce-primary" ${addresses.length ? "" : "disabled"}><i class="bi bi-check2-circle"></i> Confirmar pedido</button>
                    <a class="commerce-secondary" href="carrito.html"><i class="bi bi-arrow-left"></i> Volver al carrito</a>
                </aside>
            </form>`;

        document.getElementById("checkout-form")?.addEventListener("submit", submit);
    }

    async function submit(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const addressId = form.querySelector("input[name=address]:checked")?.value;
        const paymentMethod = form.querySelector("input[name=payment]:checked")?.value;
        const notes = document.getElementById("checkout-notes")?.value.trim() || "";
        const button = form.querySelector("button[type=submit]");

        if (!addressId) return setStatus("Selecciona una dirección de entrega.");
        if (!paymentMethod) return setStatus("Selecciona un método de pago.");

        button.disabled = true;
        button.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Creando pedido…';

        try {
            const order = await orders.createOrder({ addressId, paymentMethod, notes });
            content.innerHTML = `
                <div class="order-success">
                    <div class="order-success-icon"><i class="bi bi-check2"></i></div>
                    <span class="caracol-section-badge">Pedido confirmado</span>
                    <h2>¡Gracias por tu compra!</h2>
                    <p>Tu pedido <strong>#${escapeHtml(order.order_number)}</strong> ha sido registrado correctamente.</p>
                    <p class="order-success-payment">Método de pago: <strong>${escapeHtml(orders.paymentLabel(paymentMethod))}</strong></p>
                    <div class="order-success-actions"><a class="commerce-primary" href="mi-cuenta.html#orders">Ver mis compras</a><a class="commerce-secondary" href="productos.html">Seguir comprando</a></div>
                </div>`;
            window.dispatchEvent(new CustomEvent("cafe:cart-updated"));
        } catch (error) {
            console.error("[Checkout] Crear pedido", error);
            setStatus(error?.message || "No se pudo crear el pedido. Comprueba tu carrito e inténtalo de nuevo.");
            button.disabled = false;
            button.innerHTML = '<i class="bi bi-check2-circle"></i> Confirmar pedido';
        }
    }

    document.addEventListener("DOMContentLoaded", init);
})();
