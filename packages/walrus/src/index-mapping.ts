/**
 * Index Mapping Service - Maps metadata to blob_ids for filtered queries
 */

export interface BatchIndex {
  epoch: number;
  batch_id: string;
  blob_id: string;
  intent_count: number;
  categories: string[];
  estimated_value_usd: number;
  created_at: number;
}

export interface ArchiveIndex {
  epoch: number;
  batch_id: string;
  blob_id: string;
  outcome_type: string;
  success_rate: number;
  created_at: number;
}

export interface UserIndex {
  user_address: string;
  blob_id: string;
  intent_count: number;
  categories: string[];
  created_at: number;
}

export interface TrainingIndex {
  version: string;
  metadata_blob_id: string;
  features_blob_id: string;
  labels_blob_id: string;
  batch_count: number;
  intent_count: number;
  data_quality_score: number;
  created_at: number;
}

export interface ModelIndex {
  name: string;
  version: string;
  metadata_blob_id: string;
  model_blob_id: string;
  model_type: string;
  framework: string;
  accuracy: number;
  created_at: number;
}

/**
 * In-memory index mapping service
 */
export class IndexMappingService {
  private batchIndex: Map<string, BatchIndex> = new Map();
  private archiveIndex: Map<string, ArchiveIndex> = new Map();
  private userIndex: Map<string, UserIndex> = new Map();
  private trainingIndex: Map<string, TrainingIndex> = new Map();
  private modelIndex: Map<string, ModelIndex> = new Map();


  addBatchIndex(index: BatchIndex): void {
    const key = `${index.epoch}-${index.batch_id}`;
    this.batchIndex.set(key, index);
  }

  getBatchByEpoch(epoch: number): BatchIndex[] {
    return Array.from(this.batchIndex.values()).filter(b => b.epoch === epoch);
  }

  getBatchByBatchId(batch_id: string): BatchIndex[] {
    return Array.from(this.batchIndex.values()).filter(b => b.batch_id === batch_id);
  }

  getBatchesBy(filters: {
    epoch?: number;
    batch_id?: string;
    intent_count_min?: number;
    intent_count_max?: number;
    categories?: string[];
    estimated_value_usd_min?: number;
    estimated_value_usd_max?: number;
  }): BatchIndex[] {
    return Array.from(this.batchIndex.values()).filter(batch => {
      if (filters.epoch !== undefined && batch.epoch !== filters.epoch) return false;
      if (filters.batch_id !== undefined && batch.batch_id !== filters.batch_id) return false;
      if (filters.intent_count_min !== undefined && batch.intent_count < filters.intent_count_min) return false;
      if (filters.intent_count_max !== undefined && batch.intent_count > filters.intent_count_max) return false;
      if (filters.estimated_value_usd_min !== undefined && batch.estimated_value_usd < filters.estimated_value_usd_min) return false;
      if (filters.estimated_value_usd_max !== undefined && batch.estimated_value_usd > filters.estimated_value_usd_max) return false;
      if (filters.categories && !filters.categories.some(cat => batch.categories.includes(cat))) return false;
      return true;
    });
  }


  addArchiveIndex(index: ArchiveIndex): void {
    const key = `${index.epoch}-${index.batch_id}`;
    this.archiveIndex.set(key, index);
  }

  getArchivesBy(filters: {
    epoch?: number;
    batch_id?: string;
    outcome_type?: string;
    success_rate_min?: number;
    success_rate_max?: number;
  }): ArchiveIndex[] {
    return Array.from(this.archiveIndex.values()).filter(archive => {
      if (filters.epoch !== undefined && archive.epoch !== filters.epoch) return false;
      if (filters.batch_id !== undefined && archive.batch_id !== filters.batch_id) return false;
      if (filters.outcome_type !== undefined && archive.outcome_type !== filters.outcome_type) return false;
      if (filters.success_rate_min !== undefined && archive.success_rate < filters.success_rate_min) return false;
      if (filters.success_rate_max !== undefined && archive.success_rate > filters.success_rate_max) return false;
      return true;
    });
  }


  addUserIndex(index: UserIndex): void {
    this.userIndex.set(index.user_address, index);
  }

  getUserHistoriesBy(filters: {
    user_address?: string;
    intent_count_min?: number;
    intent_count_max?: number;
    categories?: string[];
  }): UserIndex[] {
    return Array.from(this.userIndex.values()).filter(user => {
      if (filters.user_address !== undefined && user.user_address !== filters.user_address) return false;
      if (filters.intent_count_min !== undefined && user.intent_count < filters.intent_count_min) return false;
      if (filters.intent_count_max !== undefined && user.intent_count > filters.intent_count_max) return false;
      if (filters.categories && !filters.categories.some(cat => user.categories.includes(cat))) return false;
      return true;
    });
  }


  addTrainingIndex(index: TrainingIndex): void {
    this.trainingIndex.set(index.version, index);
  }

  getTrainingDatasetsBy(filters: {
    version?: string;
    batch_count_min?: number;
    batch_count_max?: number;
    intent_count_min?: number;
    intent_count_max?: number;
    data_quality_score_min?: number;
    data_quality_score_max?: number;
  }): TrainingIndex[] {
    return Array.from(this.trainingIndex.values()).filter(training => {
      if (filters.version !== undefined && training.version !== filters.version) return false;
      if (filters.batch_count_min !== undefined && training.batch_count < filters.batch_count_min) return false;
      if (filters.batch_count_max !== undefined && training.batch_count > filters.batch_count_max) return false;
      if (filters.intent_count_min !== undefined && training.intent_count < filters.intent_count_min) return false;
      if (filters.intent_count_max !== undefined && training.intent_count > filters.intent_count_max) return false;
      if (filters.data_quality_score_min !== undefined && training.data_quality_score < filters.data_quality_score_min) return false;
      if (filters.data_quality_score_max !== undefined && training.data_quality_score > filters.data_quality_score_max) return false;
      return true;
    });
  }


  addModelIndex(index: ModelIndex): void {
    const key = `${index.name}-${index.version}`;
    this.modelIndex.set(key, index);
  }

  getModelsBy(filters: {
    name?: string;
    version?: string;
    model_type?: string;
    framework?: string;
    accuracy_min?: number;
    accuracy_max?: number;
  }): ModelIndex[] {
    return Array.from(this.modelIndex.values()).filter(model => {
      if (filters.name !== undefined && model.name !== filters.name) return false;
      if (filters.version !== undefined && model.version !== filters.version) return false;
      if (filters.model_type !== undefined && model.model_type !== filters.model_type) return false;
      if (filters.framework !== undefined && model.framework !== filters.framework) return false;
      if (filters.accuracy_min !== undefined && model.accuracy < filters.accuracy_min) return false;
      if (filters.accuracy_max !== undefined && model.accuracy > filters.accuracy_max) return false;
      return true;
    });
  }


  clear(): void {
    this.batchIndex.clear();
    this.archiveIndex.clear();
    this.userIndex.clear();
    this.trainingIndex.clear();
    this.modelIndex.clear();
  }

  getStats(): {
    batches: number;
    archives: number;
    users: number;
    trainings: number;
    models: number;
  } {
    return {
      batches: this.batchIndex.size,
      archives: this.archiveIndex.size,
      users: this.userIndex.size,
      trainings: this.trainingIndex.size,
      models: this.modelIndex.size,
    };
  }
}
