/**
 * ML Data Storage Service
 * Store and fetch ML training data, models, and feedback
 */

import type { Signer } from '@mysten/sui/cryptography';
import type { IntenusWalrusClient } from '../client.js';
import type { StorageResult } from '../types/index.js';
import { BaseStorageService } from './base.js';
import type {
  ClassificationFeedback,
  ModelMetadata,
  IntentClassificationTrainingData
} from '@intenus/common';

export class MLStorageService extends BaseStorageService {
  constructor(client: IntenusWalrusClient) {
    super(client);
  }

  /**
   * Store classification feedback
   * @param feedback ClassificationFeedback object
   * @param epochs Storage duration in epochs
   * @param signer Sui signer
   * @returns Storage result with blob_id
   */
  async storeFeedback(
    feedback: ClassificationFeedback,
    epochs: number,
    signer: Signer
  ): Promise<StorageResult> {
    const data = Buffer.from(JSON.stringify(feedback), 'utf-8');
    const path = `/feedback/${feedback.feedback_id}.json`;
    
    return this.client.storeRaw(path, data, epochs, signer);
  }

  /**
   * Fetch feedback from Walrus
   * @param blob_id Walrus blob ID
   * @returns ClassificationFeedback object
   */
  async fetchFeedback(blob_id: string): Promise<ClassificationFeedback> {
    const data = await this.client.fetchRaw(blob_id);
    return JSON.parse(data.toString('utf-8')) as ClassificationFeedback;
  }

  /**
   * Store training data sample
   * @param sample Training data sample
   * @param epochs Storage duration in epochs
   * @param signer Sui signer
   * @returns Storage result with blob_id
   */
  async storeTrainingSample(
    sample: IntentClassificationTrainingData,
    epochs: number,
    signer: Signer
  ): Promise<StorageResult> {
    const data = Buffer.from(JSON.stringify(sample), 'utf-8');
    const path = `/training_data/${sample.dataset_version}/${sample.sample_id}.json`;
    
    return this.client.storeRaw(path, data, epochs, signer);
  }

  /**
   * Fetch training sample from Walrus
   * @param blob_id Walrus blob ID
   * @returns Training data sample
   */
  async fetchTrainingSample(blob_id: string): Promise<IntentClassificationTrainingData> {
    const data = await this.client.fetchRaw(blob_id);
    return JSON.parse(data.toString('utf-8')) as IntentClassificationTrainingData;
  }

  /**
   * Store model metadata
   * @param metadata Model metadata
   * @param epochs Storage duration in epochs
   * @param signer Sui signer
   * @returns Storage result with blob_id
   */
  async storeModelMetadata(
    metadata: ModelMetadata,
    epochs: number,
    signer: Signer
  ): Promise<StorageResult> {
    const data = Buffer.from(JSON.stringify(metadata), 'utf-8');
    const path = `/models/${metadata.model_version}/metadata.json`;
    
    return this.client.storeRaw(path, data, epochs, signer);
  }

  /**
   * Fetch model metadata from Walrus
   * @param blob_id Walrus blob ID
   * @returns Model metadata
   */
  async fetchModelMetadata(blob_id: string): Promise<ModelMetadata> {
    const data = await this.client.fetchRaw(blob_id);
    return JSON.parse(data.toString('utf-8')) as ModelMetadata;
  }

  /**
   * Store model weights (binary data)
   * @param modelVersion Model version
   * @param weightsData Model weights as Buffer
   * @param epochs Storage duration in epochs
   * @param signer Sui signer
   * @returns Storage result with blob_id
   */
  async storeModelWeights(
    modelVersion: string,
    weightsData: Buffer,
    epochs: number,
    signer: Signer
  ): Promise<StorageResult> {
    const path = `/models/${modelVersion}/weights.pkl`;
    
    return this.client.storeRaw(path, weightsData, epochs, signer);
  }

  /**
   * Fetch model weights from Walrus
   * @param blob_id Walrus blob ID
   * @returns Model weights as Buffer
   */
  async fetchModelWeights(blob_id: string): Promise<Buffer> {
    return this.client.fetchRaw(blob_id);
  }
}
