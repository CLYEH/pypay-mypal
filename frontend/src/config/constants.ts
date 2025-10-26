/**
 * Application Constants Configuration
 * Update these values when contracts are deployed
 */

// Factory 合約地址（兩條鏈都一樣）
export const FACTORY_ADDRESS = '0x6D8913325322690F40e45b38BC039c9F76672fc0' as `0x${string}`

// Operator 後端錢包地址
export const OPERATOR_ADDRESS = '0x3d94E55a2C3Cf83226b3D056eBeBb43b4731417f' as `0x${string}`

// PYUSD Token 地址
export const PYUSD_ADDRESSES = {
  1: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8' as `0x${string}`, // Ethereum Mainnet
  42161: '0x46850aD61C2B7d64d08c9C754F45254596696984' as `0x${string}` // Arbitrum Mainnet
} as const

// Backend API URL
export const BACKEND_URL = 'http://localhost:5002'

// Network Configuration
// Note: For production, use environment variables for Alchemy keys
const ALCHEMY_KEY_ETH = import.meta.env.VITE_ALCHEMY_API_KEY_ETHEREUM
const ALCHEMY_KEY_ARB = import.meta.env.VITE_ALCHEMY_API_KEY_ARBITRUM

export const NETWORKS = {
  ethereum: {
    name: 'Ethereum',
    chainId: 1,
    token: PYUSD_ADDRESSES[1],
    rpc: ALCHEMY_KEY_ETH ? `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY_ETH}` : 'https://eth.llamarpc.com'
    //rpc: 'https://eth.llamarpc.com' // Fallback RPC
  },
  arbitrum: {
    name: 'Arbitrum',
    chainId: 42161,
    token: PYUSD_ADDRESSES[42161],
    rpc: ALCHEMY_KEY_ARB ? `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY_ARB}` : 'https://arb1.arbitrum.io/rpc'
    //rpc: 'https://arb1.arbitrum.io/rpc' // Fallback RPC
  }
} as const

// RPC URLs - Can be overridden with environment variables
export const RPC_URLS = {
  1: NETWORKS.ethereum.rpc,
  42161: NETWORKS.arbitrum.rpc
} as const

// OFT Contract Addresses (LayerZero)
export const OFT_ADDRESSES = {
  1: '0xa2C323fE5A74aDffAd2bf3E007E36bb029606444' as `0x${string}`, // Ethereum
  42161: '0xFaB5891ED867a1195303251912013b92c4fc3a1D' as `0x${string}` // Arbitrum
} as const

