import type { Linter } from 'eslint';

export declare const restrictedImports: {
  paths: { name: string; message: string }[];
  patterns: { group: string[]; message: string }[];
};
export declare const restrictedSyntax: { selector: string; message: string }[];

declare const config: Linter.Config[];
export default config;
