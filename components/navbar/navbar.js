// ==========================================
// NAVBAR — CAFÉ PARAÍSO
// ==========================================

function initNavbar() {
    const navbar = document.querySelector(".caracol-navbar");

    if (!navbar) {
        return;
    }

    const menu = navbar.querySelector("#navbarMenu");
    const toggler = navbar.querySelector(".navbar-toggler");
    const links = navbar.querySelectorAll(".nav-link");

    // Estado del navbar al hacer scroll.
    const updateNavbarOnScroll = () => {
        navbar.classList.toggle("navbar-scroll", window.scrollY > 40);
    };

    updateNavbarOnScroll();

    window.addEventListener(
        "scroll",
        updateNavbarOnScroll,
        { passive: true }
    );

    // Página actual.
    const currentPath =
        window.location.pathname.replace(/\/$/, "") || "/";

    links.forEach((link) => {
        const linkUrl = new URL(link.href, window.location.href);
        const linkPath =
            linkUrl.pathname.replace(/\/$/, "") || "/";

        const isCurrentPage =
            linkPath === currentPath ||
            (
                currentPath === "/" &&
                linkPath.endsWith("/index.html")
            );

        link.classList.toggle("active", isCurrentPage);

        if (isCurrentPage) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });

    // Bootstrap — menú móvil.
    if (menu && toggler && window.bootstrap) {
        menu.addEventListener("show.bs.collapse", () => {
            toggler.setAttribute("aria-label", "Cerrar menú");
        });

        menu.addEventListener("hide.bs.collapse", () => {
            toggler.setAttribute("aria-label", "Abrir menú");
        });

        links.forEach((link) => {
            link.addEventListener("click", () => {
                if (window.innerWidth > 991) {
                    return;
                }

                bootstrap.Collapse
                    .getOrCreateInstance(menu)
                    .hide();
            });
        });
    }

    // La autenticación se inicializa DESPUÉS de que
    // el componente navbar haya sido insertado en el DOM.
    initNavbarAuth(navbar);
}


// ==========================================
// AUTENTICACIÓN
// ==========================================

async function initNavbarAuth(navbar) {
    try {
        await ensureAuthDependencies();

        if (!window.CafeAppAuth) {
            console.error(
                "[Navbar Auth] No se pudo inicializar CafeAppAuth."
            );
            return;
        }

        // Recuperar sesión persistida.
        const session =
            await window.CafeAppAuth.getSession();

        updateNavbarAuth(navbar, session);
        refreshNavbarCart();

        // Escuchar login, logout y cambios de sesión.
        window.CafeAppAuth.onAuthStateChange(
            (_event, session) => {
                updateNavbarAuth(navbar, session);
            }
        );

    } catch (error) {
        console.error("[Navbar Auth]", error);
    }
}


// ==========================================
// CARGAR SUPABASE + AUTH SI LA PÁGINA NO LOS
// HA CARGADO TODAVÍA
// ==========================================

function loadScriptOnce(src, id, integrity = "") {
    return new Promise((resolve, reject) => {
        if (id && document.getElementById(id)) {
            resolve();
            return;
        }

        // Evitar cargar dos veces el mismo src.
        const existing =
            Array.from(document.scripts)
                .find((script) => script.src === src);

        if (existing) {
            existing.addEventListener("load", resolve, { once: true });
            existing.addEventListener("error", reject, { once: true });
            return;
        }

        const script = document.createElement("script");

        if (id) {
            script.id = id;
        }

        script.src = src;
        script.async = false;
        if (integrity) {
            script.integrity = integrity;
            script.crossOrigin = "anonymous";
        }

        script.onload = () => resolve();
        script.onerror = () =>
            reject(new Error(`No se pudo cargar ${src}`));

        document.head.appendChild(script);
    });
}


async function ensureAuthDependencies() {

    // 1. Supabase JS
    if (!window.supabase) {
        await loadScriptOnce(
            "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2",
            "supabase-js",
            "sha384-WgXwGL6fUsYJWNaKJgVbrJKGRQwc1vieh2oy4kw9nXqpNDz3tdSsqEYUgeHD/NuF"
        );
    }

    // 2. Valores de configuración de esta instalación
    if (!window.CafeAppRuntimeConfig) {
        await loadScriptOnce(
            "services/config/runtime-config.js",
            "cafe-app-runtime-config"
        );
    }

    // 3. Configuración de Supabase
    if (!window.CafeAppSupabase) {
        await loadScriptOnce(
            "services/config/supabase.js",
            "cafe-app-supabase-config"
        );
    }

    // 4. Capa de autenticación
    if (!window.CafeAppAuth) {
        await loadScriptOnce(
            "services/auth.js",
            "cafe-app-auth"
        );
    }

    if (!window.CafeAppCart) {
        await loadScriptOnce(
            "services/cart.js",
            "cafe-app-cart"
        );
    }
}


// ==========================================
// CARRITO
// ==========================================

async function refreshNavbarCart() {
    const badge = document.getElementById("navbar-cart-badge");
    if (!badge || !window.CafeAppCart) return;

    try {
        const count = await window.CafeAppCart.getCount();
        badge.textContent = count > 99 ? "99+" : String(count);
        badge.classList.toggle("d-none", count <= 0);
    } catch (error) {
        console.warn("[Navbar Cart] No se pudo actualizar el contador:", error);
    }
}

window.addEventListener("cafe:cart-updated", refreshNavbarCart);

// ==========================================
// ACTUALIZAR NAVBAR SEGÚN SESIÓN
// ==========================================

async function updateNavbarAuth(navbar, session) {
    const authButton = navbar.querySelector(".btn-success");
    const cartLink = navbar.querySelector(".navbar-cart-link");

    if (!authButton) return;

    // El carrito es una funcionalidad exclusiva de usuarios autenticados.
    // Se mantiene oculto por defecto en el HTML para evitar parpadeos
    // mientras se recupera la sesión de Supabase.
    if (cartLink) {
        cartLink.hidden = !(session && session.user);
    }

    if (!session || !session.user) {
        authButton.href = "login.html";
        authButton.innerHTML = "Iniciar sesión";
        authButton.title = "Iniciar sesión";
        authButton.removeAttribute("aria-label");
        authButton.classList.remove("navbar-user-button");
        authButton.onclick = null;
        refreshNavbarCart();
        return;
    }

    const user = session.user;
    const fullName =
        user.user_metadata?.full_name ||
        user.email ||
        "Usuario";

    let avatarUrl = null;
    let role = "user";

    try {
        const { data } = await window.CafeAppSupabase
            .from("profiles")
            .select("avatar_url, role")
            .eq("id", user.id)
            .maybeSingle();

        avatarUrl = data?.avatar_url || null;
        role = data?.role || "user";
    } catch (error) {
        console.warn("[Navbar Auth] No se pudo cargar el perfil:", error);
    }

    // El botón de cuenta debe llevar al área correspondiente al rol real.
    // Así, un administrador o RRHH puede volver a su panel desde cualquier
    // página pública sin caer accidentalmente en Mi cuenta de usuario.
    renderNavbarUser(authButton, fullName, avatarUrl, role);
    refreshNavbarCart();
}

function getRolePanelDestination(role) {
    const destinations = {
        admin: "admin/index.html",
        rrhh: "rrhh/index.html",
        user: "mi-cuenta.html",
    };

    return destinations[role] || destinations.user;
}

function getRolePanelLabel(role) {
    if (role === "admin") return "Panel de administración";
    if (role === "rrhh") return "Panel de RRHH";
    return "Mi cuenta";
}

function renderNavbarUser(authButton, fullName, avatarUrl, role = "user") {
    const destination = getRolePanelDestination(role);
    const label = getRolePanelLabel(role);

    authButton.href = destination;
    authButton.title = label;
    authButton.setAttribute("aria-label", `${label}: ${fullName}`);

    authButton.innerHTML = `
        ${avatarUrl
            ? `<img class="navbar-user-avatar" src="${escapeHtml(avatarUrl)}" alt="">`
            : `<i class="bi bi-person-circle navbar-user-icon" aria-hidden="true"></i>`
        }
        <span>${escapeHtml(fullName)}</span>
    `;

    authButton.classList.add("navbar-user-button");
    authButton.dataset.role = role;
    authButton.onclick = null;
}

// ==========================================
// SEGURIDAD
// ==========================================

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value);
    return div.innerHTML;
}


// ==========================================
// FIN NAVBAR
// ==========================================
