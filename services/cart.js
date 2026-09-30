/* =========================================================
   CAFÉ PARAÍSO — CARRITO
   - Invitados: localStorage.
   - Usuarios autenticados: Supabase cart_items.
   ========================================================= */
(function () {
    "use strict";

    const STORAGE_KEY = "cafe-el-caracol-cart";
    const supabase = window.CafeAppSupabase;
    const auth = window.CafeAppAuth;

    function readLocal() {
        try {
            const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(value) ? value.filter(item => item?.product_id && Number(item.quantity) > 0) : [];
        } catch (_) {
            return [];
        }
    }

    function writeLocal(items) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        window.dispatchEvent(new CustomEvent("cafe:cart-updated"));
    }

    function clearLocal() {
        localStorage.removeItem(STORAGE_KEY);
    }

    async function getUser() {
        try {
            return auth ? await auth.getCurrentUser() : null;
        } catch (_) {
            return null;
        }
    }

    async function getCart() {
        const user = await getUser();

        if (!user) {
            const local = readLocal();
            if (!local.length) return [];

            const ids = local.map(item => item.product_id);
            const { data, error } = await supabase
                .from("products")
                .select("id,name,slug,description,price,image_url,is_available,product_categories(name,slug)")
                .in("id", ids);
            if (error) throw error;

            const byId = new Map((data || []).map(product => [product.id, product]));
            return local
                .map(item => ({ product: byId.get(item.product_id), quantity: Math.min(99, Number(item.quantity) || 1) }))
                .filter(item => item.product);
        }

        const { data, error } = await supabase
            .from("cart_items")
            .select("id,product_id,quantity,updated_at,products(id,name,slug,description,price,image_url,is_available,product_categories(name,slug))")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false });

        if (error) throw error;

        return (data || [])
            .map(item => ({ id: item.id, product: item.products, quantity: item.quantity }))
            .filter(item => item.product);
    }

    async function getCount() {
        const items = await getCart();
        return items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    }

    async function addItem(productId, quantity = 1) {
        const qty = Math.max(1, Math.min(99, Number(quantity) || 1));
        const user = await getUser();

        if (!user) {
            const items = readLocal();
            const existing = items.find(item => item.product_id === productId);
            if (existing) existing.quantity = Math.min(99, existing.quantity + qty);
            else items.push({ product_id: productId, quantity: qty });
            writeLocal(items);
            return;
        }

        const { data: existing, error: selectError } = await supabase
            .from("cart_items")
            .select("id,quantity")
            .eq("user_id", user.id)
            .eq("product_id", productId)
            .maybeSingle();
        if (selectError) throw selectError;

        if (existing) {
            const { error } = await supabase
                .from("cart_items")
                .update({ quantity: Math.min(99, Number(existing.quantity) + qty) })
                .eq("id", existing.id)
                .eq("user_id", user.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from("cart_items")
                .insert({ user_id: user.id, product_id: productId, quantity: qty });
            if (error) throw error;
        }

        window.dispatchEvent(new CustomEvent("cafe:cart-updated"));
    }

    async function updateItem(productId, quantity) {
        const qty = Number(quantity);
        const user = await getUser();

        if (qty <= 0) {
            return removeItem(productId);
        }

        const safeQty = Math.min(99, Math.floor(qty));

        if (!user) {
            const items = readLocal();
            const item = items.find(entry => entry.product_id === productId);
            if (item) item.quantity = safeQty;
            writeLocal(items);
            return;
        }

        const { error } = await supabase
            .from("cart_items")
            .update({ quantity: safeQty })
            .eq("user_id", user.id)
            .eq("product_id", productId);
        if (error) throw error;
        window.dispatchEvent(new CustomEvent("cafe:cart-updated"));
    }

    async function removeItem(productId) {
        const user = await getUser();

        if (!user) {
            writeLocal(readLocal().filter(item => item.product_id !== productId));
            return;
        }

        const { error } = await supabase
            .from("cart_items")
            .delete()
            .eq("user_id", user.id)
            .eq("product_id", productId);
        if (error) throw error;
        window.dispatchEvent(new CustomEvent("cafe:cart-updated"));
    }

    async function clear() {
        const user = await getUser();

        if (!user) {
            clearLocal();
            window.dispatchEvent(new CustomEvent("cafe:cart-updated"));
            return;
        }

        const { error } = await supabase
            .from("cart_items")
            .delete()
            .eq("user_id", user.id);
        if (error) throw error;
        window.dispatchEvent(new CustomEvent("cafe:cart-updated"));
    }

    async function mergeLocalIntoAccount() {
        const user = await getUser();
        const local = readLocal();
        if (!user || !local.length) return;

        for (const item of local) {
            await addItem(item.product_id, item.quantity);
        }
        clearLocal();
        window.dispatchEvent(new CustomEvent("cafe:cart-updated"));
    }

    function money(value) {
        return new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR"
        }).format(Number(value || 0));
    }

    window.CafeAppCart = {
        getCart,
        getCount,
        addItem,
        updateItem,
        removeItem,
        clear,
        mergeLocalIntoAccount,
        money
    };
})();
