#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const host = "127.0.0.1";
const port = 3000;
const runtimeConfig = path.join(projectRoot, "services", "config", "runtime-config.js");

const mimeTypes = new Map([
    [".html", "text/html; charset=utf-8"],
    [".css", "text/css; charset=utf-8"],
    [".js", "text/javascript; charset=utf-8"],
    [".json", "application/json; charset=utf-8"],
    [".svg", "image/svg+xml"],
    [".png", "image/png"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".gif", "image/gif"],
    [".webp", "image/webp"],
    [".ico", "image/x-icon"],
    [".woff", "font/woff"],
    [".woff2", "font/woff2"],
    [".ttf", "font/ttf"],
    [".otf", "font/otf"],
]);

const blockedTopLevel = new Set([
    ".git",
    ".idea",
    ".vscode",
    "node_modules",
    "package-lock.json",
    "package.json",
    "scripts",
    "supabase",
]);

function send(response, status, body, contentType = "text/plain; charset=utf-8") {
    response.writeHead(status, {
        "Content-Type": contentType,
        "Content-Length": Buffer.byteLength(body),
        "X-Content-Type-Options": "nosniff",
    });
    response.end(body);
}

function resolveRequestPath(requestUrl) {
    const rawPathname = requestUrl.split(/[?#]/u, 1)[0];
    let decodedRawPathname;
    try {
        decodedRawPathname = decodeURIComponent(rawPathname).replace(/\\/gu, "/");
    } catch {
        return null;
    }

    if (decodedRawPathname.split("/").some((segment) => segment === "." || segment === "..")) {
        return null;
    }

    let pathname;
    try {
        pathname = decodeURIComponent(new URL(requestUrl, `http://${host}:${port}`).pathname);
    } catch {
        return null;
    }

    const segments = pathname.split("/").filter(Boolean);
    if (segments.some((segment) => segment.startsWith("."))) return null;
    if (segments.length && blockedTopLevel.has(segments[0])) return null;

    let relativePath = segments.join(path.sep);
    if (!relativePath || pathname.endsWith("/")) {
        relativePath = path.join(relativePath, "index.html");
    }

    const absolutePath = path.resolve(projectRoot, relativePath);
    if (absolutePath !== projectRoot && !absolutePath.startsWith(`${projectRoot}${path.sep}`)) {
        return null;
    }
    return absolutePath;
}

if (!fs.existsSync(runtimeConfig)) {
    console.error(
        "[dev] Falta services/config/runtime-config.js. Ejecuta npm run supabase:start para local o npm run configure para .env."
    );
    process.exit(1);
}

const server = http.createServer((request, response) => {
    if (!request.url || !["GET", "HEAD"].includes(request.method || "")) {
        send(response, 405, "Method Not Allowed");
        return;
    }

    const filePath = resolveRequestPath(request.url);
    if (!filePath) {
        send(response, 404, "Not Found");
        return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes.get(extension);
    if (!contentType) {
        send(response, 404, "Not Found");
        return;
    }

    fs.stat(filePath, (statError, stats) => {
        if (statError || !stats.isFile()) {
            send(response, 404, "Not Found");
            return;
        }

        const headers = {
            "Content-Type": contentType,
            "Content-Length": stats.size,
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": filePath === runtimeConfig ? "no-store" : "no-cache",
        };
        response.writeHead(200, headers);
        if (request.method === "HEAD") {
            response.end();
            return;
        }
        fs.createReadStream(filePath).pipe(response);
    });
});

server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error(`[dev] El puerto ${port} ya está en uso.`);
    } else {
        console.error("[dev] No se pudo iniciar el servidor:", error.message);
    }
    process.exit(1);
});

server.listen(port, host, () => {
    console.log(`[dev] Café Paraíso disponible en http://localhost:${port}`);
});
