import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true, // Enable type definitions
  clean: true,
  sourcemap: true,
  target: 'es2022',
  external: ['@mysten/seal', '@mysten/sui', '@intenus/common'],
});
