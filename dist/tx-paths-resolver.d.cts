import * as ts from "typescript";
export interface PathsConfig {
    baseUrl?: string;
    paths?: Record<string, string[]>;
    tsconfigDir: string;
    rootDir: string;
}
export declare const createPathsResolverTransformer: (config: PathsConfig) => ts.TransformerFactory<ts.SourceFile | ts.Bundle>;
//# sourceMappingURL=tx-paths-resolver.d.ts.map