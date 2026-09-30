/* =========================================================
   CAFÉ PARAÍSO — PEDIDOS / DIRECCIONES
   ========================================================= */
(function () {
    "use strict";

    const supabase = window.CafeAppSupabase;

    const PAYMENT_METHODS = Object.freeze({
        bank_transfer: { label: "Transferencia bancaria", icon: "bank" },
        card: { label: "Tarjeta", icon: "credit-card" },
        bizum: { label: "Bizum", icon: "phone" },
        cash: { label: "Efectivo al recibir", icon: "cash-coin" }
    });

    const ORDER_STATUS = Object.freeze({
        pending: "Pendiente",
        confirmed: "Confirmado",
        preparing: "Preparando",
        ready: "Listo para entregar",
        out_for_delivery: "En reparto",
        delivered: "Entregado",
        cancelled: "Cancelado"
    });

    function requireClient() {
        if (!supabase) throw new Error("Supabase no está configurado.");
        return supabase;
    }

    async function getAddresses() {
        const { data, error } = await requireClient()
            .from("customer_addresses")
            .select("id,label,recipient_name,phone,address_line,postal_code,city,province,notes,is_default,created_at,updated_at")
            .order("is_default", { ascending: false })
            .order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
    }

    async function saveAddress(address) {
        const client = requireClient();

        // La tabla customer_addresses exige que user_id coincida con auth.uid()
        // mediante RLS. Nunca confiamos en un user_id enviado por el formulario:
        // lo obtenemos directamente de la sesión autenticada de Supabase.
        const { data: { user }, error: userError } = await client.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error("Debes iniciar sesión para guardar una dirección.");

        const payload = {
            user_id: user.id,
            label: String(address.label || "Principal").trim(),
            recipient_name: String(address.recipient_name || "").trim(),
            phone: String(address.phone || "").trim(),
            address_line: String(address.address_line || "").trim(),
            postal_code: String(address.postal_code || "").trim(),
            city: String(address.city || "").trim(),
            province: String(address.province || "").trim(),
            notes: String(address.notes || "").trim() || null,
            is_default: Boolean(address.is_default)
        };

        if (address.id) {
            const { data, error } = await client
                .from("customer_addresses")
                .update(payload)
                .eq("id", address.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        }

        const { data, error } = await client
            .from("customer_addresses")
            .insert(payload)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async function deleteAddress(id) {
        const { error } = await requireClient()
            .from("customer_addresses")
            .delete()
            .eq("id", id);
        if (error) throw error;
    }

    async function setDefaultAddress(id) {
        const client = requireClient();
        const { data, error } = await client
            .from("customer_addresses")
            .update({ is_default: true })
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async function getOrders() {
        const { data, error } = await requireClient()
            .from("orders")
            .select("id,order_number,status,payment_method,payment_status,subtotal,delivery_fee,total,notes,recipient_name,phone,address_line,postal_code,city,province,created_at,updated_at,order_items(id,product_id,product_name,unit_price,quantity,line_total)")
            .order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
    }

    async function cancelMyOrder(orderId) {
        const { data, error } = await requireClient()
            .rpc("cancel_my_order", { p_order_id: orderId });
        if (error) throw error;
        return data;
    }

    async function createOrder({ addressId, paymentMethod, notes = "" }) {
        const { data, error } = await requireClient()
            .rpc("create_order_from_cart", {
                p_address_id: addressId,
                p_payment_method: paymentMethod,
                p_notes: notes || null
            });
        if (error) throw error;
        return data;
    }

    function paymentLabel(method) {
        return PAYMENT_METHODS[method]?.label || method || "—";
    }

    function statusLabel(status) {
        return ORDER_STATUS[status] || status || "—";
    }

    window.CafeAppOrders = {
        PAYMENT_METHODS,
        ORDER_STATUS,
        getAddresses,
        saveAddress,
        deleteAddress,
        setDefaultAddress,
        getOrders,
        cancelMyOrder,
        createOrder,
        paymentLabel,
        statusLabel
    };
})();
