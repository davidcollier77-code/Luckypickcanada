import * as matchers from '@testing-library/jest-dom/matchers';
import { expect, vi } from 'vitest';

expect.extend(matchers);

// Mock getSql and other db/CF stuff so they don't break our pure function test
vi.mock('./app/lib/db-init', () => ({
  getSql: vi.fn(),
  initializeDatabase: vi.fn()
}));
vi.mock('./app/lib/kv-cache', () => ({
  cached: vi.fn(),
  cacheKey: vi.fn(),
  invalidate: vi.fn()
}));
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn()
}));
