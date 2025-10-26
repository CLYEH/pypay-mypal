#!/usr/bin/env python3
"""
Contract Manager for PyPay contract interactions.
Handles CrossChainTransfer and transfer function calls.
"""

import os
import json
from web3 import Web3
from web3.middleware import geth_poa_middleware
from eth_account import Account
from eth_utils import is_address
from config import FACTORY_ADDRESS, OPERATOR_ADDRESS, PYUSD_ADDRESSES, OFT_ADDRESSES

class ContractManager:
    """Manages PyPay contract interactions."""
    
    def __init__(self, wallet_manager):
        """Initialize the contract manager."""
        self.wallet_manager = wallet_manager
        self.web3 = wallet_manager.web3
        
        # Load PyPay ABI
        abi_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'artifacts/contracts/pypay.sol/PyPay.json'
        )
        
        with open(abi_path, 'r') as f:
            abi = json.load(f)['abi']
        
        self.abi = abi
    
    def get_web3_for_chain(self, chain_id):
        """
        Get Web3 instance for the specified chain.
        
        Args:
            chain_id: Chain ID (1 for Ethereum, 42161 for Arbitrum)
        
        Returns:
            Web3 instance
        """
        # Get RPC URL based on chain ID
        if chain_id == 1:  # Ethereum
            alchemy_key = os.getenv('ALCHEMY_API_KEY_ETHEREUM')
            if alchemy_key:
                rpc_url = f'https://eth-mainnet.g.alchemy.com/v2/{alchemy_key}'
            else:
                rpc_url = 'https://eth.llamarpc.com'
        elif chain_id == 42161:  # Arbitrum
            alchemy_key = os.getenv('ALCHEMY_API_KEY_ARBITRUM')
            if alchemy_key:
                rpc_url = f'https://arb-mainnet.g.alchemy.com/v2/{alchemy_key}'
            else:
                rpc_url = 'https://arb1.arbitrum.io/rpc'
        else:
            raise ValueError(f'Unsupported chain ID: {chain_id}')
        
        # Create Web3 instance
        web3 = Web3(Web3.HTTPProvider(rpc_url))
        
        # Add PoA middleware for Arbitrum and other PoA chains
        web3.middleware_onion.inject(geth_poa_middleware, layer=0)
        
        # Check connection
        if not web3.is_connected():
            raise ConnectionError(f'Cannot connect to chain {chain_id} RPC: {rpc_url}')
        
        return web3
    
    def call_contract(self, contract_address, function_name, args, chain_id=None):
        """
        Call a contract function.
        
        Args:
            contract_address: Contract address
            function_name: Function name to call
            args: Function arguments
            chain_id: Optional chain ID to use (if None, uses default)
        
        Returns:
            Transaction hash
        """
        if not is_address(contract_address):
            raise ValueError(f'Invalid contract address: {contract_address}')
        
        # Use specified chain or default web3
        if chain_id is not None:
            web3 = self.get_web3_for_chain(chain_id)
        else:
            web3 = self.web3
        
        # Create contract instance
        contract = web3.eth.contract(
            address=Web3.to_checksum_address(contract_address),
            abi=self.abi
        )
        
        # Get function
        func = getattr(contract.functions, function_name)
        
        # Build transaction
        try:
            transaction = func(*args).build_transaction({
                'from': self.wallet_manager.address,
                'nonce': web3.eth.get_transaction_count(self.wallet_manager.address),
                'gas': 500000,  # Adjust as needed
                'gasPrice': web3.eth.gas_price
            })
        except Exception as e:
            raise ValueError(f'Error building transaction: {str(e)}')
        
        # Sign transaction
        signed_txn = self.wallet_manager.account.sign_transaction(transaction)
        
        # Send transaction
        tx_hash = web3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        return tx_hash.hex()
    
    def cross_chain_transfer(
        self,
        contract_address,
        source_chain_ids,
        amount_each,
        nonces,
        expiry,
        destination_chain_id,
        target_address,
        signature,
        native_fee
    ):
        """
        Call CrossChainTransfer function.
        
        Args:
            contract_address: PyPay contract address
            source_chain_ids: List of source chain IDs (uint256[])
            amount_each: List of amounts for each chain (uint256[])
            nonces: List of nonces (uint256[])
            expiry: Expiry timestamp (uint256)
            destination_chain_id: Destination chain ID (uint256)
            target_address: Target address
            signature: Signature bytes
            native_fee: Native fee amount (uint256)
        
        Returns:
            Transaction hash
        """
        # Determine which chain to send the transaction to based on source_chain_ids
        # For now, use the first chain in the array as the source chain
        if not source_chain_ids:
            raise ValueError('source_chain_ids cannot be empty')
        
        source_chain_id = source_chain_ids[0]
        
        args = [
            source_chain_ids,
            amount_each,
            nonces,
            expiry,
            destination_chain_id,
            target_address,
            signature,
            native_fee
        ]
        
        return self.call_contract(
            contract_address=contract_address,
            function_name='CrossChainTransfer',
            args=args,
            chain_id=source_chain_id
        )
    
    def transfer(
        self,
        contract_address,
        source_chain_ids,
        amount_each,
        nonces,
        expiry,
        destination_chain_id,
        target_address,
        signature
    ):
        """
        Call transfer function. Supports multiple source chains.
        For each chain in source_chain_ids, calls transfer on that chain.
        
        Args:
            contract_address: PyPay contract address
            source_chain_ids: List of source chain IDs (uint256[])
            amount_each: List of amounts for each chain (uint256[])
            nonces: List of nonces (uint256[])
            expiry: Expiry timestamp (uint256)
            destination_chain_id: Destination chain ID (uint256)
            target_address: Target address
            signature: Signature bytes
        
        Returns:
            List of transaction hashes
        """
        if not source_chain_ids:
            raise ValueError('source_chain_ids cannot be empty')
        
        # Determine which chain this transaction is for
        # The contract will check which chain it's running on and only process that chain's part
        source_chain_id = source_chain_ids[0]
        
        args = [
            source_chain_ids,
            amount_each,
            nonces,
            expiry,
            destination_chain_id,
            target_address,
            signature
        ]
        
        return self.call_contract(
            contract_address=contract_address,
            function_name='transfer',
            args=args,
            chain_id=source_chain_id
        )
    
    def _compute_contract_address(self, user_address, chain_id):
        """Compute PyPay contract address for a given user and chain."""
        # This should match the Factory.computeAddress logic
        # Use addresses from config
        
        web3 = self.get_web3_for_chain(chain_id)
        factory_abi = [
            {
                "inputs": [
                    {"internalType": "uint256", "name": "_salt_int", "type": "uint256"},
                    {"internalType": "address", "name": "signer", "type": "address"},
                    {"internalType": "address", "name": "operator", "type": "address"}
                ],
                "name": "computeAddress",
                "outputs": [{"internalType": "address", "name": "", "type": "address"}],
                "stateMutability": "view",
                "type": "function",
            }
        ]
        
        factory = web3.eth.contract(
            address=Web3.to_checksum_address(FACTORY_ADDRESS),
            abi=factory_abi
        )
        
        # Use OPERATOR_ADDRESS from config
        result = factory.functions.computeAddress(0, user_address, OPERATOR_ADDRESS).call()
        return result
    
    def get_transaction_receipt(self, tx_hash, timeout=120):
        """
        Wait for and return transaction receipt.
        
        Args:
            tx_hash: Transaction hash
            timeout: Timeout in seconds (default: 120)
        
        Returns:
            Transaction receipt
        """
        try:
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash, timeout=timeout)
            return {
                'status': 'success' if receipt['status'] == 1 else 'failed',
                'block_number': receipt['blockNumber'],
                'gas_used': receipt['gasUsed'],
                'confirmations': 1,
                'transaction_hash': receipt['transactionHash'].hex()
            }
        except Exception as e:
            return {
                'status': 'pending',
                'error': str(e)
            }
    
    def check_cross_chain_received(
        self,
        target_address,
        amount_expected,
        destination_chain_id,
        timeout=60
    ):
        """
        Check if cross-chain transfer has been received on the destination chain.
        
        Args:
            target_address: Address that should receive the transfer
            amount_expected: Expected amount to be received
            destination_chain_id: Destination chain ID
            timeout: Timeout in seconds (default: 60)
        
        Returns:
            dict with status information
        """
        try:
            # Get Web3 for destination chain
            web3_dest = self.get_web3_for_chain(destination_chain_id)
            
            # Load token address for destination chain from config
            if destination_chain_id not in PYUSD_ADDRESSES:
                return {'received': False, 'error': f'Unsupported chain: {destination_chain_id}'}
            
            token_address = PYUSD_ADDRESSES[destination_chain_id]
            
            # Get ERC20 token contract
            erc20_abi = [
                {
                    "constant": True,
                    "inputs": [{"name": "_owner", "type": "address"}],
                    "name": "balanceOf",
                    "outputs": [{"name": "balance", "type": "uint256"}],
                    "payable": False,
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "constant": True,
                    "inputs": [],
                    "name": "decimals",
                    "outputs": [{"name": "", "type": "uint8"}],
                    "payable": False,
                    "stateMutability": "view",
                    "type": "function"
                }
            ]
            
            token_contract = web3_dest.eth.contract(
                address=Web3.to_checksum_address(token_address),
                abi=erc20_abi
            )
            
            # Check balance
            balance = token_contract.functions.balanceOf(
                Web3.to_checksum_address(target_address)
            ).call()
            
            decimals = token_contract.functions.decimals().call()
            balance_formatted = balance / (10 ** decimals)
            expected_formatted = amount_expected / 1e6  # PYUSD has 6 decimals
            
            return {
                'received': balance_formatted >= expected_formatted,
                'current_balance': balance_formatted,
                'expected_balance': expected_formatted,
                'chain_id': destination_chain_id,
                'address': target_address
            }
        except Exception as e:
            return {
                'received': False,
                'error': str(e)
            }

