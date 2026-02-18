#!/bin/bash
export MASTER_MNEMONIC="chalk eight market lion spy virtual general you gallery cruel eternal wood"
export BSC_RPC_URL="https://data-seed-prebsc-1-s1.binance.org:8545/"
export BSC_RPC_FALLBACK_URL="https://data-seed-prebsc-2-s1.binance.org:8545/"

tsx packages/blockchain/src/test-blockchain.ts
