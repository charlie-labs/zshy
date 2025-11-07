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
exports.createImportMetaShimTransformer = void 0;
const ts = __importStar(require("typescript"));
// Create import.meta shim transformer for CJS builds
const createImportMetaShimTransformer = () => (context) => {
    return (sourceFile) => {
        const visitor = (node) => {
            // Handle import.meta.url
            if (ts.isPropertyAccessExpression(node) &&
                ts.isMetaProperty(node.expression) &&
                node.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
                node.name.text === "url") {
                return ts.factory.createCallExpression(ts.factory.createPropertyAccessExpression(ts.factory.createCallExpression(ts.factory.createIdentifier("require"), undefined, [
                    ts.factory.createStringLiteral("url"),
                ]), ts.factory.createIdentifier("pathToFileURL")), undefined, [ts.factory.createIdentifier("__filename")]);
            }
            // Handle import.meta.dirname
            if (ts.isPropertyAccessExpression(node) &&
                ts.isMetaProperty(node.expression) &&
                node.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
                node.name.text === "dirname") {
                return ts.factory.createIdentifier("__dirname");
            }
            // Handle import.meta.filename
            if (ts.isPropertyAccessExpression(node) &&
                ts.isMetaProperty(node.expression) &&
                node.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
                node.name.text === "filename") {
                return ts.factory.createIdentifier("__filename");
            }
            return ts.visitEachChild(node, visitor, context);
        };
        return ts.visitNode(sourceFile, visitor);
    };
};
exports.createImportMetaShimTransformer = createImportMetaShimTransformer;
//# sourceMappingURL=tx-import-meta-shim.js.map