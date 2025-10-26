import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, arbitrum } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@rainbow-me/rainbowkit/styles.css'
import './index.css'
import App from './App.tsx'

// 使用標準公開 RPC，避免使用 demo key 導致問題
const config = getDefaultConfig({
  appName: 'PyPay',
  projectId: 'f8e8c7c5b3a9d1e2f4a6b8c9d0e1f2a3', // WalletConnect Project ID
  chains: [mainnet, arbitrum], // 使用標準鏈配置，讓 wagmi 自動選擇最佳 RPC
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