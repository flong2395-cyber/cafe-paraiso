(function () {
    "use strict";

    const cart = window.CafeAppCart;
    const content = document.getElementById("cart-content");
    const status = document.getElementById("cart-status");

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function setStatus(message, type = "error") {
        status.textContent = message;
        status.className = `commerce-status ${type === "success" ? "commerce-status-success" : "commerce-status-error"}`;
    }

    function clearStatus() {
        status.textContent = "";
        status.className = "commerce-status d-none";
    }

    function imageFor(item) {
        return item.product.image_url || "assets/img/products/cafes.webp";
    }

    function render(items) {
        clearStatus();
        if (!items.length) {
            content.innerHTML = `
                <div class="commerce-empty">
                    <i class="bi bi-cart3"></i>
                    <h2>Tu carrito está vacío</h2>
                    <p>Añade productos desde nuestro catálogo para comenzar tu compra.</p>
                    <a class="commerce-primary" href="productos.html"><i class="bi bi-bag"></i> Ver productos</a>
                </div>`;
            return;
        }

        const subtotal = items.reduce((sum, item) => sum + Number(item.product.price) * Number(item.quantity), 0);

        content.innerHTML = `
            <div class="cart-layout">
                <div class="cart-items-card">
                    <div class="cart-card-header">
                        <div><span>Productos</span><h2>${items.length} ${items.length === 1 ? "artículo" : "artículos"}</h2></div>
                        <button type="button" class="commerce-link-button" id="cart-clear"><i class="bi bi-trash3"></i> Vaciar carrito</button>
                    </div>
                    <div class="cart-items-list">
                        ${items.map(item => `
                            <article class="cart-item" data-product-id="${escapeHtml(item.product.id)}">
                                <img src="${escapeHtml(imageFor(item))}" alt="${escapeHtml(item.product.name)}">
                                <div class="cart-item-info">
                                    <span>${escapeHtml(item.product.product_categories?.name || "Producto")}</span>
                                    <h3>${escapeHtml(item.product.name)}</h3>
                                    <strong>${cart.money(item.product.price)}</strong>
                                </div>
                                <div class="cart-quantity">
                                    <button type="button" data-cart-decrease aria-label="Reducir cantidad"><i class="bi bi-dash"></i></button>
                                    <span>${Number(item.quantity)}</span>
                                    <button type="button" data-cart-increase aria-label="Aumentar cantidad"><i class="bi bi-plus"></i></button>
                                </div>
                                <strong class="cart-line-total">${cart.money(Number(item.product.price) * Number(item.quantity))}</strong>
                                <button type="button" class="cart-remove" data-cart-remove aria-label="Eliminar producto"><i class="bi bi-trash3"></i></button>
                            </article>`).join("")}
                    </div>
                </div>

                <aside class="cart-summary">
                    <span class="cart-summary-kicker">Resumen</span>
                    <h2>Tu pedido</h2>
                    <div class="cart-summary-row"><span>Subtotal</span><strong>${cart.money(subtotal)}</strong></div>
                    <div class="cart-summary-row"><span>Entrega</span><strong>Gratis</strong></div>
                    <div class="cart-summary-total"><span>Total</span><strong>${cart.money(subtotal)}</strong></div>
                    <a class="commerce-primary cart-checkout-button" href="checkout.html"><i class="bi bi-credit-card"></i> Continuar con el pedido</a>
                    <a class="commerce-secondary" href="productos.html"><i class="bi bi-arrow-left"></i> Seguir comprando</a>
                </aside>
            </div>`;

        content.querySelector("#cart-clear")?.addEventListener("click", async () => {
            if (!confirm("¿Quieres vaciar el carrito?")) return;
            await cart.clear();
            await load();
        });

        content.querySelectorAll(".cart-item").forEach(itemEl => {
            const id = itemEl.dataset.productId;
            const current = items.find(item => item.product.id === id)?.quantity || 1;
            itemEl.querySelector("[data-cart-decrease]")?.addEventListener("click", async () => { await cart.updateItem(id, current - 1); await load(); });
            itemEl.querySelector("[data-cart-increase]")?.addEventListener("click", async () => { await cart.updateItem(id, current + 1); await load(); });
            itemEl.querySelector("[data-cart-remove]")?.addEventListener("click", async () => { await cart.removeItem(id); await load(); });
        });
    }

    async function load() {
        content.innerHTML = '<div class="commerce-loading"><i class="bi bi-arrow-repeat spin"></i> Cargando carrito…</div>';
        try {
            const items = await cart.getCart();
            render(items);
        } catch (error) {
            console.error("[Carrito]", error);
            setStatus(error?.message || "No se pudo cargar el carrito.");
            content.innerHTML = "";
        }
    }

    window.addEventListener("cafe:cart-updated", load);
    document.addEventListener("DOMContentLoaded", load);
})();
