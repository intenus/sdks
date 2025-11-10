import { describe, it, expect } from 'vitest';
import { StoragePathBuilder } from '../src/utils/paths.js';

describe('StoragePathBuilder', () => {
  it('should build batch manifest path', () => {
    const path = StoragePathBuilder.build('batchManifest', 123);
    expect(path).toBe('/batches/123/batch_manifest.json');
  });

  it('should build batch archive path', () => {
    const path = StoragePathBuilder.build('batchArchive', 123, 'batch_abc');
    expect(path).toBe('/archives/123/batch_batch_abc.json');
  });

  it('should build user history path', () => {
    const path = StoragePathBuilder.build('userHistory', '0x123...');
    expect(path).toBe('/users/0x123.../history_aggregated.json');
  });

  it('should build dataset metadata path', () => {
    const path = StoragePathBuilder.build('datasetMetadata', 'v1.0.0');
    expect(path).toBe('/training/datasets/v1.0.0/dataset_metadata.json');
  });

  it('should build model metadata path', () => {
    const path = StoragePathBuilder.build('modelMetadata', 'user_preference', 'v1.0.0');
    expect(path).toBe('/training/models/user_preference/v1.0.0/model_metadata.json');
  });

  it('should throw error for unknown path type', () => {
    expect(() => {
      StoragePathBuilder.build('unknown' as any);
    }).toThrow('Unknown path type: unknown');
  });
});
