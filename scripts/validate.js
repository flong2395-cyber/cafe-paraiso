#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const excludedDirectories = new Set([".git", "node_modules", ".temp"]);
const allowedGeneratedReferences = new Set(["services/config/runtime-config.js"]);
const failures = [];
let checkedJavaScript = 0;
let checkedJson = 0;
let checkedLocalReferences = 0;

function isExternalOrDynamicReference(reference) {
    const value = String(reference || "").trim();
    return (
        !value ||
        value.startsWith("#") ||
        value.startsWith("//") ||
        /^(?:https?:|data:|blob:|mailto:|tel:|javascript:)/iu.test(value) ||
        value.includes("${") ||
        value.includes("var(")
    );
}

function hasExactFilesystemCase(absolutePath) {
    const relativePath = path.relative(projectRoot, absolutePath);
    if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        return false;
    }

    let current = projectRoot;
    for (const segment of relativePath.split(path.sep)) {
        if (!fs.readdirSync(current).includes(segment)) return false;
        current = path.join(current, segment);
    }
    return true;
}

function inspectLocalReference(sourcePath, reference, baseDirectory) {
    if (isExternalOrDynamicReference(reference)) return;

    const withoutFragment = String(reference).trim().split(/[?#]/u, 1)[0];
    let decoded;
    try {
        decoded = decodeURIComponent(withoutFragment).replace(/^[/\\]+/u, "");
    } catch {
        failures.push(`${path.relative(projectRoot, sourcePath)} contiene una referencia local no válida: ${reference}`);
        return;
    }
    if (!decoded) return;

    const absoluteTarget = path.resolve(
        String(reference).trim().startsWith("/") ? projectRoot : baseDirectory,
        decoded
    );
    const relativeTarget = path.relative(projectRoot, absoluteTarget).split(path.sep).join("/");
    checkedLocalReferences++;

    if (allowedGeneratedReferences.has(relativeTarget)) return;
    if (!fs.existsSync(absoluteTarget)) {
        failures.push(
            `${path.relative(projectRoot, sourcePath)} referencia un recurso local inexistente: ${reference}`
        );
    } else if (!hasExactFilesystemCase(absoluteTarget)) {
        failures.push(
            `${path.relative(projectRoot, sourcePath)} usa una capitalización incorrecta: ${reference}`
        );
    }
}

function inspectHtmlReferences(absolutePath, source) {
    const relativePath = path.relative(projectRoot, absolutePath);
    const baseDirectory = relativePath.startsWith(`components${path.sep}`)
        ? projectRoot
        : path.dirname(absolutePath);

    for (const match of source.matchAll(/\bsrc\s*=\s*(["'])(.*?)\1/giu)) {
        inspectLocalReference(absolutePath, match[2], baseDirectory);
    }
    for (const match of source.matchAll(/\bsrcset\s*=\s*(["'])(.*?)\1/giu)) {
        for (const candidate of match[2].split(",")) {
            inspectLocalReference(absolutePath, candidate.trim().split(/\s+/u)[0], baseDirectory);
        }
    }
    for (const match of source.matchAll(/<link\b[^>]*>/giu)) {
        const tag = match[0];
        const rel = /\brel\s*=\s*(["'])(.*?)\1/iu.exec(tag)?.[2] || "";
        const href = /\bhref\s*=\s*(["'])(.*?)\1/iu.exec(tag)?.[2];
        if (href && rel.split(/\s+/u).includes("stylesheet")) {
            inspectLocalReference(absolutePath, href, baseDirectory);
        }
    }
}

function inspectCssReferences(absolutePath, source) {
    const baseDirectory = path.dirname(absolutePath);
    for (const match of source.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]+))\s*\)/giu)) {
        inspectLocalReference(absolutePath, match[1] || match[2] || match[3], baseDirectory);
    }
    for (const match of source.matchAll(/@import\s+(["'])(.*?)\1/giu)) {
        inspectLocalReference(absolutePath, match[2], baseDirectory);
    }
}

function inspectJavaScriptReferences(absolutePath, source) {
    for (const match of source.matchAll(/(?:fetch\s*\(|\.src\s*=)\s*(["'])(.*?)\1/giu)) {
        inspectLocalReference(absolutePath, match[2], projectRoot);
    }
    for (const match of source.matchAll(
        /(["'])((?:assets|components|services|admin|rrhh)\/[^"']+\.(?:css|gif|html|jpe?g|js|png|svg|webp)(?:[?#][^"']*)?)\1/giu
    )) {
        inspectLocalReference(absolutePath, match[2], projectRoot);
    }
}

function trackedFiles() {
    if (!fs.existsSync(path.join(projectRoot, ".git"))) return [];

    const result = spawnSync("git", ["ls-files", "-z"], {
        cwd: projectRoot,
        encoding: "utf8",
    });
    if (result.status !== 0) {
        failures.push("No se pudo comprobar el tracking de Git.");
        return [];
    }
    return result.stdout.split("\0").filter(Boolean);
}

function inspectJwt(value, relativePath) {
    const parts = value.split(".");
    if (parts.length !== 3) return;

    try {
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
        if (payload?.role === "service_role") {
            failures.push(`${relativePath} contiene un JWT service_role.`);
        }
    } catch {
        // No todos los textos con tres segmentos son JWT válidos.
    }
}

function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
        const absolutePath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            walk(absolutePath);
        } else if (entry.isFile() && entry.name.endsWith(".js")) {
            const result = spawnSync(process.execPath, ["--check", absolutePath], {
                encoding: "utf8",
            });
            checkedJavaScript++;
            if (result.status !== 0) failures.push(result.stderr.trim());
            inspectJavaScriptReferences(absolutePath, fs.readFileSync(absolutePath, "utf8"));
        } else if (entry.isFile() && entry.name.endsWith(".html")) {
            inspectHtmlReferences(absolutePath, fs.readFileSync(absolutePath, "utf8"));
        } else if (entry.isFile() && entry.name.endsWith(".css")) {
            inspectCssReferences(absolutePath, fs.readFileSync(absolutePath, "utf8"));
        } else if (entry.isFile() && entry.name.endsWith(".json")) {
            checkedJson++;
            try {
                JSON.parse(fs.readFileSync(absolutePath, "utf8"));
            } catch (error) {
                failures.push(`${path.relative(projectRoot, absolutePath)}: ${error.message}`);
            }
        }
    }
}

walk(projectRoot);

const componentLoaderPath = path.join(projectRoot, "assets", "js", "components.js");
const componentLoader = fs.readFileSync(componentLoaderPath, "utf8");
const componentList = /const\s+COMPONENTS\s*=\s*\[([\s\S]*?)\]/u.exec(componentLoader)?.[1] || "";
for (const match of componentList.matchAll(/(["'])(.*?)\1/gu)) {
    const name = match[2];
    inspectLocalReference(
        componentLoaderPath,
        `components/${name}/${name}.html`,
        projectRoot
    );
}

const tracked = trackedFiles();
const ignoredTracked = spawnSync("git", ["ls-files", "-ci", "--exclude-standard", "-z"], {
    cwd: projectRoot,
    encoding: "utf8",
});
if (ignoredTracked.status === 0) {
    for (const relativePath of ignoredTracked.stdout.split("\0").filter(Boolean)) {
        failures.push(`${relativePath} está versionado aunque .gitignore lo excluye.`);
    }
}

for (const relativePath of tracked) {
    const absolutePath = path.join(projectRoot, relativePath);
    if (!fs.existsSync(absolutePath)) continue;
    const extension = path.extname(relativePath).toLowerCase();
    const textFile = [
        ".css", ".env", ".html", ".js", ".json", ".md", ".sql", ".toml", ".txt", ".yaml", ".yml",
    ].includes(extension) || [".gitattributes", ".gitignore"].includes(path.basename(relativePath));
    if (!textFile) continue;

    let source;
    try {
        source = fs.readFileSync(absolutePath, "utf8");
    } catch {
        continue;
    }

    if (/[A-Za-z]:\\Users\\[^\s"']+/u.test(source) || /\/Users\/[^\s"']+/u.test(source)) {
        failures.push(`${relativePath} contiene una ruta personal.`);
    }
    if (/sb_secret_[A-Za-z0-9_-]{12,}/u.test(source)) {
        failures.push(`${relativePath} contiene una clave sb_secret.`);
    }
    for (const match of source.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/gu)) {
        inspectJwt(match[0], relativePath);
    }
}

const requiredEnvVariables = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "APP_URL"];
const envExample = fs.readFileSync(path.join(projectRoot, ".env.example"), "utf8");
for (const variable of requiredEnvVariables) {
    if (!new RegExp(`^${variable}=`, "mu").test(envExample)) {
        failures.push(`.env.example no contiene ${variable}.`);
    }
}

const forbiddenHost = ["cafe-el-caracol", "vercel", "app"].join(".");
for (const relativePath of ["services", "assets", "components", "admin", "rrhh"]) {
    const directory = path.join(projectRoot, relativePath);
    if (!fs.existsSync(directory)) continue;

    const pending = [directory];
    while (pending.length) {
        const current = pending.pop();
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            const absolutePath = path.join(current, entry.name);
            if (entry.isDirectory()) pending.push(absolutePath);
            if (
                entry.isFile() &&
                [".js", ".html"].includes(path.extname(entry.name)) &&
                fs.readFileSync(absolutePath, "utf8").includes(forbiddenHost)
            ) {
                failures.push(`${path.relative(projectRoot, absolutePath)} conserva el dominio anterior.`);
            }
        }
    }
}

if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
}

console.log(`[validate] JavaScript correcto: ${checkedJavaScript} archivos.`);
console.log(`[validate] JSON correcto: ${checkedJson} archivos.`);
console.log(`[validate] Referencias locales correctas: ${checkedLocalReferences}.`);
console.log("[validate] Configuración portable correcta.");
