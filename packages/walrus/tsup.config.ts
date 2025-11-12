import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  outExtension: () => ({ js: '.mjs' }),
  external: ['@mysten/walrus', '@mysten/sui'],
});
