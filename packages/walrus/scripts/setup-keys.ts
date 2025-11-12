#!/usr/bin/env tsx

/**
 * Utility script to generate Sui keypair for testing
 * Usage: npx tsx scripts/setup-keys.ts
 */

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { toHEX } from '@mysten/sui/utils';

function generateKeypair() {
  console.log('🔑 Generating new Sui keypair for testing...\n');
  
  // Generate new keypair
  const keypair = Ed25519Keypair.generate();
  
  // Get private key as hex
  const privateKeyHex = toHEX(keypair.getSecretKey());
  
  // Get public key as hex
  const publicKeyHex = toHEX(keypair.getPublicKey().toRawBytes());
  
  // Get Sui address
  const suiAddress = keypair.getPublicKey().toSuiAddress();
  
  console.log('✅ Generated keypair:');
  console.log('==================');
  console.log(`Private Key: ${privateKeyHex}`);
  console.log(`Public Key:  ${publicKeyHex}`);
  console.log(`Sui Address: ${suiAddress}`);
  console.log('');
  
  console.log('📝 Environment variables to set:');
  console.log('================================');
  console.log(`export INTENUS_ADMIN_PRIVATE_KEY="${privateKeyHex}"`);
  console.log(`export INTENUS_ADMIN_PUBLIC_KEY="${publicKeyHex}"`);
  console.log('');
  
  console.log('💰 Fund your address on testnet:');
  console.log('================================');
  console.log('1. Visit: https://faucet.testnet.sui.io/');
  console.log(`2. Enter address: ${suiAddress}`);
  console.log('3. Request SUI tokens');
  console.log('');
  
  console.log('🎯 Get WAL tokens for storage:');
  console.log('=============================');
  console.log('1. Visit: https://walrus.site/');
  console.log('2. Connect your wallet');
  console.log('3. Get WAL tokens from faucet');
  console.log('');
  
  console.log('🧪 Run integration tests:');
  console.log('========================');
  console.log('npm run test:integration');
}

// Check if running as script
if (require.main === module) {
  generateKeypair();
}

export { generateKeypair };
