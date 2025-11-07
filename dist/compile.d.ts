import * as ts from "typescript";
export interface BuildContext {
    writtenFiles: Set<string>;
    copiedAssets: Set<string>;
    errorCount: number;
    warningCount: number;
}
export interface ProjectOptions {
    configPath: string;
    compilerOptions: ts.CompilerOptions & Required<Pick<ts.CompilerOptions, "module" | "moduleResolution" | "outDir">>;
    ext: "cjs" | "js" | "mjs";
    format: "cjs" | "esm";
    pkgJsonDir: string;
    rootDir: string;
    verbose: boolean;
    dryRun: boolean;
    cjsInterop?: boolean;
    paths?: Record<string, string[]>;
    baseUrl?: string;
}
export declare function compileProject(config: ProjectOptions, entryPoints: string[], ctx: BuildContext): Promise<void>;
//# sourceMappingURL=compile.d.ts.map