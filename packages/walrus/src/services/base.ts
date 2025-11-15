/**
 * Base storage service
 */

import type { IntenusWalrusClient } from '../client.js';

export abstract class BaseStorageService {
  constructor(protected client: IntenusWalrusClient) {}
}
