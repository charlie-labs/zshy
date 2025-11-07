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
exports.createExtensionRewriteTransformer = void 0;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const ts = __importStar(require("typescript"));
const utils = __importStar(require("./utils.cjs"));
const createExtensionRewriteTransformer = (config) => (context) => {
    return (sourceFile) => {
        const visitor = (node) => {
            const isImport = ts.isImportDeclaration(node);
            const isExport = ts.isExportDeclaration(node);
            const isDynamicImport = ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword;
            let originalText;
            if (isImport || isExport || isDynamicImport) {
                if (isImport || isExport) {
                    if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) {
                        return ts.visitEachChild(node, visitor, context);
                    }
                    originalText = node.moduleSpecifier.text;
                }
                else if (isDynamicImport) {
                    const arg = node.arguments[0];
                    if (!ts.isStringLiteral(arg)) {
                        // continue
                        return ts.visitEachChild(node, visitor, context);
                    }
                    originalText = arg.text;
                }
                else {
                    // If it's not an import, export, or dynamic import, just visit children
                    return ts.visitEachChild(node, visitor, context);
                }
                const isRelativeImport = originalText.startsWith("./") || originalText.startsWith("../");
                if (!isRelativeImport) {
                    // If it's not a relative import, don't transform it
                    return node;
                }
                const ext = path.extname(originalText).toLowerCase();
                // rewrite .js to resolved js extension
                if (ext === ".js" || ext === ".ts") {
                    const newText = originalText.slice(0, -3) + config.ext;
                    if (isImport) {
                        return ts.factory.updateImportDeclaration(node, node.modifiers, node.importClause, ts.factory.createStringLiteral(newText), node.assertClause);
                    }
                    else if (isExport) {
                        return ts.factory.updateExportDeclaration(node, node.modifiers, node.isTypeOnly, node.exportClause, ts.factory.createStringLiteral(newText), node.assertClause);
                    }
                    else if (isDynamicImport) {
                        return ts.factory.updateCallExpression(node, node.expression, node.typeArguments, [
                            ts.factory.createStringLiteral(newText),
                            ...node.arguments.slice(1),
                        ]);
                    }
                }
                // rewrite extensionless imports to .js
                if (ext === "") {
                    // Check filesystem to determine if we should resolve to file.ts or directory/index.ts
                    let newText = originalText + config.ext;
                    if (ts.isSourceFile(sourceFile)) {
                        const sourceFileDir = path.dirname(sourceFile.fileName);
                        const resolvedPath = path.resolve(sourceFileDir, originalText);
                        // Check if the extensionless import refers to a file (e.g., d.ts)
                        const potentialFile = resolvedPath + ".ts";
                        const potentialIndexFile = path.join(resolvedPath, "index.ts");
                        if (fs.existsSync(potentialIndexFile) && !fs.existsSync(potentialFile)) {
                            // Directory with index.ts exists, use index path
                            newText = originalText + "/index" + config.ext;
                        }
                        // Otherwise, use the default behavior (originalText + config.ext)
                    }
                    if (isImport) {
                        return ts.factory.updateImportDeclaration(node, node.modifiers, node.importClause, ts.factory.createStringLiteral(newText), node.assertClause);
                    }
                    else if (isExport) {
                        return ts.factory.updateExportDeclaration(node, node.modifiers, node.isTypeOnly, node.exportClause, ts.factory.createStringLiteral(newText), node.assertClause);
                    }
                    else if (isDynamicImport) {
                        return ts.factory.updateCallExpression(node, node.expression, node.typeArguments, [
                            ts.factory.createStringLiteral(newText),
                            ...node.arguments.slice(1),
                        ]);
                    }
                }
                // copy asset files
                if (utils.isAssetFile(originalText)) {
                    // it's an asset
                    if (ts.isSourceFile(sourceFile)) {
                        const sourceFileDir = path.dirname(sourceFile.fileName);
                        const resolvedAssetPath = path.resolve(sourceFileDir, originalText);
                        // Make it relative to the source root (rootDir)
                        const relAssetPath = path.relative(config.rootDir, resolvedAssetPath);
                        // Track asset import if callback provided
                        if (config.onAssetImport) {
                            config.onAssetImport(relAssetPath);
                        }
                    }
                    // Don't transform asset dynamic imports, leave them as-is
                    return node;
                }
            }
            return ts.visitEachChild(node, visitor, context);
        };
        return ts.visitNode(sourceFile, visitor);
    };
};
exports.createExtensionRewriteTransformer = createExtensionRewriteTransformer;
//# sourceMappingURL=tx-extension-rewrite.js.map