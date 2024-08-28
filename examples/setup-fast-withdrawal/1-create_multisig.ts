import { createPublicClient, http, isAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  createSafePrepareTransactionRequest,
} from '@arbitrum/orbit-sdk';
import { getParentChainFromId, sanitizePrivateKey } from '@arbitrum/orbit-sdk/utils';
import { config } from 'dotenv';
import SafeApiKit from '@safe-global/api-kit'
import Safe from '@safe-global/protocol-kit'
import {
  MetaTransactionData,
  OperationType
} from '@safe-global/safe-core-sdk-types'

config();

// helper

//check environment variables
if (typeof process.env.OWNER_1_ADDRESS_PRIVATE_KEY === 'undefined') {
  throw new Error(`Please provide the "OWNER_1_ADDRESS_PRIVATE_KEY" environment variable`);
}

if (typeof process.env.PARENT_CHAIN_ID === 'undefined') {
  throw new Error(`Please provide the "PARENT_CHAIN_ID" environment variable`);
}

if (typeof process.env.SAFE_ADDRESS === 'undefined') {
  throw new Error(`Please provide the "SAFE_ADDRESS" environment variable`);
}

if (typeof process.env.FC_VALIDATORS === 'undefined') {
  throw new Error(`Please provide the "FC_VALIDATORS" environment variable`);
}

const safeAddress = process.env.SAFE_ADDRESS as `0x${string}`;
// // set the parent chain and create a public client for it
const parentChainId = Number(process.env.PARENT_CHAIN_ID);
const parentChain = getParentChainFromId(parentChainId);
const parentChainPublicClient = createPublicClient({
  chain: parentChain,
  transport: http(),
});


// sanitize validator addresses
console.log(process.env.FC_VALIDATORS);
const fcValidators = JSON.parse(process.env.FC_VALIDATORS);
const safeWalletThreshold = fcValidators.length;
if (!fcValidators) {
  throw new Error(`The "FC_VALIDATORS" environment variable must be a valid array`);
}

const sanitizedFcValidators = [
  ...new Set(
    fcValidators.filter((validator: `0x${string}`) =>
      isAddress(validator) ? validator : undefined,
    ),
  ),
];
if (sanitizedFcValidators.length !== safeWalletThreshold) {
  throw new Error(
    `Some of the addresses in the "FC_VALIDATORS" environment variable appear to not be valid or duplicated.`,
  );
}

async function main() {
  //
  // Step 1. Create Safe multisig
  //
  console.log(
    `Step 1: Create a new ${safeWalletThreshold}/${safeWalletThreshold} Safe wallet with the following addresses as signers:`,
    fcValidators,
  );
  console.log('---');
  const txRequest = await createSafePrepareTransactionRequest({
    publicClient: parentChainPublicClient,
    account: safeAddress,
    owners: fcValidators,
    threshold: safeWalletThreshold,
    saltNonce: BigInt(Date.now())
  });
  const protocolKitOwner1 = await Safe.default.init({
    provider: parentChainPublicClient.transport,
    signer: process.env.OWNER_1_ADDRESS_PRIVATE_KEY as `${string}`,
    safeAddress: process.env.SAFE_ADDRESS as `0x${string}`,
  })
  
  const safeTransactionData: MetaTransactionData = {
    to: txRequest.to as `0x${string}`,
    value: '0',
    data: txRequest.data as `0x${string}`,
    operation: OperationType.Call
  }
  const safeTransaction = await protocolKitOwner1.createTransaction({
    transactions: [safeTransactionData]
  })
  // Propose transaction to the service
  const chainId = BigInt(String(process.env.PARENT_CHAIN_ID));
  const apiKit = new SafeApiKit.default({
    chainId: chainId, // set the correct chainId
  })
  const safeTxHash = await protocolKitOwner1.getTransactionHash(safeTransaction)
  const signature = await protocolKitOwner1.signHash(safeTxHash)
  const senderAddress = privateKeyToAccount(sanitizePrivateKey(process.env.OWNER_1_ADDRESS_PRIVATE_KEY as `${string}`));
  console.log('Proposing...')
  await apiKit.proposeTransaction({
    safeAddress: process.env.SAFE_ADDRESS as `0x${string}`,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress: senderAddress.address,
    senderSignature: signature.data
  })
  //execute the transaction
  //https://help.safe.global/en/articles/40834-verify-safe-creation
  //in the executed transaction find `ProxyCreation` event
  //Data singleton : <address> is what you're looing for
}

main();
