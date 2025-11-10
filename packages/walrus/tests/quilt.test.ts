import { describe, it, expect } from 'vitest';
import {
  createQuiltBlob,
  batchIntentsToQuilt,
  batchSolutionsToQuilt,
  batchTrainingDataToQuilt,
  calculateQuiltSavings,
  shouldUseQuilt,
  parsePatchIdentifier
} from '../src/utils/quilt.js';

describe('Quilt Utilities', () => {
  describe('createQuiltBlob', () => {
    it('should create QuiltBlob from JSON data', () => {
      const data = { test: 'data', value: 123 };
      const blob = createQuiltBlob('test-id', data, { type: 'test' });
      
      expect(blob.identifier).toBe('test-id');
      expect(blob.tags).toEqual({ type: 'test' });
      expect(blob.contents).toBeInstanceOf(Uint8Array);
      
      // Verify data can be reconstructed
      const reconstructed = JSON.parse(Buffer.from(blob.contents).toString());
      expect(reconstructed).toEqual(data);
    });
  });

  describe('batchIntentsToQuilt', () => {
    it('should batch intents into QuiltBlobs', () => {
      const intents = [
        { intent_id: 'intent1', data: { action: 'swap' }, category: 'defi' },
        { intent_id: 'intent2', data: { action: 'lend' }, category: 'lending' }
      ];
      
      const quiltBlobs = batchIntentsToQuilt(intents, 'batch123');
      
      expect(quiltBlobs).toHaveLength(2);
      expect(quiltBlobs[0].identifier).toBe('batch123_intent_intent1');
      expect(quiltBlobs[0].tags).toEqual({
        type: 'intent',
        batch_id: 'batch123',
        intent_id: 'intent1',
        category: 'defi',
        index: '0'
      });
      
      expect(quiltBlobs[1].identifier).toBe('batch123_intent_intent2');
      expect(quiltBlobs[1].tags?.category).toBe('lending');
    });
  });

  describe('batchSolutionsToQuilt', () => {
    it('should batch solutions into QuiltBlobs', () => {
      const solutions = [
        { solution_id: 'sol1', data: { ptb: 'data1' }, solver_address: '0xsolver1' },
        { solution_id: 'sol2', data: { ptb: 'data2' } }
      ];
      
      const quiltBlobs = batchSolutionsToQuilt(solutions, 'batch123');
      
      expect(quiltBlobs).toHaveLength(2);
      expect(quiltBlobs[0].identifier).toBe('batch123_solution_sol1');
      expect(quiltBlobs[0].tags).toEqual({
        type: 'solution',
        batch_id: 'batch123',
        solution_id: 'sol1',
        solver_address: '0xsolver1',
        index: '0'
      });
      
      expect(quiltBlobs[1].tags?.solver_address).toBe('unknown');
    });
  });

  describe('batchTrainingDataToQuilt', () => {
    it('should batch training data into QuiltBlobs', () => {
      const dataPoints = [
        { id: 'data1', features: [1, 2, 3], labels: [0, 1] },
        { id: 'data2', features: [4, 5, 6], labels: [1, 0] }
      ];
      
      const quiltBlobs = batchTrainingDataToQuilt(dataPoints, 'v1.0.0');
      
      expect(quiltBlobs).toHaveLength(2);
      expect(quiltBlobs[0].identifier).toBe('v1.0.0_data_data1');
      expect(quiltBlobs[0].tags).toEqual({
        type: 'training_data',
        dataset_version: 'v1.0.0',
        data_id: 'data1',
        index: '0'
      });
      
      // Verify data structure
      const reconstructed = JSON.parse(Buffer.from(quiltBlobs[0].contents).toString());
      expect(reconstructed).toEqual({
        features: [1, 2, 3],
        labels: [0, 1]
      });
    });
  });

  describe('calculateQuiltSavings', () => {
    it('should calculate cost savings correctly', () => {
      const savings = calculateQuiltSavings(10, 1024); // 10 blobs, 1KB each
      
      expect(savings.individualCost).toBeGreaterThan(savings.quiltCost);
      expect(savings.savings).toBeGreaterThan(0);
      expect(savings.savingsPercent).toBeGreaterThan(0);
      expect(savings.savingsPercent).toBeLessThan(100);
    });

    it('should show higher savings for more blobs', () => {
      const savings10 = calculateQuiltSavings(10, 1024);
      const savings100 = calculateQuiltSavings(100, 1024);
      
      expect(savings100.savingsPercent).toBeGreaterThan(savings10.savingsPercent);
    });
  });

  describe('shouldUseQuilt', () => {
    it('should recommend Quilt for many small blobs', () => {
      const analysis = shouldUseQuilt(100, 1024); // 100 blobs, 1KB each
      
      expect(analysis.recommended).toBe(true);
      expect(analysis.estimatedSavings).toBeGreaterThan(20);
      expect(analysis.reason).toContain('Significant cost savings');
    });

    it('should not recommend Quilt for single blob', () => {
      const analysis = shouldUseQuilt(1, 1024);
      
      expect(analysis.recommended).toBe(false);
      expect(analysis.reason).toBe('Single blob - no batching benefit');
    });

    it('should not recommend Quilt for too many blobs', () => {
      const analysis = shouldUseQuilt(1000, 1024);
      
      expect(analysis.recommended).toBe(false);
      expect(analysis.reason).toBe('Too many blobs - exceeds Quilt limit of 666');
    });

    it('should not recommend Quilt for large blobs', () => {
      const analysis = shouldUseQuilt(10, 20 * 1024 * 1024); // 20MB blobs
      
      expect(analysis.recommended).toBe(false);
      expect(analysis.reason).toBe('Large blobs - Quilt optimized for small blobs (<10MB)');
    });
  });

  describe('parsePatchIdentifier', () => {
    it('should parse batch intent identifier', () => {
      const parsed = parsePatchIdentifier('batch123_intent_intent456');
      
      expect(parsed).toEqual({
        batchId: 'batch123',
        type: 'intent',
        id: 'intent456'
      });
    });

    it('should parse solution identifier', () => {
      const parsed = parsePatchIdentifier('batch123_solution_sol789');
      
      expect(parsed).toEqual({
        batchId: 'batch123',
        type: 'solution',
        id: 'sol789'
      });
    });

    it('should handle invalid identifier', () => {
      const parsed = parsePatchIdentifier('invalid');
      
      expect(parsed).toEqual({});
    });
  });
});
