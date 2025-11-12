/**
 * Main Intenus Walrus Client
 */

import { WalrusClient, WalrusClientConfig, walrus } from "@mysten/walrus";
import { SuiClient } from "@mysten/sui/client";
import type { Signer } from "@mysten/sui/cryptography";
import { NETWORKS } from "@intenus/common";
import { StoragePathBuilder } from "./utils/paths.js";
import {
  BatchStorageService,
  ArchiveStorageService,
  UserStorageService,
  TrainingStorageService,
} from "./services/index.js";
import type { IntenusWalrusConfig, StorageResult } from "./types/index.js";
import { WalrusStorageError, WalrusFetchError } from "./types/index.js";
import { WalrusQueryBuilder } from "./query-builder.js";

export class IntenusWalrusClient {
  public readonly walrusClient: WalrusClient;
  public readonly suiClient: SuiClient;
  private config: IntenusWalrusConfig;

  public readonly batches: BatchStorageService;
  public readonly archives: ArchiveStorageService;
  public readonly users: UserStorageService;
  public readonly training: TrainingStorageService;
  public readonly query: WalrusQueryBuilder;

  constructor(config: IntenusWalrusConfig) {
    const networkConfig =
      NETWORKS[config.network.toUpperCase() as keyof typeof NETWORKS];

    if (!networkConfig) {
      throw new Error(`Unknown network: ${config.network}`);
    }

    const suiClient = new SuiClient({
      url: networkConfig.sui_rpc_url,
      network: config.network,
    });

    this.suiClient = suiClient;

    const walrusConfig: WalrusClientConfig = config.walrusConfig || {
      network: config.network,
      suiClient: this.suiClient,
      uploadRelay: {
        host: networkConfig.walrus.uploadRelay,
        timeout: 60_000,
        sendTip: {
          max: 1_000,
        },
      },
      storageNodeClientOptions: {
        timeout: 60_000,
      },
    };

    this.config = {
      network: config.network,
      walrusConfig: walrusConfig,
    };
    this.walrusClient = new WalrusClient(walrusConfig);

    this.batches = new BatchStorageService(this, StoragePathBuilder as any);
    this.archives = new ArchiveStorageService(this, StoragePathBuilder as any);
    this.users = new UserStorageService(this, StoragePathBuilder as any);
    this.training = new TrainingStorageService(this);
    this.query = new WalrusQueryBuilder(this);
  }


  /**
   * Store raw data to Walrus
   */
  async storeRaw(
    path: string,
    data: Buffer,
    epochs: number,
    signer: Signer
  ): Promise<StorageResult> {
    try {
      const result = await this.walrusClient.writeBlob({
        blob: new Uint8Array(data),
        epochs,
        deletable: true,
        signer,
      });

      return {
        blob_id: result.blobId,
        path,
        size_bytes: data.length,
        created_at: Date.now(),
        epochs,
      };
    } catch (error: any) {
      throw new WalrusStorageError(
        `Failed to store raw data: ${error.message}`,
        "RAW_STORE_ERROR"
      );
    }
  }
  
  /**
   * Fetch raw data from Walrus with retry logic
   */
  async fetchRaw(blobId: string): Promise<Buffer> {
    const maxRetries = 5;
    const baseDelay = 5000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const data = await this.walrusClient.readBlob({ blobId });
        return Buffer.from(data);
      } catch (error: any) {
        if (attempt === maxRetries) {
          throw new WalrusFetchError(
            `Failed to fetch blob after ${maxRetries} attempts: ${error.message}`,
            blobId
          );
        }

        const delay = baseDelay * attempt;
        console.log(
          `Fetch attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new WalrusFetchError("Unexpected error in fetchRaw", blobId);
  }

  /**
   * Check if blob exists
   */
  async exists(blobId: string): Promise<boolean> {
    try {
      await this.fetchRaw(blobId);
      return true;
    } catch {
      return false;
    }
  }


  /**
   * Get network configuration
   */
  getConfig(): IntenusWalrusConfig {
    return { ...this.config };
  }

  /**
   * Reset client state
   */
  reset(): void {
    this.walrusClient.reset();
  }
}
