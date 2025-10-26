#!/usr/bin/env python3
"""
Main Flask application for blockchain backend.
This backend manages wallet operations and sends transactions to the blockchain.
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from wallet_manager import WalletManager
from transaction_utils import TransactionUtils

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Initialize wallet manager
wallet_manager = WalletManager()

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

@app.route('/send-transaction', methods=['POST'])
def send_transaction():
    """Send a transaction to the blockchain."""
    try:
        data = request.json
        
        # Validate required fields
        if not data or 'to' not in data or 'value' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: to, value'
            }), 400
        
        to_address = data['to']
        value = data['value']
        gas_price = data.get('gas_price')
        gas_limit = data.get('gas_limit', 21000)
        
        # Send transaction
        tx_hash = wallet_manager.send_transaction(
            to_address=to_address,
            value=value,
            gas_price=gas_price,
            gas_limit=gas_limit
        )
        
        return jsonify({
            'success': True,
            'tx_hash': tx_hash,
            'message': 'Transaction sent successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/send-contract-tx', methods=['POST'])
def send_contract_transaction():
    """Send a transaction to a smart contract."""
    try:
        data = request.json
        
        # Validate required fields
        if not data or 'contract_address' not in data or 'function_name' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: contract_address, function_name'
            }), 400
        
        contract_address = data['contract_address']
        function_name = data['function_name']
        params = data.get('params', [])
        
        # Send contract transaction
        tx_hash = TransactionUtils.send_contract_transaction(
            wallet_manager=wallet_manager,
            contract_address=contract_address,
            function_name=function_name,
            params=params
        )
        
        return jsonify({
            'success': True,
            'tx_hash': tx_hash,
            'message': 'Contract transaction sent successfully'
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
        status = TransactionUtils.get_transaction_status(wallet_manager.web3, tx_hash)
        return jsonify({
            'success': True,
            'status': status
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
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)

