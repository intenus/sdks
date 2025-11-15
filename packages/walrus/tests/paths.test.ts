import { describe, it, expect } from 'vitest';
import { StoragePathBuilder } from '../src/utils/paths.js';

describe('StoragePathBuilder', () => {
  it('should build intent path', () => {
    const path = StoragePathBuilder.build('intent', 'intent_001');
    expect(path).toBe('/intents/intent_001.json');
  });

  it('should build solution path', () => {
    const path = StoragePathBuilder.build('solution', 'sol_001');
    expect(path).toBe('/solutions/sol_001.json');
  });

  it('should build feedback path', () => {
    const path = StoragePathBuilder.build('feedback', 'fb_001');
    expect(path).toBe('/feedback/fb_001.json');
  });

  it('should build training sample path', () => {
    const path = StoragePathBuilder.build('trainingSample', 'v1.0', 'sample_001');
    expect(path).toBe('/training_data/v1.0/sample_001.json');
  });

  it('should build model metadata path', () => {
    const path = StoragePathBuilder.build('modelMetadata', 'v1.0.0');
    expect(path).toBe('/models/v1.0.0/metadata.json');
  });

  it('should build model weights path', () => {
    const path = StoragePathBuilder.build('modelWeights', 'v1.0.0');
    expect(path).toBe('/models/v1.0.0/weights.pkl');
  });

  it('should build model latest path', () => {
    const path = StoragePathBuilder.build('modelLatest');
    expect(path).toBe('/models/latest.json');
  });

  it('should throw error for unknown path type', () => {
    expect(() => {
      StoragePathBuilder.build('unknown' as any);
    }).toThrow('Unknown path type: unknown');
  });
});
