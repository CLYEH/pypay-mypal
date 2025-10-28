#!/usr/bin/env python3
"""
Main Flask application for blockchain backend.
This backend manages PyPay contract operations.
"""

import os
import pathlib
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from wallet_manager import WalletManager
from contract_manager import ContractManager

# Load environment variables from root directory
env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Enable CORS for frontend integration

# Initialize wallet manager and contract manager
wallet_manager = WalletManager()
contract_manager = ContractManager(wallet_manager)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'address': wallet_manager.get_address(),
        'network': os.getenv('NETWORK', 'mainnet')
    }), 200

@app.route('/balance', methods=['GET'])
def get_balance():
    """Get the balance of the wallet in ETH."""
    try:
        balance = wallet_manager.get_balance()
        return jsonify({
            'success': True,
            'balance': balance
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/address', methods=['GET'])
def get_address():
    """Get the wallet address."""
    try:
        address = wallet_manager.get_address()
        return jsonify({
            'success': True,
            'address': address
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/cross-chain-transfer', methods=['POST'])
def cross_chain_transfer():
    """Call PyPay CrossChainTransfer function."""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = [
            'contract_address', 'source_chain_ids', 'amount_each',
            'nonces', 'expiry', 'destination_chain_id', 'target_address',
            'signature', 'native_fee'
        ]
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Convert signature hex string to bytes
        signature = bytes.fromhex(data['signature'].replace('0x', ''))
        
        # Convert string arrays to int arrays
        source_chain_ids = [int(x) for x in data['source_chain_ids']]
        amount_each = [int(x) for x in data['amount_each']]
        nonces = [int(x) for x in data['nonces']]
        
        # Convert strings to int
        expiry = int(data['expiry'])
        destination_chain_id = int(data['destination_chain_id'])
        native_fee = int(data['native_fee'])
        
        # Call contract function
        tx_hash = contract_manager.cross_chain_transfer(
            contract_address=data['contract_address'],
            source_chain_ids=source_chain_ids,
            amount_each=amount_each,
            nonces=nonces,
            expiry=expiry,
            destination_chain_id=destination_chain_id,
            target_address=data['target_address'],
            signature=signature,
            native_fee=native_fee
        )
        
        return jsonify({
            'success': True,
            'tx_hash': tx_hash,
            'message': 'CrossChainTransfer transaction sent successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/transfer', methods=['POST'])
def transfer():
    """Call PyPay transfer function."""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = [
            'contract_address', 'source_chain_ids', 'amount_each',
            'nonces', 'expiry', 'destination_chain_id', 'target_address',
            'signature'
        ]
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Convert signature hex string to bytes
        signature = bytes.fromhex(data['signature'].replace('0x', ''))
        
        # Convert string arrays to int arrays
        source_chain_ids = [int(x) for x in data['source_chain_ids']]
        amount_each = [int(x) for x in data['amount_each']]
        nonces = [int(x) for x in data['nonces']]
        
        # Convert strings to int
        expiry = int(data['expiry'])
        destination_chain_id = int(data['destination_chain_id'])
        
        # Call contract function
        tx_hash = contract_manager.transfer(
            contract_address=data['contract_address'],
            source_chain_ids=source_chain_ids,
            amount_each=amount_each,
            nonces=nonces,
            expiry=expiry,
            destination_chain_id=destination_chain_id,
            target_address=data['target_address'],
            signature=signature
        )
        
        return jsonify({
            'success': True,
            'tx_hash': tx_hash,
            'message': 'Transfer transaction sent successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/tx-status/<tx_hash>', methods=['GET'])
def get_transaction_status(tx_hash):
    """Get the status of a transaction."""
    try:
        status = contract_manager.get_transaction_receipt(tx_hash)
        return jsonify({
            'success': True,
            'status': status
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/check-cross-chain', methods=['POST'])
def check_cross_chain():
    """Check if cross-chain transfer has been received."""
    try:
        data = request.json
        
        required_fields = ['target_address', 'amount_expected', 'destination_chain_id']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        result = contract_manager.check_cross_chain_received(
            target_address=data['target_address'],
            amount_expected=int(data['amount_expected']),
            destination_chain_id=int(data['destination_chain_id']),
            timeout=int(data.get('timeout', 60))
        )
        
        return jsonify({
            'success': True,
            'result': result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/estimate-fee', methods=['POST'])
def estimate_fee():
    """Estimate native fee for cross-chain transfer by querying the contract."""
    try:
        data = request.json
        
        required_fields = ['contract_address', 'source_chain_id', 'destination_chain_id', 'amount', 'target_address']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        contract_address = data['contract_address']
        source_chain_id = int(data['source_chain_id'])
        destination_chain_id = int(data['destination_chain_id'])
        amount = data['amount']
        target_address = data['target_address']
        
        # Query the contract for the actual native fee
        quote_fee = contract_manager.get_quote_native_fee(
            contract_address=contract_address,
            source_chain_id=source_chain_id,
            destination_chain_id=destination_chain_id,
            amount=amount,
            target_address=target_address
        )
        
        # Add 20% buffer for safety
        estimated_fee = int(quote_fee * 1.2)
        
        return jsonify({
            'success': True,
            'estimated_fee': str(estimated_fee),
            'estimated_fee_eth': estimated_fee / 1e18,
            'quote_fee': str(quote_fee),
            'quote_fee_eth': quote_fee / 1e18,
            'note': 'Fee queried from contract with 20% safety buffer'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5002))  # Changed default to 5002 to avoid conflicts
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
