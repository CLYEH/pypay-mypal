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
            # Default RPC URLs for different networks
            rpc_urls = {
                'mainnet': 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',
                'arbitrum': 'https://arb1.arbitrum.io/rpc',
                'arbitrum-sepolia': 'https://sepolia-rollup.arbitrum.io/rpc',
                'localhost': 'http://localhost:8545'
            }
            rpc_url = rpc_urls.get(network, 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY')
        
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
    
    def get_address(self):
        """Get the wallet address."""
        return self.address
    
    def get_balance(self):
        """Get the balance of the wallet in ETH."""
        balance_wei = self.web3.eth.get_balance(self.address)
        balance_eth = self.web3.from_wei(balance_wei, 'ether')
        return str(balance_eth)
    
    def get_balance_wei(self):
        """Get the balance of the wallet in Wei."""
        return self.web3.eth.get_balance(self.address)
    
    def send_transaction(self, to_address, value, gas_price=None, gas_limit=21000):
        """
        Send a transaction to the blockchain.
        
        Args:
            to_address: Recipient address
            value: Amount to send (in ETH as a string or number)
            gas_price: Gas price in Wei (optional, will be fetched if not provided)
            gas_limit: Gas limit (default: 21000)
        
        Returns:
            Transaction hash
        """
        # Validate address
        if not self.web3.is_address(to_address):
            raise ValueError('Invalid recipient address')
        
        # Convert value to Wei
        if isinstance(value, str):
            value = float(value)
        value_wei = self.web3.to_wei(value, 'ether')
        
        # Build transaction
        transaction = {
            'to': to_address,
            'value': value_wei,
            'gas': gas_limit,
        }
        
        # Get gas price if not provided
        if gas_price is None:
            gas_price = self.web3.eth.gas_price
        transaction['gasPrice'] = gas_price
        
        # Get nonce
        nonce = self.web3.eth.get_transaction_count(self.address)
        transaction['nonce'] = nonce
        
        # Sign transaction
        signed_txn = self.account.sign_transaction(transaction)
        
        # Send transaction
        tx_hash = self.web3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        print(f'Transaction sent: {tx_hash.hex()}')
        return tx_hash.hex()
    
    def wait_for_receipt(self, tx_hash, timeout=120):
        """
        Wait for transaction receipt.
        
        Args:
            tx_hash: Transaction hash
            timeout: Timeout in seconds (default: 120)
        
        Returns:
            Transaction receipt
        """
        receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash, timeout=timeout)
        return receipt

