#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const envPath = path.join(projectRoot, ".env");
const outputPath = path.join(projectRoot, "services", "config", "runtime-config.js");

function fail(message) {
    console.error(`[configure] ${message}`);
    process.exit(1);
}

function parseEnv(source) {
    const values = {};
    const lines = source.replace(/^\uFEFF/, "").split(/\r?\n/u);

    for (const [index, rawLine] of lines.entries()) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;

        const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u.exec(line);
        if (!match) fail(`Línea ${index + 1} no válida en .env.`);

        let value = match[2].trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        values[match[1]] = value;
    }

    return values;
}

function isPlaceholder(value) {
    const normalized = String(value || "").trim().toLowerCase();
    return (
        /^<.*>$/u.test(normalized) ||
        /^(?:todo|changeme|replace[-_ ]?me|change[-_ ]?me)$/u.test(normalized) ||
        /(?:^|[/:._-])(?:your[-_ ]?project|project[-_ ]?ref|replace[-_ ]?me|change[-_ ]?me|changeme)(?:[/:._-]|$)/u.test(normalized) ||
        /^(?:sb_publishable_)?(?:your|replace|change|example)[-_ ].*(?:key|value|publishable|public)/u.test(normalized) ||
        /^sb_publishable_(?:your|replace|change|example)(?:[-_]|$)/u.test(normalized)
    );
}

function validateHttpUrl(name, value) {
    if (!value) fail(`Falta ${name}.`);

    const normalized = String(value).trim();
    if (isPlaceholder(normalized)) {
        fail(`${name} contiene un valor de ejemplo sin sustituir.`);
    }

    let parsed;
    try {
        parsed = new URL(normalized);
    } catch {
        fail(`${name} debe ser una URL válida.`);
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        fail(`${name} debe utilizar http o https.`);
    }

    if (parsed.username || parsed.password) {
        fail(`${name} no puede incluir credenciales.`);
    }

    return parsed.toString().replace(/\/$/u, "");
}

function validatePublishableKey(value) {
    const key = String(value || "").trim();
    if (!key) fail("Falta SUPABASE_PUBLISHABLE_KEY.");

    if (isPlaceholder(key)) {
        fail("SUPABASE_PUBLISHABLE_KEY contiene un placeholder sin sustituir.");
    }

    if (/^sb_secret_/iu.test(key) || /service[-_ ]?role/iu.test(key)) {
        fail("SUPABASE_PUBLISHABLE_KEY no puede ser una clave secreta.");
    }

    const jwtParts = key.split(".");
    if (jwtParts.length === 3) {
        let payload = null;
        try {
            payload = JSON.parse(Buffer.from(jwtParts[1], "base64url").toString("utf8"));
        } catch {
            // Una clave opaca o un JWT no decodificable no permite inferir privilegios con seguridad.
        }
        if (payload?.role === "service_role") {
            fail("SUPABASE_PUBLISHABLE_KEY no puede tener el rol service_role.");
        }
    }

    return key;
}

function supabaseExecutable() {
    const localExecutable = path.join(projectRoot, "node_modules", "supabase", "dist", "supabase.js");
    if (!fs.existsSync(localExecutable)) {
        fail("No se encontró Supabase CLI. Ejecuta npm ci primero.");
    }
    return localExecutable;
}

function parseCliJson(stdout) {
    try {
        return JSON.parse(String(stdout || "").trim());
    } catch {
        fail("No se pudo interpretar el estado JSON de Supabase local.");
    }
}

function readLocalConfig() {
    const result = spawnSync(
        process.execPath,
        [supabaseExecutable(), "status", "--output", "json", "--log-level", "error"],
        {
            cwd: projectRoot,
            encoding: "utf8",
            env: {
                ...process.env,
                DO_NOT_TRACK: "1",
                SUPABASE_TELEMETRY_DISABLED: "1",
            },
        }
    );

    if (result.status !== 0) {
        const detail = String(result.error?.message || "").trim();
        fail(`Supabase local no está disponible.${detail ? ` ${detail}` : " Comprueba que Docker esté iniciado."}`);
    }

    const status = parseCliJson(result.stdout);
    if (!status.API_URL || !(status.PUBLISHABLE_KEY || status.ANON_KEY)) {
        fail("Supabase CLI no devolvió la URL y la clave pública locales esperadas.");
    }
    return {
        SUPABASE_URL: status.API_URL,
        SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY || status.ANON_KEY,
        APP_URL: "http://localhost:3000",
    };
}

function readEnvironmentConfig() {
    const fileValues = fs.existsSync(envPath)
        ? parseEnv(fs.readFileSync(envPath, "utf8"))
        : {};
    const values = {};

    for (const name of ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "APP_URL"]) {
        values[name] = process.env[name] || fileValues[name] || "";
    }

    if (!fs.existsSync(envPath) && !values.SUPABASE_URL) {
        fail("No existe .env ni hay variables de entorno. Copia .env.example a .env y completa sus valores.");
    }
    return values;
}

function main() {
    const local = process.argv.includes("--local");
    const values = local ? readLocalConfig() : readEnvironmentConfig();
    const config = {
        supabaseUrl: validateHttpUrl("SUPABASE_URL", values.SUPABASE_URL),
        supabasePublishableKey: validatePublishableKey(values.SUPABASE_PUBLISHABLE_KEY),
        appUrl: validateHttpUrl("APP_URL", values.APP_URL),
    };

    const generated = [
        "// Generated by scripts/configure.js. Do not commit this file.",
        `window.CafeAppRuntimeConfig = Object.freeze(${JSON.stringify(config, null, 4)});`,
        "",
    ].join("\n");

    fs.writeFileSync(outputPath, generated, { encoding: "utf8", mode: 0o600 });
    console.log(`[configure] Configuración ${local ? "local" : "de .env/entorno"} generada correctamente.`);
}

main();
