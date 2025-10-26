# Backend - PyPay Contract Server

Python Flask backend for managing PyPay contract operations.

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or use a virtual environment (recommended):

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp env.example .env
```

Edit `.env` and add your private key:

```bash
PRIVATE_KEY=your_private_key_here_without_0x_prefix
NETWORK=arbitrum  # or 'mainnet', 'arbitrum-sepolia', etc.
PORT=5000
```

**Important**: Never commit your `.env` file or expose your private key!

### 3. Run the Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
```bash
GET /health
```
Returns server status and wallet address.

**Response:**
```json
{
  "status": "healthy",
  "address": "0x...",
  "network": "arbitrum"
}
```

### Get Wallet Address
```bash
GET /address
```
Returns the wallet address being managed.

**Response:**
```json
{
  "success": true,
  "address": "0x..."
}
```

### Get Balance
```bash
GET /balance
```
Returns the wallet balance in ETH.

**Response:**
```json
{
  "success": true,
  "balance": "1.2345"
}
```

### Cross Chain Transfer
```bash
POST /cross-chain-transfer
Content-Type: application/json
```

Call PyPay `CrossChainTransfer` function.

**Request Body:**
```json
{
  "contract_address": "0x...",
  "source_chain_ids": [1, 42161],
  "amount_each": [1000000000000000000, 2000000000000000000],
  "nonces": [1, 2],
  "expiry": 1735689600,
  "destination_chain_id": 42161,
  "target_address": "0x...",
  "signature": "0x...",
  "native_fee": 100000000000000000
}
```

**Response:**
```json
{
  "success": true,
  "tx_hash": "0x...",
  "message": "CrossChainTransfer transaction sent successfully"
}
```

### Transfer
```bash
POST /transfer
Content-Type: application/json
```

Call PyPay `transfer` function.

**Request Body:**
```json
{
  "contract_address": "0x...",
  "source_chain_ids": [1, 42161],
  "amount_each": [1000000000000000000, 2000000000000000000],
  "nonces": [1, 2],
  "expiry": 1735689600,
  "destination_chain_id": 42161,
  "target_address": "0x...",
  "signature": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "tx_hash": "0x...",
  "message": "Transfer transaction sent successfully"
}
```

### Get Transaction Status
```bash
GET /tx-status/<tx_hash>
```

Get the status of a transaction.

**Response:**
```json
{
  "success": true,
  "status": {
    "status": "success",
    "block_number": 12345,
    "gas_used": 21000,
    "confirmations": 10,
    "transaction_hash": "0x..."
  }
}
```

## Configuration

### Networks

The backend supports multiple networks:
- `mainnet` - Ethereum mainnet
- `arbitrum` - Arbitrum mainnet
- `arbitrum-sepolia` - Arbitrum Sepolia testnet
- `localhost` - Local Hardhat node

Set the network in your `.env` file:
```bash
NETWORK=arbitrum
```

Or specify a custom RPC URL:
```bash
RPC_URL=https://arb1.arbitrum.io/rpc
```

## Development

### Running in Debug Mode

Set `DEBUG=True` in your `.env` file:
```bash
DEBUG=True
```

### Testing

You can test the API using curl:

```bash
# Check health
curl http://localhost:5000/health

# Get balance
curl http://localhost:5000/balance

# Get address
curl http://localhost:5000/address
```

## Function Details

### CrossChainTransfer

This function performs a cross-chain transfer using LayerZero OFT protocol.

**Parameters:**
- `source_chain_ids`: Array of source chain IDs
- `amount_each`: Array of amounts for each chain
- `nonces`: Array of nonces for each chain
- `expiry`: Unix timestamp when the transaction expires
- `destination_chain_id`: Target chain ID
- `target_address`: Recipient address on destination chain
- `signature`: ECDSA signature
- `native_fee`: Native token fee for the cross-chain message

### Transfer

This function performs a local transfer of PYUSD tokens.

**Parameters:**
- `source_chain_ids`: Array of source chain IDs
- `amount_each`: Array of amounts for each chain
- `nonces`: Array of nonces for each chain
- `expiry`: Unix timestamp when the transaction expires
- `destination_chain_id`: Target chain ID
- `target_address`: Recipient address
- `signature`: ECDSA signature

## Security Notes

1. **Never commit your `.env` file** - it contains your private key
2. **Never expose your private key** in logs or error messages
3. **Use environment variables** for sensitive configuration
4. **Run on HTTPS** in production
5. **Add authentication** before deploying to production
6. The backend must be the **operator** of the PyPay contract

## Troubleshooting

### Connection Errors

If you see "Cannot connect to RPC":
- Check your internet connection
- Verify the RPC URL is correct
- Ensure the network is available

### Transaction Failures

If transactions fail:
- Check you have sufficient balance for gas
- Verify the signature is valid
- Ensure nonces haven't been used
- Check that the transaction hasn't expired
- Verify you're the operator of the contract

### Import Errors

If you see import errors:
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Activate your virtual environment if using one
