/**
 * Base storage service (Strategy Pattern)
 */

import type { Signer } from '@mysten/sui/cryptography';
import type { IntenusWalrusClient } from '../client.js';
import type { StoragePathBuilder } from '../utils/paths.js';
import type { StorageResult } from '../types/index.js';

export abstract class BaseStorageService<T> {
  constructor(
    protected client: IntenusWalrusClient,
    protected pathBuilder: typeof StoragePathBuilder
  ) {}
  
  protected abstract getPath(...args: any[]): string;
  protected abstract serialize(data: T): Buffer;
  protected abstract deserialize(buffer: Buffer): T;
  
  async store(data: T, epochs: number, signer: Signer, ...pathArgs: any[]): Promise<StorageResult> {
    const path = this.getPath(...pathArgs);
    const buffer = this.serialize(data);
    return this.client.storeRaw(path, buffer, epochs, signer);
  }
  
  async fetch(...pathArgs: any[]): Promise<T> {
    const path = this.getPath(...pathArgs);
    const buffer = await this.client.fetchRaw(path);
    return this.deserialize(buffer);
  }
  
  async exists(...pathArgs: any[]): Promise<boolean> {
    const path = this.getPath(...pathArgs);
    return this.client.exists(path);
  }
}
