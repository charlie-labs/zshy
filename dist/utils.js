import * as path from "node:path";
import { createRequire } from "node:module";
import * as ts from "typescript";
export function formatForLog(data) {
    return JSON.stringify(data, null, 2).split("\n").join("\n   ");
}
export function emojiLog(_emoji, content, level = "log") {
    console[level]("»  " + content);
}
export function isSourceFile(filePath) {
    // Declaration files are not source files
    if (filePath.endsWith(".d.ts") || filePath.endsWith(".d.mts") || filePath.endsWith(".d.cts")) {
        return false;
    }
    // TypeScript source files
    return (filePath.endsWith(".ts") || filePath.endsWith(".mts") || filePath.endsWith(".cts") || filePath.endsWith(".tsx"));
}
export function removeExtension(filePath) {
    return filePath.split(".").slice(0, -1).join(".") || filePath;
}
export function readTsconfig(tsconfigPath) {
    // Read and parse tsconfig.json
    const configPath = path.resolve(tsconfigPath);
    const configDir = path.dirname(configPath);
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    if (configFile.error) {
        console.error("Error reading tsconfig.json:", ts.formatDiagnostic(configFile.error, {
            getCurrentDirectory: () => configDir,
            getCanonicalFileName: (fileName) => fileName,
            getNewLine: () => ts.sys.newLine,
        }));
        process.exit(1);
    }
    // Normalize "extends" entries that reference node_modules packages so older
    // TypeScript versions (or environments without JSON export support) can
    // resolve configs like "tsconfig/bun.json" via Node's module resolution.
    normalizeExtends(configFile.config, configDir);
    // Parse the config with explicit base path
    const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, {
        ...ts.sys,
        // Override getCurrentDirectory to use the tsconfig directory
        getCurrentDirectory: () => configDir,
    }, configDir);
    if (parsedConfig.errors.length > 0) {
        emojiLog("❌", "Error parsing tsconfig.json:", "error");
        for (const error of parsedConfig.errors) {
            console.error(ts.formatDiagnostic(error, {
                getCurrentDirectory: () => configDir,
                getCanonicalFileName: (fileName) => fileName,
                getNewLine: () => ts.sys.newLine,
            }));
        }
        process.exit(1);
    }
    if (!parsedConfig.options) {
        emojiLog("❌", "Error reading tsconfig.json#/compilerOptions", "error");
        process.exit(1);
    }
    return parsedConfig.options;
}
function normalizeExtends(config, configDir) {
    if (!config)
        return;
    const value = config.extends;
    if (value === undefined)
        return;
    if (typeof value === "string") {
        const resolved = resolveExtendsSpecifier(value, configDir);
        if (resolved) {
            config.extends = resolved;
        }
    }
    else if (Array.isArray(value)) {
        const updated = [];
        let changed = false;
        for (const entry of value) {
            if (typeof entry === "string") {
                const resolved = resolveExtendsSpecifier(entry, configDir);
                if (resolved) {
                    updated.push(resolved);
                    changed = true;
                }
                else {
                    updated.push(entry);
                }
            }
            else {
                updated.push(entry);
            }
        }
        if (changed) {
            config.extends = updated;
        }
    }
}
function resolveExtendsSpecifier(specifier, configDir) {
    // Only rewrite bare module specifiers (and subpaths); relative and absolute
    // paths are left untouched for TypeScript to handle.
    // NOTE: This focuses on explicit subpaths like "pkg/tsconfig.json". It does
    // not implement full package "exports" resolution for bare specifiers.
    if (specifier.startsWith("./") || specifier.startsWith("../") || path.isAbsolute(specifier)) {
        return undefined;
    }
    try {
        const nodeRequire = createRequire(path.join(configDir, "tsconfig.json"));
        const candidates = [specifier];
        if (!specifier.endsWith(".json") && !specifier.endsWith(".jsonc")) {
            candidates.push(`${specifier}.json`, `${specifier}.jsonc`);
        }
        for (const candidate of candidates) {
            try {
                return nodeRequire.resolve(candidate);
            }
            catch {
                // Try next candidate
            }
        }
    }
    catch {
        // Ignore resolution failures and fall back to TypeScript's behavior
    }
    return undefined;
}
export const jsExtensions = new Set([".js", ".mjs", ".cjs", ".ts", ".mts", ".cts", ".tsx"]);
export function isAssetFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === "")
        return false;
    return !jsExtensions.has(ext);
}
export const toPosix = (p) => p.replaceAll(path.sep, path.posix.sep);
export const relativePosix = (from, to) => {
    const relativePath = path.relative(from, to);
    return toPosix(relativePath);
};
//# sourceMappingURL=utils.js.map