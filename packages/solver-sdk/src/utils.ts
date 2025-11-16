import { Transaction } from '@mysten/sui/transactions';

/**
 * OPTIONAL: Helper functions for Sui Tx operations
 * Solvers can use Sui SDK directly if preferred
 */

/**
 * Add P2P transfer to Tx
 */
export function addP2PTransfer(
  tx: Transaction,
  from: string,
  to: string,
  coinType: string,
  amount: string
): void {
  // Note: This is a simplified example. Real implementation should use proper Sui SDK methods
  // const [coin] = tx.splitCoins(tx.gas, [tx.pure(amount)]);
  // tx.transferObjects([coin], tx.pure(to));
  
  // TODO: Update with correct Sui SDK v1.44+ API
  throw new Error('addP2PTransfer needs to be updated for Sui SDK v1.44+');
}

/**
 * Get Seal policy ID for intent
 */
export function getSealPolicyForIntent(intentId: string): string {
  return `intent-policy-${intentId}`;
}

/**
 * Hash bytes using SHA-256
 */
export async function hashBytes(bytes: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
