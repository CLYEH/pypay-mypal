#!/usr/bin/env python3
"""
Transaction utilities for contract interactions.
Handles smart contract transaction creation and status checking.
"""

class TransactionUtils:
    """Utilities for blockchain transaction operations."""
    
    @staticmethod
    def get_transaction_status(web3, tx_hash):
        """
        Get the status of a transaction.
        
        Args:
            web3: Web3 instance
            tx_hash: Transaction hash
        
        Returns:
            Dictionary with transaction status
        """
        try:
            receipt = web3.eth.get_transaction_receipt(tx_hash)
            
            status_info = {
                'status': 'confirmed',
                'block_number': receipt['blockNumber'],
                'gas_used': receipt['gasUsed'],
                'confirmations': 1
            }
            
            # Check if the transaction failed
            if receipt['status'] == 0:
                status_info['status'] = 'failed'
            else:
                status_info['status'] = 'success'
            
            # Get current block to calculate confirmations
            current_block = web3.eth.block_number
            status_info['confirmations'] = current_block - receipt['blockNumber']
            
            return status_info
            
        except Exception as e:
            # Transaction not yet confirmed
            return {
                'status': 'pending',
                'error': str(e)
            }
    
    @staticmethod
    def send_contract_transaction(wallet_manager, contract_address, function_name, params=[]):
        """
        Send a transaction to a smart contract.
        
        Args:
            wallet_manager: WalletManager instance
            contract_address: Contract address
            function_name: Name of the function to call
            params: Parameters for the function
        
        Returns:
            Transaction hash
        """
        # This is a basic implementation
        # For full functionality, you would need the contract ABI
        # You can extend this to load ABI from a file or use it from parameters
        
        web3 = wallet_manager.web3
        
        # Build the transaction for a contract call
        # Note: This is a simplified version
        # In a real implementation, you would use the contract ABI
        # to encode the function call
        
        transaction = {
            'to': contract_address,
            'value': 0,
            'gas': 100000,  # Default gas limit
            'gasPrice': web3.eth.gas_price,
            'nonce': web3.eth.get_transaction_count(wallet_manager.address)
        }
        
        # Sign and send transaction
        signed_txn = wallet_manager.account.sign_transaction(transaction)
        tx_hash = web3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        print(f'Contract transaction sent: {tx_hash.hex()}')
        return tx_hash.hex()

