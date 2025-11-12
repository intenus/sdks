/**
 * Example: Seal Policy Management
 */

import { 
  IntenusProtocolClient, 
  PolicyType,
  IntentPolicyConfig,
  StrategyPolicyConfig,
  HistoryPolicyConfig
} from '@intenus/client-sdk';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

async function main() {
  // Initialize client
  const client = new IntenusProtocolClient({
    network: 'testnet'
  });

  // Generate keypairs for different roles
  const userKeypair = Ed25519Keypair.generate();
  const solverKeypair = Ed25519Keypair.generate();
  const adminKeypair = Ed25519Keypair.generate();

  console.log('User Address:', userKeypair.toSuiAddress());
  console.log('Solver Address:', solverKeypair.toSuiAddress());

  try {
    // 1. Create Intent Policy for Batch Encryption
    console.log('\n=== Creating Intent Policy ===');
    
    const batchId = Math.floor(Date.now() / 1000);
    const intentPolicy: IntentPolicyConfig = {
      policy_id: `intent_batch_${batchId}`,
      batch_id: batchId,
      solver_access_start_ms: Date.now(),
      solver_access_end_ms: Date.now() + 300000, // 5 minutes
      router_access_enabled: true,
      auto_revoke_time: Date.now() + 3600000, // 1 hour
      requires_solver_registration: true,
      min_solver_stake: '1000000000', // 1 SUI
      requires_tee_attestation: false,
      expected_measurement: '',
      purpose: 'Intent batch encryption for user privacy'
    };

    const intentResult = await client.policies.createIntentPolicy(
      intentPolicy,
      userKeypair
    );

    console.log('Intent policy created:', intentResult.digest);
    console.log('Policy ID:', intentPolicy.policy_id);

    // 2. Create Strategy Policy for Solver Algorithm Protection
    console.log('\n=== Creating Strategy Policy ===');
    
    const strategyPolicy: StrategyPolicyConfig = {
      policy_id: `strategy_solver_${solverKeypair.toSuiAddress().slice(0, 8)}`,
      router_can_access: false,
      admin_unlock_time: 0, // No admin unlock
      is_public: false,
      requires_solver_registration: true,
      min_solver_stake: '2000000000', // 2 SUI for strategy access
      requires_tee_attestation: true,
      expected_measurement: 'abc123def456...', // TEE measurement hash
      purpose: 'Protect solver trading algorithms and parameters'
    };

    const strategyResult = await client.policies.createStrategyPolicy(
      strategyPolicy,
      solverKeypair
    );

    console.log('Strategy policy created:', strategyResult.digest);
    console.log('Policy ID:', strategyPolicy.policy_id);

    // 3. Create History Policy for User Analytics
    console.log('\n=== Creating History Policy ===');
    
    const historyPolicy: HistoryPolicyConfig = {
      policy_id: `history_user_${userKeypair.toSuiAddress().slice(0, 8)}`,
      router_access_level: 2, // Limited router access
      user_can_revoke: true,
      requires_solver_registration: false,
      min_solver_stake: '0',
      requires_tee_attestation: false,
      expected_measurement: '',
      purpose: 'User interaction history for personalized analytics'
    };

    const historyResult = await client.policies.createHistoryPolicy(
      historyPolicy,
      userKeypair
    );

    console.log('History policy created:', historyResult.digest);
    console.log('Policy ID:', historyPolicy.policy_id);

    // 4. Create Approval Transactions for Seal SDK
    console.log('\n=== Creating Approval Transactions ===');
    
    // Intent approval (for solver to decrypt user intents)
    const intentApprovalTx = client.policies.createIntentApprovalTransaction(
      intentPolicy.policy_id
    );
    console.log('Intent approval transaction created');
    
    // Strategy approval (for authorized access to solver strategies)
    const strategyApprovalTx = client.policies.createStrategyApprovalTransaction(
      strategyPolicy.policy_id
    );
    console.log('Strategy approval transaction created');
    
    // History approval (for analytics access)
    const historyApprovalTx = client.policies.createHistoryApprovalTransaction(
      historyPolicy.policy_id
    );
    console.log('History approval transaction created');

    // 5. Policy Lifecycle Management
    console.log('\n=== Policy Lifecycle Management ===');
    
    // Wait a bit, then demonstrate policy revocation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Revoke intent policy (user can revoke their own policies)
    const revokeResult = await client.policies.revokePolicy(
      PolicyType.INTENT,
      intentPolicy.policy_id,
      userKeypair
    );
    
    console.log('Intent policy revoked:', revokeResult.digest);

    // 6. Batch Auto-Revoke Expired Policies
    console.log('\n=== Auto-Revoke Expired Policies ===');
    
    // Create some test policy IDs (these would be expired in practice)
    const expiredPolicyIds = [
      'intent_batch_old_1',
      'intent_batch_old_2',
      'intent_batch_old_3'
    ];
    
    try {
      const autoRevokeResult = await client.policies.autoRevokeExpired(
        PolicyType.INTENT,
        expiredPolicyIds,
        adminKeypair // Anyone can call this to clean up expired policies
      );
      
      console.log('Auto-revoke completed:', autoRevokeResult.digest);
    } catch (error: any) {
      console.log('Auto-revoke failed (expected for non-existent policies):', error.message);
    }

  } catch (error: any) {
    console.error('Policy management error:', error.message);
    
    // Handle specific policy errors
    if (error.message.includes('3001')) {
      console.log('Policy already exists');
    } else if (error.message.includes('3002')) {
      console.log('Policy not found');
    } else if (error.message.includes('3004')) {
      console.log('Unauthorized access');
    } else if (error.message.includes('3005')) {
      console.log('Policy already revoked');
    }
  }
}

// Example: Policy Integration with Seal SDK
async function demonstrateSealIntegration() {
  console.log('\n=== Seal SDK Integration Example ===');
  
  const client = new IntenusProtocolClient({
    network: 'testnet'
  });

  const userKeypair = Ed25519Keypair.generate();
  const solverKeypair = Ed25519Keypair.generate();

  try {
    // 1. Create policy for intent encryption
    const policyId = `intent_demo_${Date.now()}`;
    const intentPolicy: IntentPolicyConfig = {
      policy_id: policyId,
      batch_id: Math.floor(Date.now() / 1000),
      solver_access_start_ms: Date.now(),
      solver_access_end_ms: Date.now() + 600000, // 10 minutes
      router_access_enabled: true,
      auto_revoke_time: Date.now() + 7200000, // 2 hours
      requires_solver_registration: true,
      min_solver_stake: '1000000000',
      requires_tee_attestation: false,
      expected_measurement: '',
      purpose: 'Demo intent encryption'
    };

    await client.policies.createIntentPolicy(intentPolicy, userKeypair);
    console.log('Demo policy created:', policyId);

    // 2. Create approval transaction for Seal SDK
    const approvalTx = client.policies.createIntentApprovalTransaction(policyId);
    
    // 3. In practice, you would:
    // - Use this transaction with Seal SDK for decryption
    // - Pass the transaction bytes to seal.decrypt()
    // - The Seal SDK validates on-chain policy before decryption
    
    console.log('Approval transaction ready for Seal SDK integration');
    console.log('Transaction target:', approvalTx.blockData.transactions[0].MoveCall?.target);

    // 4. Clean up - revoke the demo policy
    await client.policies.revokePolicy(
      PolicyType.INTENT,
      policyId,
      userKeypair
    );
    
    console.log('Demo policy revoked');

  } catch (error: any) {
    console.error('Seal integration demo error:', error.message);
  }
}

// Run examples
if (require.main === module) {
  main()
    .then(() => demonstrateSealIntegration())
    .catch(console.error);
}
