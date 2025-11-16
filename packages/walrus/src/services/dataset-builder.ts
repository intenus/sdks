/**
 * Dataset Version Builder (Builder Pattern)
 * Build dataset version package with multiple files for upload
 */

import type { Signer } from '@mysten/sui/cryptography';
import { WalrusFile } from '@mysten/walrus';
import type {
  ClassificationFeedback,
  ModelMetadata,
  IntentClassificationTrainingData
} from '@intenus/common';

export interface DatasetVersionFiles {
  metadata?: ModelMetadata;
  weights?: Buffer;
  trainingSamples?: IntentClassificationTrainingData[];
  feedback?: ClassificationFeedback[];
}

export class DatasetVersionBuilder {
  private files: Map<string, Uint8Array> = new Map();
  private _version: string = '';

  constructor(version: string) {
    this._version = version;
  }

  /**
   * Add model metadata file
   */
  withMetadata(metadata: ModelMetadata): this {
    const data = Buffer.from(JSON.stringify(metadata), 'utf-8');
    this.files.set('metadata.json', new Uint8Array(data));
    return this;
  }

  /**
   * Add model weights file
   */
  withWeights(weights: Buffer): this {
    this.files.set('weights.pkl', new Uint8Array(weights));
    return this;
  }

  /**
   * Add training samples as JSONL file
   */
  withTrainingSamples(samples: IntentClassificationTrainingData[]): this {
    const jsonl = samples.map(s => JSON.stringify(s)).join('\n');
    const data = Buffer.from(jsonl, 'utf-8');
    this.files.set('training_samples.jsonl', new Uint8Array(data));
    return this;
  }

  /**
   * Add feedback data as JSONL file
   */
  withFeedback(feedback: ClassificationFeedback[]): this {
    const jsonl = feedback.map(f => JSON.stringify(f)).join('\n');
    const data = Buffer.from(jsonl, 'utf-8');
    this.files.set('feedback.jsonl', new Uint8Array(data));
    return this;
  }

  /**
   * Build array of WalrusFile instances for upload
   */
  build(): WalrusFile[] {
    const walrusFiles: WalrusFile[] = [];
    for (const [filename, content] of this.files.entries()) {
      walrusFiles.push(WalrusFile.from({
        contents: content,
        identifier: filename,
      }));
    }
    return walrusFiles;
  }

  /**
   * Get version
   */
  get version(): string {
    return this._version;
  }
}
