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
exports.analyzeExports = void 0;
const ts = __importStar(require("typescript"));
// Shared function to analyze exports in a source file
const analyzeExports = (sourceFile) => {
    let defaultExportNode = null;
    let hasNamedExports = false;
    const visitor = (node) => {
        // 1) export default <expr>;
        if (ts.isExportAssignment(node) && !node.isExportEquals) {
            defaultExportNode = node;
        }
        // 2) export default function/class/interface/type/enum …
        else if ((ts.isFunctionDeclaration(node) ||
            ts.isClassDeclaration(node) ||
            ts.isInterfaceDeclaration(node) ||
            ts.isTypeAliasDeclaration(node) ||
            ts.isEnumDeclaration(node)) &&
            node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
            node.modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) {
            defaultExportNode = node;
        }
        // 3) named re-exports (`export { a, b } from …` or `export { x }`)
        else if (ts.isExportDeclaration(node) && node.exportClause && !node.isTypeOnly) {
            hasNamedExports = true;
        }
        // 3a) export * from "module" - also counts as named exports
        else if (ts.isExportDeclaration(node) && !node.exportClause && node.moduleSpecifier && !node.isTypeOnly) {
            hasNamedExports = true;
        }
        // 4) named `export const/let/var …`
        else if (ts.isVariableStatement(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
            hasNamedExports = true;
        }
        // 5) named `export function …` (but _not_ default)
        else if (ts.isFunctionDeclaration(node) &&
            node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
            !node.modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) {
            hasNamedExports = true;
        }
        // 6) named `export class …` (but _not_ default)
        else if (ts.isClassDeclaration(node) &&
            node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
            !node.modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) {
            hasNamedExports = true;
        }
        ts.forEachChild(node, visitor);
    };
    ts.forEachChild(sourceFile, visitor);
    return { defaultExportNode, hasNamedExports };
};
exports.analyzeExports = analyzeExports;
//# sourceMappingURL=tx-analyze-exports.js.map