/* =========================================================
   CAFÉ PARAÍSO — CATÁLOGO PÚBLICO
   =========================================================
   Lee únicamente categorías activas y productos disponibles.
   La seguridad real se aplica mediante las políticas RLS de Supabase.
   ========================================================= */

(function () {
    "use strict";

    const FALLBACK_IMAGES = {
        cafes: "assets/img/products/cafes.webp",
        infusiones: "assets/img/products/infusiones.webp",
        chocolates: "assets/img/products/chocolate.webp",
        complementos: "assets/img/products/complementos.webp",
    };

    const supabase = window.CafeAppSupabase;
    const cart = window.CafeAppCart;

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>\'"]/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\'": "&#039;",
            '"': "&quot;",
        })[char]);
    }

    function money(value) {
        return new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR",
        }).format(Number(value || 0));
    }

    function fallbackImage(category) {
        return FALLBACK_IMAGES[category?.slug] || FALLBACK_IMAGES.cafes;
    }

    function getProductImage(product) {
        return product.image_url || fallbackImage(product.product_categories);
    }

    function productCard(product, isAuthenticated) {
        const category = product.product_categories?.name || "Producto";
        const image = getProductImage(product);
        const description = product.description || "Producto seleccionado por Café Paraíso.";

        return `
            <article class="col-lg-3 col-md-6">
                <div class="caracol-product-card">
                    <div class="caracol-product-image-wrap">
                        <img
                            src="${escapeHtml(image)}"
                            alt="${escapeHtml(product.name)}"
                            loading="lazy"
                            class="caracol-product-image">
                    </div>
                    <div class="caracol-product-body">
                        <span class="caracol-product-category">${escapeHtml(category)}</span>
                        <h3>${escapeHtml(product.name)}</h3>
                        <p>${escapeHtml(description)}</p>
                        ${isAuthenticated ? `
                            <strong class="caracol-product-price">${money(product.price)}</strong>
                            <button type="button" class="caracol-product-add" data-add-to-cart="${escapeHtml(product.id)}">
                                <i class="bi bi-cart-plus" aria-hidden="true"></i>
                                <span>Añadir al carrito</span>
                            </button>
                        ` : ""}
                    </div>
                </div>
            </article>`;
    }

    async function getCatalog() {
        if (!supabase) {
            throw new Error("Supabase no está configurado.");
        }

        const [categoriesResult, productsResult] = await Promise.all([
            supabase
                .from("product_categories")
                .select("id,name,slug,description,sort_order")
                .eq("is_active", true)
                .order("sort_order")
                .order("name"),
            supabase
                .from("products")
                .select("id,category_id,name,slug,description,price,image_url,sort_order,product_categories(id,name,slug)")
                .eq("is_available", true)
                .order("sort_order")
                .order("name"),
        ]);

        if (categoriesResult.error) throw categoriesResult.error;
        if (productsResult.error) throw productsResult.error;

        return {
            categories: categoriesResult.data || [],
            products: productsResult.data || [],
        };
    }

    function renderHomeProducts(container, products, isAuthenticated) {
        if (!container) return;

        const grid = container.querySelector("#products-grid");
        if (!grid) return;

        // La portada muestra los cuatro primeros productos disponibles.
        grid.innerHTML = products.slice(0, 4).map((product) => productCard(product, isAuthenticated)).join("");
        bindCartButtons(container);

        // Sin productos: no mostramos un mensaje artificial ni tarjetas vacías.
        container.classList.toggle("is-empty", products.length === 0);
    }

    function renderCategoryFilters(container, categories, selectedSlug) {
        const filters = container.querySelector("#products-filters");
        if (!filters) return;

        const items = [
            { name: "Todos", slug: "" },
            ...categories.map((category) => ({ name: category.name, slug: category.slug })),
        ];

        filters.innerHTML = items.map((item) => `
            <button
                type="button"
                class="productos-filter${item.slug === selectedSlug ? " active" : ""}"
                data-category="${escapeHtml(item.slug)}">
                ${escapeHtml(item.name)}
            </button>
        `).join("");
    }

    function renderCatalogPage(container, products, selectedSlug, isAuthenticated) {
        const grid = container.querySelector("#productos-grid");
        if (!grid) return;

        const filtered = selectedSlug
            ? products.filter((product) => product.product_categories?.slug === selectedSlug)
            : products;

        grid.innerHTML = filtered.map((product) => productCard(product, isAuthenticated)).join("");
        bindCartButtons(container);
        container.classList.toggle("is-empty", filtered.length === 0);

        const count = container.querySelector("#productos-count");
        if (count) {
            count.textContent = `${filtered.length} ${filtered.length === 1 ? "producto disponible" : "productos disponibles"}`;
        }
    }

    function bindCartButtons(container) {
        if (!container || !cart) return;
        container.querySelectorAll("[data-add-to-cart]").forEach((button) => {
            button.addEventListener("click", async () => {
                const productId = button.dataset.addToCart;
                if (!productId) return;

                const original = button.innerHTML;
                button.disabled = true;
                button.innerHTML = '<i class="bi bi-check2"></i><span>Añadido</span>';

                try {
                    await cart.addItem(productId, 1);
                    window.setTimeout(() => {
                        button.disabled = false;
                        button.innerHTML = original;
                    }, 900);
                } catch (error) {
                    console.error("[Productos] No se pudo añadir al carrito:", error);
                    button.disabled = false;
                    button.innerHTML = '<i class="bi bi-exclamation-circle"></i><span>Error</span>';
                    window.setTimeout(() => { button.innerHTML = original; }, 1400);
                }
            });
        });
    }

    async function init() {
        const homeContainer = document.getElementById("products");
        const catalogContainer = document.querySelector(".page-productos");

        if (!homeContainer && !catalogContainer) return;

        try {
            const { categories, products } = await getCatalog();

            let isAuthenticated = false;
            try {
                if (window.CafeAppAuth) {
                    const user = await window.CafeAppAuth.getCurrentUser();
                    isAuthenticated = Boolean(user);
                }
            } catch (authError) {
                console.warn("[Productos] No se pudo comprobar la sesión:", authError);
            }

            if (homeContainer) {
                renderHomeProducts(homeContainer, products, false);
            }

            if (catalogContainer) {
                const params = new URLSearchParams(window.location.search);
                let selectedSlug = params.get("categoria") || "";

                if (selectedSlug && !categories.some((category) => category.slug === selectedSlug)) {
                    selectedSlug = "";
                }

                renderCategoryFilters(catalogContainer, categories, selectedSlug);
                renderCatalogPage(catalogContainer, products, selectedSlug, isAuthenticated);

                const filters = catalogContainer.querySelector("#products-filters");
                filters?.addEventListener("click", (event) => {
                    const button = event.target.closest("[data-category]");
                    if (!button) return;

                    const slug = button.dataset.category || "";
                    const url = new URL(window.location.href);

                    if (slug) url.searchParams.set("categoria", slug);
                    else url.searchParams.delete("categoria");

                    window.history.replaceState({}, "", url);
                    renderCategoryFilters(catalogContainer, categories, slug);
                    renderCatalogPage(catalogContainer, products, slug, isAuthenticated);
                });
            }
        } catch (error) {
            console.error("[Productos] No se pudo cargar el catálogo:", error);
        }
    }

    window.CafeAppProducts = {
        getCatalog,
        init,
    };
})();
