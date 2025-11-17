/**
 * Base storage service
 */

import { Signer } from "@mysten/sui/cryptography";
import type { IntenusWalrusClient } from "../client.js";
import { StorageResult } from "../types/index.js";
import { WalrusFile, WriteBlobFlow } from "@mysten/walrus";
export abstract class BaseStorageService {
  constructor(protected client: IntenusWalrusClient) {}
}

export interface IStorageActions<T> {
  store: (data: T, epochs: number, signer: Signer) => Promise<StorageResult>;
  storeFilesReturnFlow?: (files: WalrusFile[]) => WriteBlobFlow;
  storeReturnFlow: (data: T) => Promise<WriteBlobFlow>;
  
  fetch: (blobId: string) => Promise<T>;

}
