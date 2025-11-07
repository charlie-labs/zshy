import * as ts from "typescript";
// Create export = to export default transformer for ESM builds
export const createExportEqualsTransformer = () => (context) => {
    return (sourceFile) => {
        const visitor = (node) => {
            // Handle export = syntax
            if (ts.isExportAssignment(node) && node.isExportEquals) {
                return ts.factory.createExportDefault(node.expression);
            }
            return ts.visitEachChild(node, visitor, context);
        };
        return ts.visitNode(sourceFile, visitor);
    };
};
//# sourceMappingURL=tx-export-equals.js.map