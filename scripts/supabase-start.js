#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const supabaseCli = path.join(projectRoot, "node_modules", "supabase", "dist", "supabase.js");

if (!fs.existsSync(supabaseCli)) {
    console.error("[supabase:start] No se encontró Supabase CLI. Ejecuta npm ci primero.");
    process.exit(1);
}

const environment = {
    ...process.env,
    DO_NOT_TRACK: "1",
    SUPABASE_TELEMETRY_DISABLED: "1",
};
const start = spawnSync(process.execPath, [supabaseCli, "start"], {
    cwd: projectRoot,
    env: environment,
    encoding: "utf8",
});

if (start.status !== 0) {
    const detail = String(start.error?.message || "").trim();
    console.error(
        `[supabase:start] No se pudo iniciar Supabase local.${detail ? ` ${detail}` : " Comprueba que Docker esté iniciado."}`
    );
    process.exit(start.status || 1);
}

console.log("[supabase:start] Supabase local disponible.");

const configure = spawnSync(process.execPath, [path.join(__dirname, "configure.js"), "--local"], {
    cwd: projectRoot,
    env: environment,
    stdio: "inherit",
});

process.exit(configure.status || 0);
