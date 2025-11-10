/**
 * Quilt utility functions for batch optimization
 */

import type { QuiltBlob } from '../types/index.js';

/**
 * Create QuiltBlob from JSON data
 */
export function createQuiltBlob(
  identifier: string,
  data: any,
  tags?: Record<string, string>
): QuiltBlob {
  return {
    contents: new Uint8Array(Buffer.from(JSON.stringify(data))),
    identifier,
    tags
  };
}

/**
 * Create QuiltBlob from Buffer
 */
export function createQuiltBlobFromBuffer(
  identifier: string,
  buffer: Buffer,
  tags?: Record<string, string>
): QuiltBlob {
  return {
    contents: new Uint8Array(buffer),
    identifier,
    tags
  };
}

/**
 * Batch intents into QuiltBlobs
 */
export function batchIntentsToQuilt(
  intents: Array<{ intent_id: string; data: any; category?: string }>,
  batchId: string
): QuiltBlob[] {
  return intents.map((intent, index) => ({
    contents: new Uint8Array(Buffer.from(JSON.stringify(intent.data))),
    identifier: `${batchId}_intent_${intent.intent_id}`,
    tags: {
      type: 'intent',
      batch_id: batchId,
      intent_id: intent.intent_id,
      category: intent.category || 'unknown',
      index: index.toString()
    }
  }));
}

/**
 * Batch solutions into QuiltBlobs
 */
export function batchSolutionsToQuilt(
  solutions: Array<{ solution_id: string; data: any; solver_address?: string }>,
  batchId: string
): QuiltBlob[] {
  return solutions.map((solution, index) => ({
    contents: new Uint8Array(Buffer.from(JSON.stringify(solution.data))),
    identifier: `${batchId}_solution_${solution.solution_id}`,
    tags: {
      type: 'solution',
      batch_id: batchId,
      solution_id: solution.solution_id,
      solver_address: solution.solver_address || 'unknown',
      index: index.toString()
    }
  }));
}

/**
 * Batch training data into QuiltBlobs
 */
export function batchTrainingDataToQuilt(
  dataPoints: Array<{ id: string; features: any; labels: any }>,
  datasetVersion: string
): QuiltBlob[] {
  return dataPoints.map((point, index) => ({
    contents: new Uint8Array(Buffer.from(JSON.stringify({
      features: point.features,
      labels: point.labels
    }))),
    identifier: `${datasetVersion}_data_${point.id}`,
    tags: {
      type: 'training_data',
      dataset_version: datasetVersion,
      data_id: point.id,
      index: index.toString()
    }
  }));
}

/**
 * Calculate storage cost savings with Quilt
 */
export function calculateQuiltSavings(
  blobCount: number,
  averageBlobSize: number
): {
  individualCost: number;
  quiltCost: number;
  savings: number;
  savingsPercent: number;
} {
  // Simplified cost calculation (actual costs depend on Sui gas prices)
  const BASE_COST_PER_BLOB = 1000; // Base cost units
  const SIZE_COST_PER_KB = 10; // Cost per KB
  
  const avgSizeKB = averageBlobSize / 1024;
  const individualCost = blobCount * (BASE_COST_PER_BLOB + (avgSizeKB * SIZE_COST_PER_KB));
  
  // Quilt has single base cost + total size cost
  const totalSizeKB = (blobCount * averageBlobSize) / 1024;
  const quiltCost = BASE_COST_PER_BLOB + (totalSizeKB * SIZE_COST_PER_KB);
  
  const savings = individualCost - quiltCost;
  const savingsPercent = (savings / individualCost) * 100;
  
  return {
    individualCost,
    quiltCost,
    savings,
    savingsPercent
  };
}

/**
 * Determine if Quilt is beneficial for given data
 */
export function shouldUseQuilt(
  blobCount: number,
  averageBlobSize: number
): {
  recommended: boolean;
  reason: string;
  estimatedSavings?: number;
} {
  if (blobCount < 2) {
    return {
      recommended: false,
      reason: 'Single blob - no batching benefit'
    };
  }
  
  if (blobCount > 666) {
    return {
      recommended: false,
      reason: 'Too many blobs - exceeds Quilt limit of 666'
    };
  }
  
  if (averageBlobSize > 10 * 1024 * 1024) { // 10MB
    return {
      recommended: false,
      reason: 'Large blobs - Quilt optimized for small blobs (<10MB)'
    };
  }
  
  const savings = calculateQuiltSavings(blobCount, averageBlobSize);
  
  if (savings.savingsPercent > 20) {
    return {
      recommended: true,
      reason: `Significant cost savings: ${savings.savingsPercent.toFixed(1)}%`,
      estimatedSavings: savings.savingsPercent
    };
  }
  
  return {
    recommended: false,
    reason: `Minimal savings: ${savings.savingsPercent.toFixed(1)}%`
  };
}

/**
 * Parse patch identifier to extract metadata
 */
export function parsePatchIdentifier(identifier: string): {
  batchId?: string;
  type?: string;
  id?: string;
} {
  const parts = identifier.split('_');
  
  if (parts.length >= 3) {
    return {
      batchId: parts[0],
      type: parts[1],
      id: parts[2]
    };
  }
  
  return {};
}
