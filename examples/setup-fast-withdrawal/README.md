# Setup a fast-withdrawal committee for your AnyTrust Orbit chain

This example script shows how to setup a fast-withdrawal committee for your AnyTrust Orbit chain.

## Rationale

Optimistic rollups must sustain a multi-day challenge period to allow time for fraud proofs. This delays finality for users and apps, resulting in multi-day withdrawal times and cross-chain communication delays.

Fast Withdrawals is a new configuration allowing Orbit chains to achieve fast finality. Orbit chains with Fast Withdrawals will have their transactions processed by a committee of validators. Transactions with a unanimous vote across the committee will have their state transition immediately confirmed.

This will allow:

- Orbit chains can configure a fast confirmation frequency (any time up to 15 minutes)
- User withdrawals to are confirmed on the parent chain at frequencies up to ~15 minutes
- Enhanced cross-chain communication by allowing cross-chain apps to read finalized state up to the fast confirmation frequency

## How it works

This script performs the following operations:

1. Create a new n/n Safe wallet with the specified validators as signers
2. Add the specified validators to the Rollup validators whitelist
3. Set the new Safe wallet as the anytrustFastConfirmer in the Rollup contract
4. Set the new minimumAssertionPeriod if needed
5. Show how to configure the batch poster and validator nodes

## Variables needed

You need to set the following environment variables in an .env file:

- CHAIN_OWNER_PRIVATE_KEY: private key of the account with executor privileges in the UpgradeExecutor admin contract for the chain. It will be the deployer of the multisig Safe wallet.
- PARENT_CHAIN_ID: chainId of the parent chain.
- ROLLUP_ADDRESS: address of the Rollup contract.
- FC_VALIDATORS: array of fast-withdrawal validators. They will be added as signers to the multisig Safe wallet, and will be added to the Rollup's validator whitelist.
- MINIMUM_ASSERTION_PERIOD: optional parameter. Minimum number of blocks that have to pass in between assertions (measured in L1 blocks).

## Setup

1. Install dependencies

   ```bash
   yarn install
   ```

2. Create .env file and add the env vars

   ```bash
   cp .env.example .env
   ```

3. Run the example
   ```bash
   yarn dev
   ```



## Multisig ownership
Beware: At least one of the signers needs to be an EOA account so that it can propose transactions through this script.

1. Build this example: tsc --outDir dist 
2. OWNER_1_ADDRESS_PRIVATE_KEY= PARENT_CHAIN_ID=11155111 SAFE_ADDRESS=0x5c9441C544bb60A5e560Aef68E134d62eED6e8c0 FC_VALIDATORS='["0xf9219Acf7A94e5069c8fE71f75eE9186957e7E90"]' node ./dist/1-create_multisig.js
This step will create a new Safe on the parent chain and add fast confirmation validators as owners.

If you want to use this script then you need to make sure the owner of the Rollup has been transfered to a Multisig:
Constellation-Monorepo/scripts/nitro$ npx ts-node src/owner.ts l1 grant --upgrade-executor 0x1c9f0315496496b69a86c043EbC112D20Ff3357b --private-key <old owner PK> --new-owner 0x5c9441C544bb60A5e560Aef68E134d62eED6e8c0 --provider https://eth-sepolia.g.alchemy.com/v2/fpQPC7q22cy7i2rILZBCiibBXQkjpwJO

Granting L1 ownership with 0x5c9441C544bb60A5e560Aef68E134d62eED6e8c0
Ownership granted to 0x5c9441C544bb60A5e560Aef68E134d62eED6e8c0

3.  OWNER_1_ADDRESS_PRIVATE_KEY= PARENT_CHAIN_ID=11155111 SAFE_ADDRESS=0x5c9441C544bb60A5e560Aef68E134d62eED6e8c0 FC_VALIDATORS_SAFE_ADDRESS=0xBE17DBcCBaC59208D3130e05f1FECAFC1c1d59e0 FC_VALIDATORS='["0xf9219Acf7A94e5069c8fE71f75eE9186957e7E90"]' ROLLUP_ADDRESS=0x81299ecC057194Bec6d403a110a2C74a8A07A3bF RPC=https://eth-sepolia.g.alchemy.com/v2/fpQPC7q22cy7i2rILZBCiibBXQkjpwJO node ./dist/2-add_validators.js
the validators list is expanded with the Safe created with step 1 (1-create_multisig). That's why you need to provide FC_VALIDATORS_SAFE_ADDRESS. 

4. OWNER_1_ADDRESS_PRIVATE_KEY= PARENT_CHAIN_ID=11155111 SAFE_ADDRESS=0x5c9441C544bb60A5e560Aef68E134d62eED6e8c0 FC_VALIDATORS_SAFE_ADDRESS=0xBE17DBcCBaC59208D3130e05f1FECAFC1c1d59e0 ROLLUP_ADDRESS=0x81299ecC057194Bec6d403a110a2C74a8A07A3bF RPC=https://eth-sepolia.g.alchemy.com/v2/fpQPC7q22cy7i2rILZBCiibBXQkjpwJO node ./dist/3-set-any-trust-fast-confirmer.js
We also add this Safe as `fast confirmer`.

5. OWNER_1_ADDRESS_PRIVATE_KEY= PARENT_CHAIN_ID=11155111 SAFE_ADDRESS=0x5c9441C544bb60A5e560Aef68E134d62eED6e8c0 MINIMUM_ASSERTION_PERIOD=25 ROLLUP_ADDRESS=0x81299ecC057194Bec6d403a110a2C74a8A07A3bF RPC=https://eth-sepolia.g.alchemy.com/v2/fpQPC7q22cy7i2rILZBCiibBXQkjpwJO node ./dist/4-configure-minimum-assertion-period.js
