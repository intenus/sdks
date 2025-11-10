import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntenusWalrusClient } from '../src/client.js';
import type { IntenusWalrusConfig } from '../src/types/index.js';

// Mock @mysten/walrus
vi.mock('@mysten/walrus', () => ({
  WalrusClient: vi.fn().mockImplementation(() => ({
    writeBlob: vi.fn(),
    readBlob: vi.fn(),
    reset: vi.fn(),
  })),
}));

describe('IntenusWalrusClient', () => {
  let client: IntenusWalrusClient;
  let config: IntenusWalrusConfig;

  beforeEach(() => {
    config = {
      network: 'testnet',
    };
    client = new IntenusWalrusClient(config);
  });

  it('should initialize with default configuration', () => {
    expect(client).toBeInstanceOf(IntenusWalrusClient);
    expect(client.batches).toBeDefined();
    expect(client.archives).toBeDefined();
    expect(client.users).toBeDefined();
    expect(client.training).toBeDefined();
  });

  it('should provide access to underlying Walrus client', () => {
    const walrusClient = client.getWalrusClient();
    expect(walrusClient).toBeDefined();
  });

  it('should handle custom network URLs', () => {
    const customConfig: IntenusWalrusConfig = {
      network: 'testnet',
      publisherUrl: 'https://custom-publisher.example.com',
      aggregatorUrl: 'https://custom-aggregator.example.com',
    };

    const customClient = new IntenusWalrusClient(customConfig);
    expect(customClient).toBeInstanceOf(IntenusWalrusClient);
  });

  it('should throw error for unknown network', () => {
    expect(() => {
      new IntenusWalrusClient({
        network: 'unknown' as any,
      });
    }).toThrow('Unknown network: unknown');
  });
});
