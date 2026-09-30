(function () {
    "use strict";

    const admin = window.CafeAppAdmin;
    const supabase = window.CafeAppSupabase;
    let products = [];
    let categories = [];

    const $ = (id) => document.getElementById(id);

    function slugify(value) {
        return value.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }

    function money(value) {
        return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value || 0));
    }

    function setStatus(message, error = false) {
        const el = $("catalog-status");
        el.textContent = message || "";
        el.className = error ? "catalog-status error" : "catalog-status";
        if (message) setTimeout(() => { if (el.textContent === message) el.textContent = ""; }, 4000);
    }

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[char]);
    }

    async function loadCategories() {
        const { data, error } = await supabase.from("product_categories").select("id,name,slug,description,sort_order,is_active").order("sort_order").order("name");
        if (error) throw error;
        categories = data || [];
        renderCategorySelects();
    }

    async function loadProducts() {
        const { data, error } = await supabase.from("products").select("id,category_id,name,slug,description,price,image_url,image_path,is_available,sort_order,created_at,updated_at,product_categories(id,name,slug)").order("sort_order").order("name");
        if (error) throw error;
        products = data || [];
        renderProducts();
    }

    function renderCategorySelects() {
        const filter = $("category-filter");
        const selected = filter.value;
        filter.innerHTML = `<option value="">Todas las categorías</option>` + categories.filter(c => c.is_active).map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
        filter.value = selected;

        const select = $("product-category");
        select.innerHTML = `<option value="">Selecciona una categoría</option>` + categories.filter(c => c.is_active).map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
    }

    function filteredProducts() {
        const search = $("product-search").value.trim().toLowerCase();
        const category = $("category-filter").value;
        const availability = $("availability-filter").value;
        return products.filter(p => {
            const matchesSearch = !search || p.name.toLowerCase().includes(search) || (p.description || "").toLowerCase().includes(search);
            const matchesCategory = !category || p.category_id === category;
            const matchesAvailability = !availability || (availability === "available" ? p.is_available : !p.is_available);
            return matchesSearch && matchesCategory && matchesAvailability;
        });
    }

    function renderProducts() {
        const list = filteredProducts();
        $("product-count").textContent = `${list.length} ${list.length === 1 ? "producto" : "productos"}`;
        const body = $("products-body");
        body.innerHTML = list.map(p => {
            const category = p.product_categories?.name || "Sin categoría";
            const image = p.image_url ? `<img class="product-thumb" src="${escapeHtml(p.image_url)}" alt="" loading="lazy">` : `<span class="product-thumb"><i class="bi bi-cup-hot"></i></span>`;
            return `<tr>
                <td><div class="product-cell">${image}<div class="product-info"><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.slug)}</span></div></div></td>
                <td>${escapeHtml(category)}</td>
                <td>${money(p.price)}</td>
                <td><span class="status-pill ${p.is_available ? "available" : "hidden"}"><span class="status-dot"></span>${p.is_available ? "Disponible" : "Oculto"}</span></td>
                <td>${Number(p.sort_order || 0)}</td>
                <td><div class="actions"><button class="table-action" data-edit="${p.id}" title="Editar" aria-label="Editar"><i class="bi bi-pencil"></i></button><button class="table-action danger" data-delete="${p.id}" title="Eliminar" aria-label="Eliminar"><i class="bi bi-trash"></i></button></div></td>
            </tr>`;
        }).join("");
    }

    function openProduct(product = null) {
        $("product-modal").hidden = false;
        $("product-modal-title").textContent = product ? "Editar producto" : "Nuevo producto";
        $("product-id").value = product?.id || "";
        $("product-name").value = product?.name || "";
        $("product-category").value = product?.category_id || "";
        $("product-price").value = product?.price ?? "";
        $("product-order").value = product?.sort_order ?? 0;
        $("product-description").value = product?.description || "";
        $("product-available").checked = product ? product.is_available : true;
        $("product-image").value = "";
        renderPreview(product?.image_url || "");
    }

    function closeProduct() { $("product-modal").hidden = true; }

    function renderPreview(url) {
        $("image-preview").innerHTML = url ? `<img src="${escapeHtml(url)}" alt="Vista previa">` : `<i class="bi bi-image"></i><span>Sin imagen</span>`;
    }

    function getStoragePathFromPublicUrl(url) {
        if (!url) return null;
        try {
            const parsed = new URL(url);
            const marker = "/storage/v1/object/public/products/";
            const index = parsed.pathname.indexOf(marker);
            if (index === -1) return null;
            return decodeURIComponent(parsed.pathname.slice(index + marker.length));
        } catch {
            return null;
        }
    }

    async function removeStorageImage(path) {
        if (!path) return;
        const { error } = await supabase.storage.from("products").remove([path]);
        if (error) throw error;
    }

    async function uploadImage(file, productId) {
        if (!file) return null;
        if (file.size > 2 * 1024 * 1024) throw new Error("La imagen supera los 2 MB.");
        const extension = (file.name.split(".").pop() || "webp").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${productId}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from("products").upload(path, file, { upsert: false, cacheControl: "31536000" });
        if (error) throw error;
        const { data } = supabase.storage.from("products").getPublicUrl(path);
        return { url: data.publicUrl, path };
    }

    async function saveProduct(event) {
        event.preventDefault();
        const button = $("save-product");
        button.disabled = true;
        let uploadedImage = null;
        try {
            const existingId = $("product-id").value;
            const id = existingId || crypto.randomUUID();
            const existingProduct = existingId ? products.find(p => p.id === id) : null;
            const name = $("product-name").value.trim();
            const categoryId = $("product-category").value;
            if (!name || !categoryId) throw new Error("Completa el nombre y la categoría.");

            const payload = {
                name,
                slug: slugify(name),
                category_id: categoryId,
                description: $("product-description").value.trim() || null,
                price: Number($("product-price").value || 0),
                sort_order: Number($("product-order").value || 0),
                is_available: $("product-available").checked
            };

            const file = $("product-image").files[0];
            if (file) {
                uploadedImage = await uploadImage(file, id);
                payload.image_url = uploadedImage.url;
                payload.image_path = uploadedImage.path;
            }

            if (existingId) {
                const { error } = await supabase.from("products").update(payload).eq("id", id);
                if (error) throw error;

                if (uploadedImage) {
                    const oldPath = existingProduct?.image_path || getStoragePathFromPublicUrl(existingProduct?.image_url);
                    if (oldPath && oldPath !== uploadedImage.path) {
                        try {
                            await removeStorageImage(oldPath);
                        } catch (cleanupError) {
                            console.warn("No se pudo eliminar la imagen anterior:", cleanupError);
                        }
                    }
                }
            } else {
                const { error } = await supabase.from("products").insert({ id, ...payload });
                if (error) throw error;
            }

            closeProduct();
            await loadProducts();
            setStatus("Producto guardado correctamente.");
        } catch (error) {
            console.error(error);
            if (uploadedImage?.path) {
                try {
                    await removeStorageImage(uploadedImage.path);
                } catch (cleanupError) {
                    console.warn("No se pudo limpiar la imagen subida tras el error:", cleanupError);
                }
            }
            setStatus(error.message || "No se pudo guardar el producto.", true);
        } finally {
            button.disabled = false;
        }
    }

    async function deleteProduct(id) {
        const product = products.find(p => p.id === id);
        if (!product || !confirm(`¿Eliminar “${product.name}”? Esta acción no se puede deshacer.`)) return;
        try {
            const imagePath = product.image_path || getStoragePathFromPublicUrl(product.image_url);
            const { error } = await supabase.from("products").delete().eq("id", id);
            if (error) throw error;

            let cleanupWarning = false;
            if (imagePath) {
                try {
                    await removeStorageImage(imagePath);
                } catch (storageError) {
                    cleanupWarning = true;
                    console.warn("El producto se eliminó, pero no se pudo eliminar su imagen de Storage:", storageError);
                }
            }

            await loadProducts();
            setStatus(cleanupWarning
                ? "Producto eliminado. La imagen no pudo eliminarse de Storage."
                : "Producto eliminado correctamente.");
        } catch (error) {
            console.error(error);
            setStatus(error.message || "No se pudo eliminar el producto.", true);
        }
    }

    function openCategories() { $("category-modal").hidden = false; renderCategoryList(); }
    function closeCategories() { $("category-modal").hidden = true; }

    function renderCategoryList() {
        $("category-list").innerHTML = categories.map(c => `<div class="category-row"><div><strong>${escapeHtml(c.name)}</strong><span>${escapeHtml(c.slug)} · orden ${c.sort_order}</span></div><div class="category-actions"><button class="table-action danger" data-delete-category="${c.id}" title="Eliminar" aria-label="Eliminar"><i class="bi bi-trash"></i></button></div></div>`).join("");
    }

    async function addCategory(event) {
        event.preventDefault();
        const name = $("category-name").value.trim();
        const sortOrder = Number($("category-order").value || 50);
        if (!name) return;
        try {
            const { error } = await supabase.from("product_categories").insert({ name, slug: slugify(name), sort_order: sortOrder });
            if (error) throw error;
            $("category-form").reset();
            $("category-order").value = 50;
            await loadCategories();
            renderCategoryList();
            setStatus("Categoría añadida correctamente.");
        } catch (error) { console.error(error); setStatus(error.message || "No se pudo añadir la categoría.", true); }
    }

    async function deleteCategory(id) {
        const category = categories.find(c => c.id === id);
        if (!category || !confirm(`¿Eliminar la categoría “${category.name}”? Solo será posible si no tiene productos asociados.`)) return;
        try {
            const { error } = await supabase.from("product_categories").delete().eq("id", id);
            if (error) throw error;
            await loadCategories();
            renderCategoryList();
            setStatus("Categoría eliminada.");
        } catch (error) { console.error(error); setStatus(error.message || "No se pudo eliminar la categoría.", true); }
    }

    function bindEvents() {
        $("new-product").addEventListener("click", () => openProduct());
        $("manage-categories").addEventListener("click", openCategories);
        $("product-form").addEventListener("submit", saveProduct);
        $("category-form").addEventListener("submit", addCategory);
        ["product-search", "category-filter", "availability-filter"].forEach(id => $(id).addEventListener(id === "product-search" ? "input" : "change", renderProducts));
        $("product-image").addEventListener("change", (event) => { const file = event.target.files[0]; if (file) renderPreview(URL.createObjectURL(file)); });
        $("products-body").addEventListener("click", (event) => { const edit = event.target.closest("[data-edit]"); const del = event.target.closest("[data-delete]"); if (edit) openProduct(products.find(p => p.id === edit.dataset.edit)); if (del) deleteProduct(del.dataset.delete); });
        $("category-list").addEventListener("click", (event) => { const del = event.target.closest("[data-delete-category]"); if (del) deleteCategory(del.dataset.deleteCategory); });
        document.querySelectorAll("[data-close-modal]").forEach(el => el.addEventListener("click", closeProduct));
        document.querySelectorAll("[data-close-category]").forEach(el => el.addEventListener("click", closeCategories));
        document.addEventListener("keydown", (event) => { if (event.key === "Escape") { closeProduct(); closeCategories(); } });
    }

    (async function init() {
        try {
            const user = await admin.requireAdmin();
            if (!user) return;
            $("admin-email").textContent = user.email || "Administrador";
            $("admin-logout").addEventListener("click", admin.logout);
            bindEvents();
            await loadCategories();
            await loadProducts();
        } catch (error) {
            console.error(error);
            setStatus(error.message || "No se pudo cargar el catálogo.", true);
        }
    })();
})();
