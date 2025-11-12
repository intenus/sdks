/**
 * Training data storage service
 */

import type { Signer } from '@mysten/sui/cryptography';
import { StoragePathBuilder } from '../utils/paths.js';
import { WalrusFile } from '@mysten/walrus';
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
  ): Promise<{
    metadataResult: StorageResult;
    featuresResult: StorageResult;
    labelsResult: StorageResult;
  }> {
    const featuresPath = StoragePathBuilder.build('datasetFeatures', version);
    const labelsPath = StoragePathBuilder.build('datasetLabels', version);
    
    const files = [
      WalrusFile.from({
        contents: new Uint8Array(features),
        identifier: `features-${version}`,
        tags: {
          'content-type': 'application/octet-stream',
          'data-type': 'dataset-features',
          'version': version,
          'path': featuresPath
        }
      }),
      WalrusFile.from({
        contents: new Uint8Array(labels),
        identifier: `labels-${version}`,
        tags: {
          'content-type': 'application/octet-stream',
          'data-type': 'dataset-labels',
          'version': version,
          'path': labelsPath
        }
      })
    ];
    
    // Store all files in one transaction using writeFiles
    const results = await this.client.walrusClient.writeFiles({
      files,
      epochs: DEFAULT_EPOCHS.TRAINING_DATA,
      deletable: true,
      signer
    });
    

    const featuresResult: StorageResult = {
      blob_id: results[0].blobId,
      path: featuresPath,
      size_bytes: features.length,
      created_at: Date.now(),
      epochs: DEFAULT_EPOCHS.TRAINING_DATA
    };
    
    const labelsResult: StorageResult = {
      blob_id: results[0].blobId, // Same blobId as they're in the same quilt
      path: labelsPath,
      size_bytes: labels.length,
      created_at: Date.now(),
      epochs: DEFAULT_EPOCHS.TRAINING_DATA
    };
    
    const fullMetadata: TrainingDatasetMetadata = {
      version,
      created_at: Date.now(),
      batch_count: 0,
      intent_count: 0,
      execution_count: 0,
      features_blob_id: results[0].blobId, // Store quilt blob ID
      labels_blob_id: results[0].blobId, // Store quilt blob ID
      schema_version: SCHEMA_VERSIONS.TRAINING_DATASET,
      feature_columns: [],
      label_columns: [],
      ...metadata
    };
    
    const metadataPath = StoragePathBuilder.build('datasetMetadata', version);
    const metadataBuffer = Buffer.from(JSON.stringify(fullMetadata, null, 2));
    
    // Store metadata separately as it needs to be easily readable
    const metadataResult = await this.client.storeRaw(
      metadataPath,
      metadataBuffer, 
      DEFAULT_EPOCHS.TRAINING_DATA,
      signer
    );
    
    return {
      metadataResult,
      featuresResult,
      labelsResult
    };
  }
  
  async fetchDatasetMetadata(metadataBlobId: string): Promise<TrainingDatasetMetadata> {
    const buffer = await this.client.fetchRaw(metadataBlobId);
    return JSON.parse(buffer.toString());
  }
  
  async fetchDatasetFeatures(featuresBlobId: string, version: string): Promise<Buffer> {
    const blob = await this.client.walrusClient.getBlob({ blobId: featuresBlobId });
    const files = await blob.files({ identifiers: [`features-${version}`] });
    
    if (files.length === 0) {
      throw new Error(`Features not found for version ${version}`);
    }
    
    const data = await files[0].bytes();
    return Buffer.from(data);
  }
  
  async fetchDatasetLabels(labelsBlobId: string, version: string): Promise<Buffer> {
    const blob = await this.client.walrusClient.getBlob({ blobId: labelsBlobId });
    const files = await blob.files({ identifiers: [`labels-${version}`] });
    
    if (files.length === 0) {
      throw new Error(`Labels not found for version ${version}`);
    }
    
    const data = await files[0].bytes();
    return Buffer.from(data);
  }
  
  async storeModel(
    name: string,
    version: string,
    modelData: Buffer,
    metadata: Partial<ModelMetadata>,
    signer: Signer
  ): Promise<{
    metadataResult: StorageResult;
    modelResult: StorageResult;
  }> {
    const modelPath = StoragePathBuilder.build('modelFile', name, version);
    const metadataPath = StoragePathBuilder.build('modelMetadata', name, version);
    
    // Create temporary metadata to get blob_id placeholder
    const tempMetadata: ModelMetadata = {
      name,
      version,
      created_at: Date.now(),
      model_type: 'unknown',
      framework: 'unknown',
      model_blob_id: '', // Will be updated after storage
      training_dataset_version: 'unknown',
      training_duration_ms: 0,
      metrics: {},
      config: {
        input_shape: [],
        output_shape: []
      },
      ...metadata
    };
    
    // Create WalrusFiles for model and metadata together
    const files = [
      WalrusFile.from({
        contents: new Uint8Array(modelData),
        identifier: `model-${name}-${version}`,
        tags: {
          'content-type': 'application/octet-stream',
          'data-type': 'ml-model',
          'model-name': name,
          'model-version': version,
          'path': modelPath
        }
      })
    ];
    
    // Store model using writeFiles
    const results = await this.client.walrusClient.writeFiles({
      files,
      epochs: DEFAULT_EPOCHS.ML_MODELS,
      deletable: true,
      signer
    });
    
    const modelResult: StorageResult = {
      blob_id: results[0].blobId,
      path: modelPath,
      size_bytes: modelData.length,
      created_at: Date.now(),
      epochs: DEFAULT_EPOCHS.ML_MODELS
    };
    
    // Update metadata with actual blob_id
    const fullMetadata: ModelMetadata = {
      ...tempMetadata,
      model_blob_id: results[0].blobId
    };
    
    // Store metadata separately as it needs to be easily readable
    const metadataBuffer = Buffer.from(JSON.stringify(fullMetadata, null, 2));
    const metadataResult = await this.client.storeRaw(
      metadataPath,
      metadataBuffer, 
      DEFAULT_EPOCHS.ML_MODELS,
      signer
    );
    
    return {
      metadataResult,
      modelResult
    };
  }
  
  async fetchModelMetadata(metadataBlobId: string): Promise<ModelMetadata> {
    const buffer = await this.client.fetchRaw(metadataBlobId);
    return JSON.parse(buffer.toString());
  }
  
  async fetchModel(modelBlobId: string, name: string, version: string): Promise<Buffer> {
    const blob = await this.client.walrusClient.getBlob({ blobId: modelBlobId });
    const files = await blob.files({ identifiers: [`model-${name}-${version}`] });
    
    if (files.length === 0) {
      throw new Error(`Model not found for ${name}@${version}`);
    }
    
    const data = await files[0].bytes();
    return Buffer.from(data);
  }
  
  /**
   * Store training data points efficiently - Walrus chooses optimal method
   */
  async storeTrainingData(
    dataPoints: Array<{ id: string; features: any; labels: any }>,
    datasetVersion: string,
    signer: Signer,
    epochs: number = DEFAULT_EPOCHS.TRAINING_DATA
  ): Promise<{ blobId: string; dataPointIds: string[] }> {
    const files = dataPoints.map(point => 
      WalrusFile.from({
        contents: new TextEncoder().encode(JSON.stringify(point)),
        identifier: point.id,
        tags: {
          'content-type': 'application/json',
          'dataset-version': datasetVersion,
          'data-type': 'training-point'
        }
      })
    );

    const results = await this.client.walrusClient.writeFiles({
      files,
      epochs,
      deletable: true,
      signer
    });

    return {
      blobId: results[0].blobId,
      dataPointIds: dataPoints.map(p => p.id)
    };
  }
  
  /**
   * Fetch training data points from storage
   */
  async fetchTrainingData(blobId: string): Promise<Array<{
    id: string;
    features: any;
    labels: any;
  }>> {
    const blob = await this.client.walrusClient.getBlob({ blobId });
    const files = await blob.files();
    
    const dataPoints = [];
    for (const file of files) {
      const content = await file.text();
      const point = JSON.parse(content);
      const identifier = await file.getIdentifier();
      
      dataPoints.push({
        id: identifier || point.id,
        features: point.features,
        labels: point.labels
      });
    }
    
    return dataPoints;
  }
}