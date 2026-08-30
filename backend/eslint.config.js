// Flat config (ESLint 10 default). typescript-eslint resolves the compiler
// API through the "typescript" package name — see package.json's
// devDependencies for why that's aliased to the @typescript/typescript6
// compatibility package rather than real TypeScript 7 (typescript-eslint
// doesn't support TS7's programmatic API yet).
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "drizzle/**", "coverage/**"],
  },
  // Plain JS recommended rules everywhere (including this file itself,
  // which is intentionally NOT type-aware linted below — it isn't part
  // of tsconfig.eslint.json's "include", and doesn't need to be).
  js.configs.recommended,
  // Type-aware TS rules — scoped to **/*.ts only. Without this `files`
  // scope, typescript-eslint's type-aware parser tries to resolve every
  // linted file (including this .js config and drizzle.config.ts if it
  // weren't covered) against tsconfig.eslint.json's project graph and
  // throws a parsing error for anything outside it.
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["**/*.ts"],
  })),
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        // A dedicated lint-only tsconfig (extends the real one) so src/,
        // scripts/, tests/, and drizzle.config.ts are all covered —
        // tsconfig.json itself intentionally only includes src/** for
        // the production build (rootDir: "src").
        project: "./tsconfig.eslint.json",
      },
    },
    rules: {
      // This codebase leans on `unknown`/explicit casts at API boundaries
      // (Razorpay SDK responses, JSON columns, request bodies before Zod
      // parsing) rather than `any` — keep that real, but don't fail the
      // whole build on the handful of `no-explicit-any` cases that predate
      // this config. Tighten once the codebase has been swept for `any`.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
  {
    // node:test's `test(name, fn)` returns a Promise that the test runner
    // itself awaits/schedules — every top-level `test(...)` call in these
    // files is intentionally "unawaited" from the file's own point of
    // view, so no-floating-promises' 77 hits here are a known false
    // positive for this exact pattern (test-runner registration calls),
    // not real unhandled-rejection risk. Real floating-promise bugs
    // elsewhere in src/ are still caught — this override is scoped to
    // tests/** only.
    files: ["tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
    },
  }
);
