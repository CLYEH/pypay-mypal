# Backend - Blockchain Transaction Server

Python Flask backend for managing blockchain wallet operations and sending transactions.

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

### Get Wallet Address
```bash
GET /address
```
Returns the wallet address being managed.

### Get Balance
```bash
GET /balance
```
Returns the wallet balance in ETH.

### Send Transaction
```bash
POST /send-transaction
Content-Type: application/json

{
  "to": "0x...",
  "value": "0.001",
  "gas_price": null,  # optional
  "gas_limit": 21000  # optional, default: 21000
}
```

### Send Contract Transaction
```bash
POST /send-contract-tx
Content-Type: application/json

{
  "contract_address": "0x...",
  "function_name": "transfer",
  "params": ["0x...", "1000000000000000000"]
}
```

### Get Transaction Status
```bash
GET /tx-status/<tx_hash>
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

## Security Notes

1. **Never commit your `.env` file** - it contains your private key
2. **Never expose your private key** in logs or error messages
3. **Use environment variables** for sensitive configuration
4. **Run on HTTPS** in production
5. **Add authentication** before deploying to production

## Troubleshooting

### Connection Errors

If you see "Cannot connect to RPC":
- Check your internet connection
- Verify the RPC URL is correct
- Ensure the network is available

### Transaction Failures

If transactions fail:
- Check you have sufficient balance for gas
- Verify recipient addresses are valid
- Ensure gas price/gas limit are appropriate

### Import Errors

If you see import errors:
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Activate your virtual environment if using one

