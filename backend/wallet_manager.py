#!/usr/bin/env python3
"""
Wallet Manager for managing blockchain wallet operations.
Handles wallet initialization, balance checking, and transaction sending.
"""

import os
from web3 import Web3
from web3.middleware import geth_poa_middleware
from eth_account import Account

class WalletManager:
    """Manages wallet operations for blockchain interactions."""
    
    def __init__(self):
        """Initialize the wallet manager with private key from environment."""
        # Load private key from environment
        self.private_key = os.getenv('PRIVATE_KEY')
        
        if not self.private_key:
            raise ValueError('PRIVATE_KEY not found in environment variables')
        
        # Get the network from environment or use default
        rpc_url = os.getenv('RPC_URL')
        if not rpc_url:
            network = os.getenv('NETWORK', 'mainnet')
            alchemy_key_ethereum = os.getenv('ALCHEMY_API_KEY_ETHEREUM')
            alchemy_key_arbitrum = os.getenv('ALCHEMY_API_KEY_ARBITRUM')
            alchemy_key_arbitrum_sepolia = os.getenv('ALCHEMY_API_KEY_ARBITRUM_SEPOLIA')
            
            # Default RPC URLs for different networks
            if network == 'mainnet' or network == 'ethereum':
                if alchemy_key_ethereum:
                    rpc_url = f'https://eth-mainnet.g.alchemy.com/v2/{alchemy_key_ethereum}'
                else:
                    raise ValueError('ALCHEMY_API_KEY_ETHEREUM not found in environment variables')
            elif network == 'arbitrum':
                if alchemy_key_arbitrum:
                    rpc_url = f'https://arb-mainnet.g.alchemy.com/v2/{alchemy_key_arbitrum}'
                else:
                    rpc_url = 'https://arb1.arbitrum.io/rpc'
            elif network == 'arbitrum-sepolia':
                if alchemy_key_arbitrum_sepolia:
                    rpc_url = f'https://arb-sepolia.g.alchemy.com/v2/{alchemy_key_arbitrum_sepolia}'
                else:
                    rpc_url = 'https://sepolia-rollup.arbitrum.io/rpc'
            elif network == 'localhost':
                rpc_url = 'http://localhost:8545'
            else:
                raise ValueError(f'Unknown network: {network}')
        
        # Initialize Web3 connection
        self.web3 = Web3(Web3.HTTPProvider(rpc_url))
        
        # Add PoA middleware for Arbitrum and other PoA chains
        self.web3.middleware_onion.inject(geth_poa_middleware, layer=0)
        
        # Check connection
        if not self.web3.is_connected():
            raise ConnectionError(f'Cannot connect to RPC: {rpc_url}')
        
        # Create account from private key
        self.account = Account.from_key(self.private_key)
        self.address = self.account.address
        
        print(f'Wallet initialized: {self.address}')
        print(f'Connected to RPC: {rpc_url}')
    
    def get_address(self):
        """Get the wallet address."""
        return self.address
    
    def get_balance(self):
        """Get the balance of the wallet in ETH."""
        balance_wei = self.web3.eth.get_balance(self.address)
        balance_eth = self.web3.from_wei(balance_wei, 'ether')
        return str(balance_eth)
    

