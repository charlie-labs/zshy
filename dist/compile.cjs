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
exports.compileProject = compileProject;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const ts = __importStar(require("typescript"));
const tx_cjs_interop_js_1 = require("./tx-cjs-interop.cjs");
const tx_cjs_interop_declaration_js_1 = require("./tx-cjs-interop-declaration.cjs");
const tx_export_equals_js_1 = require("./tx-export-equals.cjs");
const tx_extension_rewrite_js_1 = require("./tx-extension-rewrite.cjs");
const tx_import_meta_shim_js_1 = require("./tx-import-meta-shim.cjs");
const tx_paths_resolver_js_1 = require("./tx-paths-resolver.cjs");
const utils = __importStar(require("./utils.cjs"));
async function compileProject(config, entryPoints, ctx) {
    // Deduplicate entry points before compilation
    // Track asset imports encountered during transformation
    const assetImports = new Set();
    // Create compiler host
    const host = ts.createCompilerHost(config.compilerOptions);
    const originalWriteFile = host.writeFile;
    const jsExt = "." + config.ext;
    const dtsExt = config.ext === "mjs" ? ".d.mts" : config.ext === "cjs" ? ".d.cts" : ".d.ts";
    // Track if we should write files (will be set after diagnostics check)
    let shouldWriteFiles = true;
    host.writeFile = (fileName, data, writeByteOrderMark, onError, sourceFiles) => {
        // Transform output file extensions
        let outputFileName = fileName;
        const processedData = data;
        if (fileName.endsWith(".js")) {
            outputFileName = fileName.replace(/\.js$/, jsExt);
        }
        if (fileName.endsWith(".d.ts")) {
            outputFileName = fileName.replace(/\.d\.ts$/, dtsExt);
        }
        // Handle source map files
        if (fileName.endsWith(".js.map")) {
            outputFileName = fileName.replace(/\.js\.map$/, jsExt + ".map");
        }
        if (fileName.endsWith(".d.ts.map")) {
            outputFileName = fileName.replace(/\.d\.ts\.map$/, dtsExt + ".map");
        }
        // Track the file that would be written
        ctx.writtenFiles.add(outputFileName);
        if (!config.dryRun && shouldWriteFiles && originalWriteFile) {
            originalWriteFile(outputFileName, processedData, writeByteOrderMark, onError, sourceFiles);
        }
    };
    // Create the TypeScript program using unique entry points
    // For CJS builds, set noEmitOnError to false to allow emission despite ts1343 errors
    const programOptions = config.compilerOptions;
    const program = ts.createProgram({
        rootNames: entryPoints,
        options: programOptions,
        host,
    });
    // Create a transformer factory to resolve tsconfig paths
    const pathsResolverTransformer = config.paths
        ? (0, tx_paths_resolver_js_1.createPathsResolverTransformer)({
            baseUrl: config.baseUrl,
            paths: config.paths,
            tsconfigDir: path.dirname(config.configPath),
            rootDir: config.rootDir,
        })
        : null;
    // Create a transformer factory to rewrite extensions
    const extensionRewriteTransformer = (0, tx_extension_rewrite_js_1.createExtensionRewriteTransformer)({
        rootDir: config.rootDir,
        ext: jsExt,
        onAssetImport: (assetPath) => {
            assetImports.add(assetPath);
        },
    });
    // Check for semantic errors
    const diagnostics = ts.getPreEmitDiagnostics(program);
    if (diagnostics.length > 0) {
        // Filter out ts1343 errors for CJS builds
        const filteredDiagnostics = diagnostics.filter((d) => {
            if (config.format === "cjs") {
                return d.code !== 1343 && d.code !== 1259;
            }
        }); // Ignore ts1343 (import.meta not available) for CJS
        const errorCount = filteredDiagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error).length;
        const warningCount = filteredDiagnostics.filter((d) => d.category === ts.DiagnosticCategory.Warning).length;
        // Update the build context with error and warning counts
        ctx.errorCount += errorCount;
        ctx.warningCount += warningCount;
        // Set shouldWriteFiles to false if there are errors (excluding ts1343 for CJS)
        if (errorCount > 0) {
            shouldWriteFiles = false;
        }
        if (errorCount > 0 || warningCount > 0) {
            utils.emojiLog("⚠️", `Found ${errorCount} error(s) and ${warningCount} warning(s)`, "warn");
        }
        // Format diagnostics with color and context like tsc, keeping original order
        const formatHost = {
            getCurrentDirectory: () => process.cwd(),
            getCanonicalFileName: (fileName) => fileName,
            getNewLine: () => ts.sys.newLine,
        };
        // Keep errors and warnings intermixed in their original order
        const relevantDiagnostics = filteredDiagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error || d.category === ts.DiagnosticCategory.Warning);
        if (relevantDiagnostics.length > 0) {
            console.log(ts.formatDiagnosticsWithColorAndContext(relevantDiagnostics, formatHost));
        }
    }
    // Prepare transformers
    const before = [];
    // Add paths resolver transformer first if paths are configured
    if (pathsResolverTransformer) {
        before.push(pathsResolverTransformer);
    }
    // Then add extension rewriter
    before.push(extensionRewriteTransformer);
    const after = [];
    const afterDeclarations = [];
    // Add transformers for declarations
    if (pathsResolverTransformer) {
        afterDeclarations.push(pathsResolverTransformer);
    }
    afterDeclarations.push(extensionRewriteTransformer);
    // Add import.meta shim transformer for CJS builds
    if (config.format === "cjs") {
        before.unshift((0, tx_import_meta_shim_js_1.createImportMetaShimTransformer)());
    }
    // Add export = to export default transformer for ESM builds
    if (config.format === "esm") {
        (0, tx_export_equals_js_1.createExportEqualsTransformer)();
        // before.push(createExportEqualsTransformer<ts.SourceFile>());
        // afterDeclarations.push(createExportEqualsTransformer<ts.SourceFile | ts.Bundle>());
    }
    // Add CJS interop transformer for single default exports
    if (config.cjsInterop && config.format === "cjs") {
        if (config.verbose) {
            utils.emojiLog("🔄", `Enabling CJS interop transform...`);
        }
        before.push((0, tx_cjs_interop_js_1.createCjsInteropTransformer)());
    }
    // Add CJS interop transformer for declaration files (export = transformation)
    if (config.cjsInterop && config.format === "cjs") {
        afterDeclarations.push((0, tx_cjs_interop_declaration_js_1.createCjsInteropDeclarationTransformer)());
    }
    // emit the files
    const emitResult = program.emit(undefined, undefined, undefined, undefined, {
        before,
        after,
        afterDeclarations,
    });
    if (emitResult.emitSkipped) {
        utils.emojiLog("❌", "Emit was skipped due to errors", "error");
    }
    else {
        // console.log(`✅ Emitted ${config.jsExtension} and ${config.dtsExtension}
        // files`);
    }
    // Report any emit diagnostics
    if (emitResult.diagnostics.length > 0) {
        // Filter out ts1343 errors for CJS builds
        const filteredEmitDiagnostics = config.format === "cjs"
            ? emitResult.diagnostics.filter((d) => d.code !== 1343) // Ignore ts1343 for CJS
            : emitResult.diagnostics;
        const emitErrors = filteredEmitDiagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error);
        const emitWarnings = filteredEmitDiagnostics.filter((d) => d.category === ts.DiagnosticCategory.Warning);
        // Update the build context with emit error and warning counts
        ctx.errorCount += emitErrors.length;
        ctx.warningCount += emitWarnings.length;
        utils.emojiLog("❌", `Found ${emitErrors.length} error(s) and ${emitWarnings.length} warning(s) during emit:`, "error");
        console.log();
        const formatHost = {
            getCurrentDirectory: () => process.cwd(),
            getCanonicalFileName: (fileName) => fileName,
            getNewLine: () => ts.sys.newLine,
        };
        // Keep errors and warnings intermixed in their original order
        const relevantEmitDiagnostics = filteredEmitDiagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error || d.category === ts.DiagnosticCategory.Warning);
        if (relevantEmitDiagnostics.length > 0) {
            console.log(ts.formatDiagnosticsWithColorAndContext(relevantEmitDiagnostics, formatHost));
        }
    }
    // Copy assets if any were found and rootDir is provided
    if (assetImports.size > 0) {
        if (config.verbose) {
            utils.emojiLog("📄", `Found ${assetImports.size} asset import(s), copying to output directory...`);
        }
        // utils.copyAssets(assetImports, config, ctx);
        for (const assetPath of assetImports) {
            try {
                // Asset paths are now relative to rootDir
                const sourceFile = path.resolve(config.rootDir, assetPath);
                if (!fs.existsSync(sourceFile)) {
                    if (config.verbose) {
                        utils.emojiLog("⚠️", `Asset not found: ${assetPath} (resolved to ${sourceFile})`, "warn");
                    }
                    continue;
                }
                // Create the destination path in outDir, maintaining the same relative structure
                const destFile = path.resolve(config.compilerOptions.outDir, assetPath);
                const posixDestFile = utils.toPosix(destFile);
                // Skip if this asset has already been copied
                if (ctx.copiedAssets.has(posixDestFile)) {
                    continue;
                }
                const destDir = path.dirname(destFile);
                // Track the file that would be copied
                // Use posix paths here because typescript also outputs them posix
                // style.
                ctx.writtenFiles.add(posixDestFile);
                ctx.copiedAssets.add(posixDestFile);
                if (!config.dryRun) {
                    // Ensure destination directory exists
                    fs.mkdirSync(destDir, { recursive: true });
                    // Copy the file
                    fs.copyFileSync(sourceFile, destFile);
                }
                if (config.verbose) {
                    const relativeSource = config.pkgJsonDir ? utils.relativePosix(config.pkgJsonDir, sourceFile) : sourceFile;
                    const relativeDest = config.pkgJsonDir ? utils.relativePosix(config.pkgJsonDir, destFile) : destFile;
                    utils.emojiLog("📄", `${config.dryRun ? "[dryrun] " : ""}Copied asset: ./${relativeSource} → ./${relativeDest}`);
                }
            }
            catch (error) {
                utils.emojiLog("❌", `Failed to copy asset ${assetPath}: ${error}`, "error");
            }
        }
    }
}
//# sourceMappingURL=compile.js.map