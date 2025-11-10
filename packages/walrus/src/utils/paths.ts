/**
 * Storage path builder utility (Builder Pattern)
 */

export class StoragePathBuilder {
  private static readonly PATHS = {
    batchManifest: (epoch: number) => 
      `/batches/${epoch}/batch_manifest.json`,
    
    batchArchive: (epoch: number, batchId: string) => 
      `/archives/${epoch}/batch_${batchId}.json`,
    
    userHistory: (address: string) => 
      `/users/${address}/history_aggregated.json`,
    
    datasetMetadata: (version: string) => 
      `/training/datasets/${version}/dataset_metadata.json`,
    
    datasetFeatures: (version: string) => 
      `/training/datasets/${version}/features.parquet`,
    
    datasetLabels: (version: string) => 
      `/training/datasets/${version}/labels.parquet`,
    
    modelMetadata: (name: string, version: string) => 
      `/training/models/${name}/${version}/model_metadata.json`,
    
    modelFile: (name: string, version: string) => 
      `/training/models/${name}/${version}/model.onnx`,
  } as const;
  
  static build(type: keyof typeof StoragePathBuilder.PATHS, ...args: any[]): string {
    const builder = this.PATHS[type];
    if (!builder) {
      throw new Error(`Unknown path type: ${type}`);
    }
    return (builder as any)(...args);
  }
}
