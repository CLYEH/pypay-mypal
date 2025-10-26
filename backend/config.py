#!/usr/bin/env python3
"""
Configuration file for backend
Update contract addresses here when deploying to different networks
"""

# Factory contract address (same on all chains)
FACTORY_ADDRESS = '0x6D8913325322690F40e45b38BC039c9F76672fc0'

# Operator wallet address (backend wallet)
OPERATOR_ADDRESS = '0x3d94E55a2C3Cf83226b3D056eBeBb43b4731417f'

# PYUSD token addresses
PYUSD_ADDRESSES = {
    1: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8',  # Ethereum Mainnet
    42161: '0x46850aD61C2B7d64d08c9C754F45254596696984'  # Arbitrum Mainnet
}

# OFT contract addresses (LayerZero)
OFT_ADDRESSES = {
    1: '0xa2C323fE5A74aDffAd2bf3E007E36bb029606444',  # Ethereum
    42161: '0xFaB5891ED867a1195303251912013b92c4fc3a1D'  # Arbitrum
}

# Chain IDs
CHAIN_IDS = {
    'ethereum': 1,
    'arbitrum': 42161
}

# Backend API settings
DEFAULT_PORT = 5002
DEFAULT_DEBUG = False

