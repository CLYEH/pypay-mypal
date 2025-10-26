import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, arbitrum } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@rainbow-me/rainbowkit/styles.css'
import './index.css'
import App from './App.tsx'

// 配置自定義 RPC - 可以使用 Alchemy
const ALCHEMY_KEY_ETH = import.meta.env.VITE_ALCHEMY_API_KEY_ETHEREUM
const ALCHEMY_KEY_ARB = import.meta.env.VITE_ALCHEMY_API_KEY_ARBITRUM

// 配置以太坊鏈
const ethereumConfig = ALCHEMY_KEY_ETH ? {
  ...mainnet,
  rpcUrls: {
    default: {
      http: [`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY_ETH}`]
    }
  }
} : mainnet

// 配置 Arbitrum 鏈
const arbitrumConfig = ALCHEMY_KEY_ARB ? {
  ...arbitrum,
  rpcUrls: {
    default: {
      http: [`https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY_ARB}`]
    }
  }
} : arbitrum

const config = getDefaultConfig({
  appName: 'PyPay',
  projectId: 'f8e8c7c5b3a9d1e2f4a6b8c9d0e1f2a3', // WalletConnect Project ID
  chains: [ethereumConfig, arbitrumConfig],
  ssr: false,
})

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)