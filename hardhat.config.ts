import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-ignition";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import 'dotenv/config';

const { 
  PRIVATE_KEY, 
  ETHERSCAN_API_KEY, 
  BASESCAN_API_KEY, 
  LINEASCAN_API_KEY,
  ALCHEMY_API_KEY_ETHEREUM,
  ALCHEMY_API_KEY_ARBITRUM,
  ALCHEMY_API_KEY_POLYGON,
  ALCHEMY_API_KEY_AVALANCHE,
  ALCHEMY_API_KEY_ETH_SEPOLIA,
  ALCHEMY_API_KEY_AVALANCHE_FUJI,
  ALCHEMY_API_KEY_POLYGON_AMOY,
  ALCHEMY_API_KEY_ARBITRUM_SEPOLIA
} = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  plugins: [
    hardhatVerify,
  ],
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },

  networks:{
    zircuit: {
      type: "http",
      chainType: "l1",
      url: `https://mainnet.zircuit.com`,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    ethereum: {
      type: "http",
      chainType: "l1",
      url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY_ETHEREUM}`,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    base: {
      type: "http",
      chainType: "generic",
      url: `https://mainnet.base.org`,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    avalanche: {
      type: "http",
      chainType: "l1",
      url:`https://api.avax.network/ext/bc/C/rpc`,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    linea: {
      type: "http",
      chainType: "generic",
      url:`https://rpc.linea.build`,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    polygon: {
      type: "http",
      chainType: "generic",
      url:`https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY_POLYGON}`,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    eth_sepolia: {
      type: "http",
      chainType: "l1",
      url:`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY_ETH_SEPOLIA}`,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    base_sepolia: {
      type: "http",
      chainType: "generic",
      url:`https://sepolia.base.org`,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    linea_sepolia: {
      type: "http",
      chainType: "generic",
      url:`https://rpc.sepolia.linea.build`,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    avalanche_fuji: {
      type: "http",
      chainType: "l1",
      url:`https://avax-fuji.g.alchemy.com/v2/${ALCHEMY_API_KEY_AVALANCHE_FUJI}`,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    polygon_amoy: {
      type: "http",
      chainType: "generic",
      url:`https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY_POLYGON_AMOY}`,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    arbitrum: {
      type: "http",
      chainType: "generic",
      url: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY_ARBITRUM}`,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    arbitrum_sepolia: {
      type: "http",
      chainType: "generic",
      url: `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY_ARBITRUM_SEPOLIA}`,
      accounts: [`0x${PRIVATE_KEY}`]
    },
  },

  sourcify: {
    enabled: true,
    apiUrl: 'https://sourcify.dev/server',
    browserUrl: 'https://repo.sourcify.dev',
  },

  etherscan: {
    apiKey: {
      ethereum:[ETHERSCAN_API_KEY],
      base: [BASESCAN_API_KEY],
      snowtrace: "snowtrace",
      fuji: "snowtrace",
      linea: [LINEASCAN_API_KEY],
      linea_sepolia: [LINEASCAN_API_KEY],
      sepolia: [ETHERSCAN_API_KEY],
      base_sepolia: [BASESCAN_API_KEY],
      arbitrum: [ETHERSCAN_API_KEY],
      arbitrum_sepolia: [ETHERSCAN_API_KEY],
    },
    customChains: [
      {
        network: "snowtrace",
        chainId: 43114,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan",
          browserURL: "https://avalanche.routescan.io"
        }
      },
      {
        network: "base_sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      },
      {
        network: "fuji",
        chainId: 43113,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/testnet/evm/43113/etherscan",
          browserURL: "https://testnet.snowtrace.io/"
        }
      },
      {
        network: "linea",
        chainId: 59144,
        urls: {
          apiURL: "https://api.lineascan.build/api",
          browserURL: "https://lineascan.build/"
        }
      },
      {
        network: "linea_sepolia",
        chainId: 59141,
        urls: {
          apiURL: "https://api-sepolia.lineascan.build/api",
          browserURL: "https://sepolia.lineascan.build/"
        }
      },
      {
        network: "arbitrum",
        chainId: 42161,
        urls: {
          apiURL: "https://api.arbiscan.io/api",
          browserURL: "https://arbiscan.io/"
        }
      },
      {
        network: "arbitrum_sepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io/"
        }
      },
    ]
  },

  verify: {
    etherscan: {
      apiKey: ETHERSCAN_API_KEY,
    },
  },

  // 添加 chainDescriptors 來支援多個網路
  chainDescriptors: {
    1: {
      name: "Ethereum Mainnet",
      blockExplorers: {
        etherscan: {
          name: "Etherscan",
          url: "https://etherscan.io",
          apiUrl: "https://api.etherscan.io/v2/api",
        },
      },
    },
    42161: {
      name: "Arbitrum One",
      blockExplorers: {
        etherscan: {
          name: "Arbiscan",
          url: "https://arbiscan.io",
          apiUrl: "https://api.arbiscan.io/v2/api",
        },
      },
    },
  },
};