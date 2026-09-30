/* =========================================================
   CAFÉ PARAÍSO — IMPRESIÓN DE FACTURA / COMPROBANTE
   Imprime en la misma pestaña para evitar bloqueadores de ventanas.
   ========================================================= */
(function () {
    "use strict";

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>\"']/g, c => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
        }[c]));
    }

    function money(value) {
        return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value || 0));
    }

    function date(value) {
        return value ? new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeStyle: "short" }).format(new Date(value)) : "—";
    }

    function paymentLabel(method) {
        return ({
            bank_transfer: "Transferencia bancaria",
            card: "Tarjeta",
            bizum: "Bizum",
            cash: "Efectivo al recibir"
        })[method] || method || "—";
    }

    function statusLabel(status) {
        return ({
            pending: "Pendiente", confirmed: "Confirmado", preparing: "Preparando",
            ready: "Listo para entregar", out_for_delivery: "En reparto",
            delivered: "Entregado", cancelled: "Cancelado"
        })[status] || status || "—";
    }

    function paymentStatusLabel(status) {
        return ({ pending: "Pendiente", paid: "Pagado", failed: "Fallido", refunded: "Reembolsado" })[status] || status || "—";
    }

    function buildHtml(order) {
        const items = Array.isArray(order.order_items) ? order.order_items : [];
        const itemsHtml = items.map(item => `
            <tr>
                <td>${escapeHtml(item.product_name)}</td>
                <td class="center">${Number(item.quantity)}</td>
                <td class="right">${money(item.unit_price)}</td>
                <td class="right">${money(item.line_total)}</td>
            </tr>`).join("");

        return `
        <div class="invoice-sheet">
            <div class="invoice-head">
                <div><div class="invoice-brand">Café Paraíso</div><div class="invoice-muted">Comprobante de pedido</div></div>
                <div class="invoice-title"><h1>Pedido #${escapeHtml(order.order_number)}</h1><div>${escapeHtml(date(order.created_at))}</div></div>
            </div>
            <div class="invoice-meta">
                <div class="invoice-box"><h3>Cliente</h3><p><strong>${escapeHtml(order.recipient_name)}</strong></p><p>${escapeHtml(order.phone)}</p><p>${escapeHtml(order.address_line)}</p><p>${escapeHtml(order.postal_code)} ${escapeHtml(order.city)} · ${escapeHtml(order.province)}</p></div>
                <div class="invoice-box"><h3>Pedido y pago</h3><p>Estado: <span class="invoice-status ${order.status === "cancelled" ? "bad" : "ok"}">${escapeHtml(statusLabel(order.status))}</span></p><p>Método de pago: <strong>${escapeHtml(paymentLabel(order.payment_method))}</strong></p><p>Estado del pago: <strong>${escapeHtml(paymentStatusLabel(order.payment_status))}</strong></p></div>
            </div>
            <table><thead><tr><th>Producto</th><th class="center">Cantidad</th><th class="right">Precio</th><th class="right">Importe</th></tr></thead><tbody>${itemsHtml}</tbody></table>
            <div class="invoice-totals"><div class="invoice-row"><span>Subtotal</span><strong>${money(order.subtotal)}</strong></div><div class="invoice-row"><span>Entrega</span><strong>${money(order.delivery_fee)}</strong></div><div class="invoice-row invoice-grand"><span>Total</span><span>${money(order.total)}</span></div></div>
            ${order.notes ? `<div class="invoice-notes"><strong>Notas del cliente</strong><p>${escapeHtml(order.notes)}</p></div>` : ""}
            <div class="invoice-footer">Café Paraíso · Documento generado desde el área de pedidos · ${escapeHtml(date(new Date()))}</div>
        </div>`;
    }

    function printOrder(order) {
        if (!order) return;

        const oldRoot = document.getElementById("cafe-app-print-root");
        oldRoot?.remove();

        const root = document.createElement("div");
        root.id = "cafe-app-print-root";
        root.className = "cafe-invoice-print-root";
        root.innerHTML = buildHtml(order);

        const style = document.createElement("style");
        style.id = "cafe-app-print-style";
        style.textContent = `
            .cafe-invoice-print-root { display:none; }
            .invoice-sheet { width:100%; max-width:820px; margin:0 auto; padding:34px; background:#fff; color:#171b18; font-family:Arial,Helvetica,sans-serif; font-size:13px; }
            .invoice-head { display:flex; justify-content:space-between; gap:30px; border-bottom:2px solid #111; padding-bottom:18px; }
            .invoice-brand { font-size:25px; font-weight:800; }
            .invoice-muted { color:#66706a; }
            .invoice-title { text-align:right; }
            .invoice-title h1 { margin:0 0 5px; font-size:24px; }
            .invoice-meta { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:24px 0; }
            .invoice-box { border:1px solid #dfe4e0; border-radius:8px; padding:14px; }
            .invoice-box h3 { margin:0 0 8px; font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:#66706a; }
            .invoice-box p { margin:4px 0; }
            .invoice-status { font-weight:700; } .invoice-status.ok { color:#168247; } .invoice-status.bad { color:#b52f38; }
            .invoice-sheet table { width:100%; border-collapse:collapse; margin-top:20px; }
            .invoice-sheet th { font-size:11px; text-transform:uppercase; color:#66706a; text-align:left; border-bottom:2px solid #222; padding:9px 7px; }
            .invoice-sheet td { padding:10px 7px; border-bottom:1px solid #e5e8e6; }
            .invoice-sheet .center { text-align:center; } .invoice-sheet .right { text-align:right; }
            .invoice-totals { margin:18px 0 0 auto; width:310px; }
            .invoice-row { display:flex; justify-content:space-between; padding:5px 0; }
            .invoice-grand { border-top:2px solid #111; margin-top:6px; padding-top:10px; font-size:17px; font-weight:800; }
            .invoice-notes { margin-top:22px; }
            .invoice-footer { margin-top:35px; padding-top:12px; border-top:1px solid #dfe4e0; font-size:10px; color:#737c77; text-align:center; }
            @media print {
                @page { margin:10mm; }
                body > *:not(#cafe-app-print-root) { display:none !important; }
                body { margin:0 !important; background:#fff !important; }
                #cafe-app-print-root { display:block !important; }
                .invoice-sheet { max-width:none; padding:12mm; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(root);

        let cleaned = false;
        const cleanup = () => {
            if (cleaned) return;
            cleaned = true;
            root.remove();
            style.remove();
            window.removeEventListener("afterprint", cleanup);
        };

        window.addEventListener("afterprint", cleanup, { once: true });
        window.requestAnimationFrame(() => window.print());
        // Fallback para navegadores que no disparen afterprint.
        window.setTimeout(() => {
            if (document.visibilityState === "visible") cleanup();
        }, 120000);
    }

    window.CafeAppInvoice = { printOrder };
})();
