import * as ts from "typescript";
export declare const createExtensionRewriteTransformer: (config: {
    rootDir: string;
    ext: string;
    onAssetImport?: (assetPath: string) => void;
}) => ts.TransformerFactory<ts.SourceFile | ts.Bundle>;
//# sourceMappingURL=tx-extension-rewrite.d.ts.map