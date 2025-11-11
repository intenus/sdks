/**
 * Training data storage service
 */

import type { Signer } from '@mysten/sui/cryptography';
import { StoragePathBuilder } from '../utils/paths.js';
import { batchTrainingDataToQuilt } from '../utils/quilt.js';
import { DEFAULT_EPOCHS, SCHEMA_VERSIONS } from '../constants/index.js';
import type { IntenusWalrusClient } from '../client.js';
import type { TrainingDatasetMetadata, ModelMetadata, StorageResult, QuiltResult } from '../types/index.js';

export class TrainingStorageService {
  constructor(private client: IntenusWalrusClient) {}
  
  async storeDataset(
    version: string,
    features: Buffer,
    labels: Buffer,
    metadata: Partial<TrainingDatasetMetadata>,
    signer: Signer
  ): Promise<StorageResult> {
    // Store features
    const featuresPath = StoragePathBuilder.build('datasetFeatures', version);
    const featuresResult = await this.client.storeRaw(featuresPath, features, DEFAULT_EPOCHS.TRAINING_DATA, signer);
    
    // Store labels
    const labelsPath = StoragePathBuilder.build('datasetLabels', version);
    const labelsResult = await this.client.storeRaw(labelsPath, labels, DEFAULT_EPOCHS.TRAINING_DATA, signer);
    
    // Store metadata
    const fullMetadata: TrainingDatasetMetadata = {
      version,
      created_at: Date.now(),
      features_blob_id: featuresResult.blob_id,
      labels_blob_id: labelsResult.blob_id,
      schema_version: SCHEMA_VERSIONS.TRAINING_DATASET,
      feature_columns: [],
      label_columns: [],
      batch_count: 0,
      intent_count: 0,
      execution_count: 0,
      ...metadata,
    };
    
    const metadataPath = StoragePathBuilder.build('datasetMetadata', version);
    return this.client.storeRaw(
      metadataPath,
      Buffer.from(JSON.stringify(fullMetadata, null, 2)),
      DEFAULT_EPOCHS.TRAINING_DATA,
      signer
    );
  }
  
  async fetchDataset(version: string): Promise<{
    metadata: TrainingDatasetMetadata;
    features: Buffer;
    labels: Buffer;
  }> {
    // Note: This method needs to be updated to work with blob IDs
    // For now, it assumes the version maps to a blob ID
    const metadataBuffer = await this.client.fetchRaw(version + '_metadata');
    const metadata: TrainingDatasetMetadata = JSON.parse(metadataBuffer.toString());
    
    const features = await this.client.fetchRaw(metadata.features_blob_id);
    const labels = await this.client.fetchRaw(metadata.labels_blob_id);
    
    return { metadata, features, labels };
  }
  
  async storeModel(
    name: string,
    version: string,
    model: Buffer,
    metadata: Partial<ModelMetadata>,
    signer: Signer
  ): Promise<StorageResult> {
    // Store model file
    const modelPath = StoragePathBuilder.build('modelFile', name, version);
    const modelResult = await this.client.storeRaw(modelPath, model, DEFAULT_EPOCHS.ML_MODELS, signer);
    
    // Store metadata
    const fullMetadata: ModelMetadata = {
      name,
      version,
      created_at: Date.now(),
      model_blob_id: modelResult.blob_id,
      model_type: metadata.model_type || 'unknown',
      framework: metadata.framework || 'unknown',
      training_dataset_version: metadata.training_dataset_version || 'unknown',
      training_duration_ms: metadata.training_duration_ms || 0,
      metrics: metadata.metrics || {},
      config: metadata.config || { input_shape: [], output_shape: [] },
    };
    
    const metadataPath = StoragePathBuilder.build('modelMetadata', name, version);
    return this.client.storeRaw(
      metadataPath,
      Buffer.from(JSON.stringify(fullMetadata, null, 2)),
      DEFAULT_EPOCHS.ML_MODELS,
      signer
    );
  }
  
  async fetchModel(name: string, version: string): Promise<{
    metadata: ModelMetadata;
    model: Buffer;
  }> {
    // Note: This method needs to be updated to work with blob IDs
    const metadataBuffer = await this.client.fetchRaw(`${name}_${version}_metadata`);
    const metadata: ModelMetadata = JSON.parse(metadataBuffer.toString());
    
    const model = await this.client.fetchRaw(metadata.model_blob_id);
    
    return { metadata, model };
  }
  
  async datasetExists(version: string): Promise<boolean> {
    return this.client.exists(version + '_metadata');
  }
  
  async modelExists(name: string, version: string): Promise<boolean> {
    return this.client.exists(`${name}_${version}_metadata`);
  }
  
  // ===== QUILT METHODS =====
  
  /**
   * Store training data points efficiently using Quilt
   */
  async storeTrainingDataQuilt(
    dataPoints: Array<{ id: string; features: any; labels: any }>,
    datasetVersion: string,
    signer: Signer,
    epochs: number = DEFAULT_EPOCHS.TRAINING_DATA
  ): Promise<QuiltResult> {
    const quiltBlobs = batchTrainingDataToQuilt(dataPoints, datasetVersion);
    return this.client.storeQuilt(quiltBlobs, epochs, signer);
  }
  
  /**
   * Fetch individual training data point from quilt
   */
  async fetchTrainingDataFromQuilt(
    quiltBlobId: string,
    dataPointIdentifier: string
  ): Promise<{
    features: any;
    labels: any;
  }> {
    const buffer = await this.client.fetchFromQuilt(quiltBlobId, dataPointIdentifier);
    return JSON.parse(buffer.toString());
  }
  
  /**
   * Calculate optimal batching strategy for training data
   */
  calculateTrainingDataBatching(
    totalDataPoints: number,
    averageDataPointSize: number
  ): {
    recommended: boolean;
    batchCount: number;
    pointsPerBatch: number;
    estimatedSavings?: number;
  } {
    const { shouldUseQuilt, calculateQuiltSavings } = require('../utils/quilt.js');
    const MAX_QUILT_SIZE = 666;
    
    if (totalDataPoints <= MAX_QUILT_SIZE) {
      const analysis = shouldUseQuilt(totalDataPoints, averageDataPointSize);
      return {
        recommended: analysis.recommended,
        batchCount: 1,
        pointsPerBatch: totalDataPoints,
        estimatedSavings: analysis.estimatedSavings
      };
    }
    
    // Multiple quilts needed
    const pointsPerBatch = MAX_QUILT_SIZE;
    const batchCount = Math.ceil(totalDataPoints / pointsPerBatch);
    const savings = calculateQuiltSavings(pointsPerBatch, averageDataPointSize);
    
    return {
      recommended: savings.savingsPercent > 20,
      batchCount,
      pointsPerBatch,
      estimatedSavings: savings.savingsPercent
    };
  }
}
