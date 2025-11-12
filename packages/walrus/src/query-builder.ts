/**
 * Walrus Query Builder - Builder pattern for flexible data retrieval
 */

import type { IntenusWalrusClient } from './client.js';
import type { 
  WalrusBatchManifest as BatchManifest,
  BatchArchive,
  UserHistoryAggregated,
  TrainingDatasetMetadata,
  ModelMetadata
} from '@intenus/common';
import { IndexMappingService } from './index-mapping.js';

export interface BatchFilters {
  epoch?: number;
  batch_id?: string;
  intent_count_min?: number;
  intent_count_max?: number;
  categories?: string[];
  estimated_value_usd_min?: number;
  estimated_value_usd_max?: number;
}

export interface ArchiveFilters {
  epoch?: number;
  batch_id?: string;
  outcome_type?: string;
  success_rate_min?: number;
  success_rate_max?: number;
}

export interface UserFilters {
  user_address?: string;
  intent_count_min?: number;
  intent_count_max?: number;
  categories?: string[];
}

export interface TrainingFilters {
  version?: string;
  batch_count_min?: number;
  batch_count_max?: number;
  intent_count_min?: number;
  intent_count_max?: number;
  data_quality_score_min?: number;
  data_quality_score_max?: number;
}

export interface ModelFilters {
  name?: string;
  version?: string;
  model_type?: string;
  framework?: string;
  accuracy_min?: number;
  accuracy_max?: number;
}

export class WalrusQueryBuilder {
  private indexService: IndexMappingService;

  constructor(private client: IntenusWalrusClient, indexService?: IndexMappingService) {
    this.indexService = indexService || new IndexMappingService();
  }


  /**
   * Get batch manifest by blob_id or quilt_id
   */
  async getBatchById(blobId: string): Promise<BatchManifest> {
    const buffer = await this.client.fetchRaw(blobId);
    return JSON.parse(buffer.toString()) as BatchManifest;
  }

  /**
   * Get archive by blob_id or quilt_id
   */
  async getArchiveById(blobId: string): Promise<BatchArchive> {
    const buffer = await this.client.fetchRaw(blobId);
    return JSON.parse(buffer.toString()) as BatchArchive;
  }

  /**
   * Get user history by blob_id or quilt_id
   */
  async getUserHistoryById(blobId: string): Promise<UserHistoryAggregated> {
    const buffer = await this.client.fetchRaw(blobId);
    return JSON.parse(buffer.toString()) as UserHistoryAggregated;
  }

  /**
   * Get training dataset metadata by blob_id or quilt_id
   */
  async getTrainingDatasetById(blobId: string): Promise<TrainingDatasetMetadata> {
    const buffer = await this.client.fetchRaw(blobId);
    return JSON.parse(buffer.toString()) as TrainingDatasetMetadata;
  }

  /**
   * Get model metadata by blob_id or quilt_id
   */
  async getModelById(blobId: string): Promise<ModelMetadata> {
    const buffer = await this.client.fetchRaw(blobId);
    return JSON.parse(buffer.toString()) as ModelMetadata;
  }


  /**
   * Get file from quilt by identifier (optimized for quilts)
   */
  async getFromQuiltByIdentifier<T = any>(
    quiltId: string, 
    identifier: string,
    parser?: (buffer: Buffer) => T
  ): Promise<T> {
    const blob = await this.client.walrusClient.getBlob({ blobId: quiltId });
    const files = await blob.files({ identifiers: [identifier] });
    
    if (files.length === 0) {
      throw new Error(`File with identifier '${identifier}' not found in quilt ${quiltId}`);
    }
    
    const data = await files[0].bytes();
    const buffer = Buffer.from(data);
    
    if (parser) {
      return parser(buffer);
    }
    
    // Default: try to parse as JSON
    try {
      return JSON.parse(buffer.toString()) as T;
    } catch {
      return buffer as unknown as T;
    }
  }

  /**
   * Get files from quilt by tags (optimized for quilts)
   */
  async getFromQuiltByTags<T = any>(
    quiltId: string,
    tags: Record<string, string>,
    parser?: (buffer: Buffer) => T
  ): Promise<T[]> {
    const blob = await this.client.walrusClient.getBlob({ blobId: quiltId });
    const files = await blob.files({ tags: [tags] });
    
    const results: T[] = [];
    for (const file of files) {
      const data = await file.bytes();
      const buffer = Buffer.from(data);
      
      if (parser) {
        results.push(parser(buffer));
      } else {
        // Default: try to parse as JSON
        try {
          results.push(JSON.parse(buffer.toString()) as T);
        } catch {
          results.push(buffer as unknown as T);
        }
      }
    }
    
    return results;
  }

  /**
   * List all files in a quilt with their identifiers and tags
   */
  async listQuiltContents(quiltId: string): Promise<Array<{
    identifier: string | null;
    tags: Record<string, string>;
    size: number;
  }>> {
    const blob = await this.client.walrusClient.getBlob({ blobId: quiltId });
    const files = await blob.files();
    
    const contents = [];
    for (const file of files) {
      const identifier = await file.getIdentifier();
      const tags = await file.getTags();
      const data = await file.bytes();
      
      contents.push({
        identifier,
        tags,
        size: data.length
      });
    }
    
    return contents;
  }


  /**
   * Get batches by filters using index mapping
   */
  async getBatchesBy(filters: BatchFilters): Promise<BatchManifest[]> {
    const indices = this.indexService.getBatchesBy(filters);
    const results: BatchManifest[] = [];
    
    for (const index of indices) {
      try {
        const manifest = await this.getBatchById(index.blob_id);
        results.push(manifest);
      } catch (error) {
        console.warn(`Failed to fetch batch ${index.blob_id}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Get archives by filters using index mapping
   */
  async getArchivesBy(filters: ArchiveFilters): Promise<BatchArchive[]> {
    const indices = this.indexService.getArchivesBy(filters);
    const results: BatchArchive[] = [];
    
    for (const index of indices) {
      try {
        const archive = await this.getArchiveById(index.blob_id);
        results.push(archive);
      } catch (error) {
        console.warn(`Failed to fetch archive ${index.blob_id}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Get user histories by filters using index mapping
   */
  async getUserHistoriesBy(filters: UserFilters): Promise<UserHistoryAggregated[]> {
    const indices = this.indexService.getUserHistoriesBy(filters);
    const results: UserHistoryAggregated[] = [];
    
    for (const index of indices) {
      try {
        const history = await this.getUserHistoryById(index.blob_id);
        results.push(history);
      } catch (error) {
        console.warn(`Failed to fetch user history ${index.blob_id}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Get training datasets by filters using index mapping
   */
  async getTrainingDatasetsBy(filters: TrainingFilters): Promise<TrainingDatasetMetadata[]> {
    const indices = this.indexService.getTrainingDatasetsBy(filters);
    const results: TrainingDatasetMetadata[] = [];
    
    for (const index of indices) {
      try {
        const dataset = await this.getTrainingDatasetById(index.metadata_blob_id);
        results.push(dataset);
      } catch (error) {
        console.warn(`Failed to fetch training dataset ${index.metadata_blob_id}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Get models by filters using index mapping
   */
  async getModelsBy(filters: ModelFilters): Promise<ModelMetadata[]> {
    const indices = this.indexService.getModelsBy(filters);
    const results: ModelMetadata[] = [];
    
    for (const index of indices) {
      try {
        const model = await this.getModelById(index.metadata_blob_id);
        results.push(model);
      } catch (error) {
        console.warn(`Failed to fetch model ${index.metadata_blob_id}:`, error);
      }
    }
    
    return results;
  }


  /**
   * Get training dataset features from quilt
   */
  async getTrainingFeatures(quiltId: string, version: string): Promise<Buffer> {
    return this.getFromQuiltByIdentifier(
      quiltId, 
      `features-${version}`,
      (buffer) => buffer
    );
  }

  /**
   * Get training dataset labels from quilt
   */
  async getTrainingLabels(quiltId: string, version: string): Promise<Buffer> {
    return this.getFromQuiltByIdentifier(
      quiltId, 
      `labels-${version}`,
      (buffer) => buffer
    );
  }

  /**
   * Get model file from quilt
   */
  async getModelFile(quiltId: string, name: string, version: string): Promise<Buffer> {
    return this.getFromQuiltByIdentifier(
      quiltId, 
      `model-${name}-${version}`,
      (buffer) => buffer
    );
  }

  /**
   * Get intents from batch quilt by category
   */
  async getIntentsByCategory(quiltId: string, category: string): Promise<any[]> {
    return this.getFromQuiltByTags(quiltId, { category });
  }

  /**
   * Get all intents from batch quilt
   */
  async getAllIntents(quiltId: string): Promise<any[]> {
    return this.getFromQuiltByTags(quiltId, { 'data-type': 'intent' });
  }


  /**
   * Get the index mapping service (for advanced usage)
   */
  getIndexService(): IndexMappingService {
    return this.indexService;
  }

  /**
   * Add batch to index for filtered queries
   */
  addBatchToIndex(batch: BatchManifest, blob_id: string): void {
    this.indexService.addBatchIndex({
      epoch: batch.epoch,
      batch_id: batch.batch_id,
      blob_id,
      intent_count: batch.intent_count,
      categories: Object.keys(batch.categories),
      estimated_value_usd: batch.estimated_value_usd,
      created_at: Date.now()
    });
  }

  /**
   * Add archive to index for filtered queries
   */
  addArchiveToIndex(archive: BatchArchive, blob_id: string): void {
    this.indexService.addArchiveIndex({
      epoch: archive.epoch,
      batch_id: archive.batch_id,
      blob_id,
      outcome_type: 'mixed', // You may want to calculate this from outcomes
      success_rate: 0.95, // You may want to calculate this from outcomes
      created_at: Date.now()
    });
  }

  /**
   * Add user history to index for filtered queries
   */
  addUserToIndex(user: UserHistoryAggregated, blob_id: string): void {
    this.indexService.addUserIndex({
      user_address: user.user_address,
      blob_id,
      intent_count: user.total_intents,
      categories: user.preferred_categories,
      created_at: Date.now()
    });
  }

  /**
   * Add training dataset to index for filtered queries
   */
  addTrainingToIndex(
    dataset: TrainingDatasetMetadata, 
    metadata_blob_id: string,
    features_blob_id: string,
    labels_blob_id: string
  ): void {
    this.indexService.addTrainingIndex({
      version: dataset.version,
      metadata_blob_id,
      features_blob_id,
      labels_blob_id,
      batch_count: dataset.batch_count,
      intent_count: dataset.intent_count,
      data_quality_score: dataset.data_quality_score || 0,
      created_at: Date.now()
    });
  }

  /**
   * Add model to index for filtered queries
   */
  addModelToIndex(
    model: ModelMetadata,
    metadata_blob_id: string,
    model_blob_id: string
  ): void {
    this.indexService.addModelIndex({
      name: model.name,
      version: model.version,
      metadata_blob_id,
      model_blob_id,
      model_type: model.model_type,
      framework: model.framework,
      accuracy: (model.metrics as any)?.accuracy || 0,
      created_at: Date.now()
    });
  }

  /**
   * Clear all indices
   */
  clearIndex(): void {
    this.indexService.clear();
  }

  /**
   * Get index statistics
   */
  getIndexStats(): {
    batches: number;
    archives: number;
    users: number;
    trainings: number;
    models: number;
  } {
    return this.indexService.getStats();
  }
}
