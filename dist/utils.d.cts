import * as ts from "typescript";
export declare function formatForLog(data: unknown): string;
export declare function emojiLog(_emoji: string, content: string, level?: "log" | "warn" | "error"): void;
export declare function isSourceFile(filePath: string): boolean;
export declare function removeExtension(filePath: string): string;
export declare function readTsconfig(tsconfigPath: string): ts.CompilerOptions;
export declare const jsExtensions: Set<string>;
export declare function isAssetFile(filePath: string): boolean;
export declare const toPosix: (p: string) => string;
export declare const relativePosix: (from: string, to: string) => string;
//# sourceMappingURL=utils.d.ts.map