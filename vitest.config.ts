import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{js,ts}'],
    // The property tests make thousands of languages; leave them room on a busy machine.
    testTimeout: 60_000,
  },
});
