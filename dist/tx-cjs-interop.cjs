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
exports.createCjsInteropTransformer = void 0;
const ts = __importStar(require("typescript"));
const tx_analyze_exports_js_1 = require("./tx-analyze-exports.cjs");
const createCjsInteropTransformer = () => (context) => {
    return (sourceFile) => {
        if (!ts.isSourceFile(sourceFile))
            return sourceFile;
        const { defaultExportNode, hasNamedExports } = (0, tx_analyze_exports_js_1.analyzeExports)(sourceFile);
        // Only apply transformation if we have exactly one default export and no named exports
        const shouldApplyInterop = defaultExportNode && !hasNamedExports;
        if (!shouldApplyInterop) {
            return sourceFile;
        }
        const visitor = (node) => {
            // Add module.exports = exports.default at the end of the file
            if (ts.isSourceFile(node)) {
                const statements = [...node.statements];
                // Add the CJS interop line at the end
                statements.push(ts.factory.createExpressionStatement(ts.factory.createAssignment(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier("module"), ts.factory.createIdentifier("exports")), ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier("exports"), ts.factory.createIdentifier("default")))));
                return ts.factory.updateSourceFile(node, statements, node.isDeclarationFile, node.referencedFiles, node.typeReferenceDirectives, node.hasNoDefaultLib, node.libReferenceDirectives);
            }
            return ts.visitEachChild(node, visitor, context);
        };
        return ts.visitNode(sourceFile, visitor);
    };
};
exports.createCjsInteropTransformer = createCjsInteropTransformer;
//# sourceMappingURL=tx-cjs-interop.js.map