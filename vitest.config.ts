import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
    include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'test/e2e'],
    coverage: {
      provider: 'v8',
      include: ['hooks/**', 'lib/**', 'app/api/**'],
      exclude: ['node_modules', '.next'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
