/**
 * Dataset Storage Service
 * Store and fetch classification datasets using WalrusFile (quilt)
 */

import type { Signer } from '@mysten/sui/cryptography';
import type { IntenusWalrusClient } from '../client.js';
import type { StorageResult } from '../types/index.js';
import { BaseStorageService } from './base.js';
import { DatasetVersionBuilder } from './dataset-builder.js';
import type {
  ClassificationFeedback,
  ModelMetadata,
  IntentClassificationTrainingData
} from '@intenus/common';

export interface DatasetVersionResult extends StorageResult {
  quilt_id: string;
  files: string[];
}

export class DatasetStorageService extends BaseStorageService {
  constructor(client: IntenusWalrusClient) {
    super(client);
  }

  /**
   * Create a new dataset version builder
   * @param version Dataset version (e.g., "v1.0.0")
   * @returns DatasetVersionBuilder
   */
  createVersion(version: string): DatasetVersionBuilder {
    return new DatasetVersionBuilder(version);
  }

  /**
   * Store dataset version package (multiple files)
   * @param builder DatasetVersionBuilder
   * @param epochs Storage duration in epochs
   * @param signer Sui signer
   * @returns Storage result with quilt_id
   */
  async storeVersion(
    builder: DatasetVersionBuilder,
    epochs: number,
    signer: Signer
  ): Promise<DatasetVersionResult> {
    const walrusFiles = builder.build();

    const results = await this.client.walrusClient.writeFiles({
      files: walrusFiles,
      epochs,
      deletable: true,
      signer,
    });

    // writeFiles returns array of results, but all files go into one quilt
    // Use the first result's blobId as the quilt_id
    const quiltId = results[0].blobId;
    const fileNames = await Promise.all(walrusFiles.map(f => f.getIdentifier()));

    // Calculate total size
    const fileBuffers = await Promise.all(walrusFiles.map(f => f.bytes()));
    const totalSize = fileBuffers.reduce((sum, buf) => sum + buf.length, 0);

    return {
      blob_id: quiltId,
      quilt_id: quiltId,
      size_bytes: totalSize,
      files: fileNames.filter((name): name is string => name !== null),
      created_at: Date.now(),
      epochs,
    };
  }

  /**
   * Fetch dataset version metadata
   * @param quilt_id Dataset version quilt ID
   * @returns Model metadata
   */
  async fetchMetadata(quilt_id: string): Promise<ModelMetadata> {
    const blob = await this.client.walrusClient.getBlob({ blobId: quilt_id });
    const [file] = await blob.files({ identifiers: ['metadata.json'] });
    const data = await file.bytes();
    return JSON.parse(Buffer.from(data).toString('utf-8')) as ModelMetadata;
  }

  /**
   * Fetch model weights
   * @param quilt_id Dataset version quilt ID
   * @returns Model weights as Buffer
   */
  async fetchWeights(quilt_id: string): Promise<Buffer> {
    const blob = await this.client.walrusClient.getBlob({ blobId: quilt_id });
    const [file] = await blob.files({ identifiers: ['weights.pkl'] });
    const data = await file.bytes();
    return Buffer.from(data);
  }

  /**
   * Fetch training samples
   * @param quilt_id Dataset version quilt ID
   * @returns Array of training samples
   */
  async fetchTrainingSamples(quilt_id: string): Promise<IntentClassificationTrainingData[]> {
    const blob = await this.client.walrusClient.getBlob({ blobId: quilt_id });
    const [file] = await blob.files({ identifiers: ['training_samples.jsonl'] });
    const data = await file.bytes();
    const jsonl = Buffer.from(data).toString('utf-8');
    return jsonl.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
  }

  /**
   * Fetch feedback data
   * @param quilt_id Dataset version quilt ID
   * @returns Array of feedback
   */
  async fetchFeedback(quilt_id: string): Promise<ClassificationFeedback[]> {
    const blob = await this.client.walrusClient.getBlob({ blobId: quilt_id });
    const [file] = await blob.files({ identifiers: ['feedback.jsonl'] });
    const data = await file.bytes();
    const jsonl = Buffer.from(data).toString('utf-8');
    return jsonl.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
  }

  /**
   * List files in dataset version
   * @param quilt_id Dataset version quilt ID
   * @returns List of file identifiers
   */
  async listFiles(quilt_id: string): Promise<string[]> {
    const blob = await this.client.walrusClient.getBlob({ blobId: quilt_id });
    const files = await blob.files();
    const identifiers = await Promise.all(files.map(f => f.getIdentifier()));
    return identifiers.filter((id): id is string => id !== null);
  }
}
