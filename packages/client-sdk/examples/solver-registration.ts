/**
 * Example: Solver Registration and Management
 */

import { IntenusProtocolClient, SolverStatus } from '@intenus/client-sdk';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

async function main() {
  // Initialize client
  const client = new IntenusProtocolClient({
    network: 'testnet'
  });

  // Generate solver keypair (in practice, load from secure storage)
  const solverKeypair = Ed25519Keypair.generate();
  const solverAddress = solverKeypair.toSuiAddress();

  console.log('Solver Address:', solverAddress);

  try {
    // Check connection
    const connected = await client.isConnected();
    if (!connected) {
      throw new Error('Not connected to Sui network');
    }

    // Get registry stats
    const registryStats = await client.solvers.getRegistryStats();
    console.log('Registry Stats:', registryStats);
    console.log('Min Stake Required:', registryStats.min_stake, 'MIST');

    // Check if already registered
    const existingProfile = await client.solvers.getSolverProfile(solverAddress);
    if (existingProfile) {
      console.log('Solver already registered:', existingProfile);
      return;
    }

    // Register as solver with minimum stake
    console.log('Registering solver...');
    const stakeAmount = registryStats.min_stake; // Use minimum required stake
    
    // In practice, you'd need to have SUI coins to stake
    // This example assumes you have a coin object ID
    const coinObjectId = '0x...'; // Replace with actual coin object ID
    
    const registrationResult = await client.solvers.registerSolver(
      coinObjectId,
      solverKeypair
    );

    console.log('Registration successful!');
    console.log('Transaction:', registrationResult.digest);

    // Wait a moment for transaction to be processed
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get updated profile
    const profile = await client.solvers.getSolverProfile(solverAddress);
    console.log('Solver Profile:', profile);

    // Check if active
    const isActive = await client.solvers.isSolverActive(solverAddress);
    console.log('Is Active:', isActive);

    // Validate eligibility
    const eligibility = await client.validateSolverEligibility(solverAddress);
    console.log('Eligibility:', eligibility);

    if (eligibility.can_participate) {
      console.log('✅ Solver is eligible to participate in batches');
    } else {
      console.log('❌ Solver cannot participate:', eligibility.reasons);
    }

    // Example: Increase stake
    console.log('\nIncreasing stake...');
    const additionalStakeAmount = '500000000'; // 0.5 SUI
    const additionalCoinId = '0x...'; // Another coin object ID
    
    const increaseResult = await client.solvers.increaseStake(
      additionalCoinId,
      solverKeypair
    );
    
    console.log('Stake increase successful:', increaseResult.digest);

    // Example: Initiate withdrawal
    console.log('\nInitiating withdrawal...');
    const withdrawalAmount = '100000000'; // 0.1 SUI
    
    const withdrawalResult = await client.solvers.initiateWithdrawal(
      withdrawalAmount,
      solverKeypair
    );
    
    console.log('Withdrawal initiated:', withdrawalResult.digest);
    console.log('Cooldown period: 7 days');

    // Get updated profile after operations
    const updatedProfile = await client.solvers.getSolverProfile(solverAddress);
    console.log('\nUpdated Profile:', updatedProfile);

  } catch (error: any) {
    console.error('Error:', error.message);
    
    // Handle specific error codes
    if (error.message.includes('1001')) {
      console.log('Insufficient stake amount');
    } else if (error.message.includes('1003')) {
      console.log('Solver already registered');
    }
  }
}

// Example: Monitor solver dashboard
async function monitorSolverDashboard(solverAddress: string) {
  const client = new IntenusProtocolClient({
    network: 'testnet'
  });

  try {
    const dashboard = await client.getSolverDashboard(solverAddress);
    
    console.log('=== Solver Dashboard ===');
    console.log('Profile:', dashboard.profile);
    console.log('Eligibility:', dashboard.eligibility);
    console.log('Slash Records:', dashboard.slash_records.length);
    console.log('Recent Batches:', dashboard.recent_batches.length);

    // Check for any issues
    if (dashboard.slash_records.length > 0) {
      console.log('⚠️  Solver has slash records');
      dashboard.slash_records.forEach((record, index) => {
        console.log(`  ${index + 1}. Severity: ${record.severity}, Reason: ${record.reason}`);
      });
    }

    if (!dashboard.eligibility.can_participate) {
      console.log('❌ Solver cannot participate:', dashboard.eligibility.reasons);
    } else {
      console.log('✅ Solver is eligible for participation');
    }

  } catch (error: any) {
    console.error('Dashboard error:', error.message);
  }
}

// Run examples
if (require.main === module) {
  main().catch(console.error);
  
  // Example monitoring (replace with actual solver address)
  // monitorSolverDashboard('0x...').catch(console.error);
}
