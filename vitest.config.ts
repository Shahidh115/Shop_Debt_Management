import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/shared/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@shopledger/shared': path.resolve(__dirname, 'packages/shared/index.ts'),
    },
  },
});

