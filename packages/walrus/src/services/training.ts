/**
 * Training data storage service
 */

import type { Signer } from '@mysten/sui/cryptography';
import { StoragePathBuilder } from '../utils/paths.js';
import { DEFAULT_EPOCHS, SCHEMA_VERSIONS } from '../constants/index.js';
import type { IntenusWalrusClient } from '../client.js';
import type { TrainingDatasetMetadata, ModelMetadata, StorageResult } from '../types/index.js';

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
    // Fetch metadata
    const metadataPath = StoragePathBuilder.build('datasetMetadata', version);
    const metadataBuffer = await this.client.fetchRaw(metadataPath);
    const metadata: TrainingDatasetMetadata = JSON.parse(metadataBuffer.toString());
    
    // Fetch features
    const featuresPath = StoragePathBuilder.build('datasetFeatures', version);
    const features = await this.client.fetchRaw(featuresPath);
    
    // Fetch labels
    const labelsPath = StoragePathBuilder.build('datasetLabels', version);
    const labels = await this.client.fetchRaw(labelsPath);
    
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
    // Fetch metadata
    const metadataPath = StoragePathBuilder.build('modelMetadata', name, version);
    const metadataBuffer = await this.client.fetchRaw(metadataPath);
    const metadata: ModelMetadata = JSON.parse(metadataBuffer.toString());
    
    // Fetch model
    const modelPath = StoragePathBuilder.build('modelFile', name, version);
    const model = await this.client.fetchRaw(modelPath);
    
    return { metadata, model };
  }
  
  async datasetExists(version: string): Promise<boolean> {
    const metadataPath = StoragePathBuilder.build('datasetMetadata', version);
    return this.client.exists(metadataPath);
  }
  
  async modelExists(name: string, version: string): Promise<boolean> {
    const metadataPath = StoragePathBuilder.build('modelMetadata', name, version);
    return this.client.exists(metadataPath);
  }
}
