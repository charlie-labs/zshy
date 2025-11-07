"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.relativePosix = exports.toPosix = exports.jsExtensions = void 0;
exports.formatForLog = formatForLog;
exports.emojiLog = emojiLog;
exports.isSourceFile = isSourceFile;
exports.removeExtension = removeExtension;
exports.readTsconfig = readTsconfig;
exports.isAssetFile = isAssetFile;
const path = __importStar(require("node:path"));
const ts = __importStar(require("typescript"));
function formatForLog(data) {
    return JSON.stringify(data, null, 2).split("\n").join("\n   ");
}
function emojiLog(_emoji, content, level = "log") {
    console[level]("»  " + content);
}
function isSourceFile(filePath) {
    // Declaration files are not source files
    if (filePath.endsWith(".d.ts") || filePath.endsWith(".d.mts") || filePath.endsWith(".d.cts")) {
        return false;
    }
    // TypeScript source files
    return (filePath.endsWith(".ts") || filePath.endsWith(".mts") || filePath.endsWith(".cts") || filePath.endsWith(".tsx"));
}
function removeExtension(filePath) {
    return filePath.split(".").slice(0, -1).join(".") || filePath;
}
function readTsconfig(tsconfigPath) {
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
exports.jsExtensions = new Set([".js", ".mjs", ".cjs", ".ts", ".mts", ".cts", ".tsx"]);
function isAssetFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === "")
        return false;
    return !exports.jsExtensions.has(ext);
}
const toPosix = (p) => p.replaceAll(path.sep, path.posix.sep);
exports.toPosix = toPosix;
const relativePosix = (from, to) => {
    const relativePath = path.relative(from, to);
    return (0, exports.toPosix)(relativePath);
};
exports.relativePosix = relativePosix;
//# sourceMappingURL=utils.js.map