/**
 * Storage path builder utility (Builder Pattern)
 * Simplified for intent, solution, and ML data only
 */

export class StoragePathBuilder {
  private static readonly PATHS = {
    // Intent paths
    intent: (intentId: string) => `/intents/${intentId}.json`,
    
    // Solution paths
    solution: (solutionId: string) => `/solutions/${solutionId}.json`,
    
    // ML paths
    feedback: (feedbackId: string) => `/feedback/${feedbackId}.json`,
    
    trainingSample: (version: string, sampleId: string) => 
      `/training_data/${version}/${sampleId}.json`,
    
    modelMetadata: (version: string) => 
      `/models/${version}/metadata.json`,
    
    modelWeights: (version: string) => 
      `/models/${version}/weights.pkl`,
    
    modelLatest: () => '/models/latest.json',
  } as const;
  
  static build(type: keyof typeof StoragePathBuilder.PATHS, ...args: any[]): string {
    const builder = this.PATHS[type];
    if (!builder) {
      throw new Error(`Unknown path type: ${type}`);
    }
    return (builder as any)(...args);
  }
}
