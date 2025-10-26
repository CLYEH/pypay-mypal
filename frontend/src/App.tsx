import { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useReadContracts, useBytecode } from 'wagmi'
import { FactoryABI } from './utils/contracts'
import { FACTORY_ADDRESS, OPERATOR_ADDRESS } from './config/constants'
import BalancePage from './components/BalancePage'
import SendPage from './components/SendPage'
import ReceivePage from './components/ReceivePage'
import DeployPage from './components/DeployPage'
import ApprovePage from './components/ApprovePage'
import './App.css'

type Page = 'balance' | 'send' | 'receive' | 'deploy' | 'approve'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('balance')
  const [showDeployPrompt, setShowDeployPrompt] = useState(false)
  const { isConnected, address } = useAccount()

  // 計算兩個鏈上的合約地址
  const { data: contractAddresses } = useReadContracts({
    contracts: [
      {
        address: FACTORY_ADDRESS,
        abi: FactoryABI,
        functionName: 'computeAddress',
        args: address ? [0n, address as `0x${string}`, OPERATOR_ADDRESS] : undefined,
        chainId: 1, // Ethereum
      },
      {
        address: FACTORY_ADDRESS,
        abi: FactoryABI,
        functionName: 'computeAddress',
        args: address ? [0n, address as `0x${string}`, OPERATOR_ADDRESS] : undefined,
        chainId: 42161, // Arbitrum
      },
    ],
    query: {
      enabled: !!address && isConnected,
    },
  })

  const ethComputedAddress = contractAddresses?.[0]?.result
  const arbComputedAddress = contractAddresses?.[1]?.result

  // 檢查合約是否真的有 code（即是否已部署）
  const { data: ethCode } = useBytecode({
    address: ethComputedAddress as `0x${string}` | undefined,
    chainId: 1,
    query: {
      enabled: !!ethComputedAddress,
    },
  })

  const { data: arbCode } = useBytecode({
    address: arbComputedAddress as `0x${string}` | undefined,
    chainId: 42161,
    query: {
      enabled: !!arbComputedAddress,
    },
  })

  // 檢查是否已部署（有 code 表示已部署）
  const isEthereumDeployed = !!(ethCode && ethCode !== '0x' && ethCode.length > 2)
  const isArbitrumDeployed = !!(arbCode && arbCode !== '0x' && arbCode.length > 2)

  const needsEthereum = !isEthereumDeployed
  const needsArbitrum = !isArbitrumDeployed

  useEffect(() => {
    if (isConnected && address) {
      // 如果有任一鏈未部署，顯示 deploy prompt
      if (needsEthereum || needsArbitrum) {
        setShowDeployPrompt(true)
      } else {
        setShowDeployPrompt(false)
      }
    } else {
      setShowDeployPrompt(false)
    }
  }, [isConnected, address, needsEthereum, needsArbitrum])

  const renderPage = () => {
    switch (currentPage) {
      case 'balance':
        return <BalancePage />
      case 'send':
        return <SendPage />
      case 'receive':
        return <ReceivePage />
      case 'deploy':
        return <DeployPage 
          isEthereumDeployed={isEthereumDeployed} 
          isArbitrumDeployed={isArbitrumDeployed}
          onDeploySuccess={() => {
            // 部署成功後導向 approve 頁面
            setCurrentPage('approve')
          }}
        />
      case 'approve':
        return <ApprovePage 
          isEthereumDeployed={!!isEthereumDeployed}
          isArbitrumDeployed={!!isArbitrumDeployed}
        />
      default:
        return <BalancePage />
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">PyPay</h1>
          <ConnectButton />
        </div>
      </header>

      {isConnected ? (
        <div className="app-content">
          <nav className="navigation">
            <button
              className={`nav-button ${currentPage === 'balance' ? 'active' : ''}`}
              onClick={() => setCurrentPage('balance')}
            >
              Balance
            </button>
            <button
              className={`nav-button ${currentPage === 'send' ? 'active' : ''}`}
              onClick={() => setCurrentPage('send')}
            >
              Send
            </button>
            <button
              className={`nav-button ${currentPage === 'receive' ? 'active' : ''}`}
              onClick={() => setCurrentPage('receive')}
            >
              Receive
            </button>
            <button
              className={`nav-button ${currentPage === 'deploy' ? 'active' : ''}`}
              onClick={() => setCurrentPage('deploy')}
            >
              Deploy
            </button>
            <button
              className={`nav-button ${currentPage === 'approve' ? 'active' : ''}`}
              onClick={() => setCurrentPage('approve')}
            >
              Approve
            </button>
          </nav>

          {showDeployPrompt && (
            <div className="deploy-prompt">
              <div className="deploy-prompt-content">
                <h3>⚠️ Contract Registration Required</h3>
                <p>
                  You need to deploy your PyPay contract on:
                  {needsEthereum && <span style={{color: '#dc3545', fontWeight: 'bold'}}> • Ethereum (Not Deployed)</span>}
                  {!needsEthereum && <span style={{color: '#28a745', fontWeight: 'bold'}}> ✅ Ethereum (Deployed)</span>}
                  <br />
                  {needsArbitrum && <span style={{color: '#dc3545', fontWeight: 'bold'}}> • Arbitrum (Not Deployed)</span>}
                  {!needsArbitrum && <span style={{color: '#28a745', fontWeight: 'bold'}}> ✅ Arbitrum (Deployed)</span>}
                </p>
                <p style={{fontSize: '0.9rem', color: '#666'}}>
                  Click below to deploy your contract on missing networks.
                </p>
                <button 
                  className="deploy-prompt-button"
                  onClick={() => setCurrentPage('deploy')}
                >
                  Deploy Contract Now
                </button>
              </div>
            </div>
          )}

          <main className="main-content">
            {renderPage()}
          </main>
        </div>
      ) : (
        <div className="welcome-section">
          <div className="welcome-card">
            <h2>Welcome to PyPay</h2>
            <p>Please connect your wallet to get started</p>
            <div className="features">
              <div className="feature">
                <span className="feature-icon">•</span>
                <span>View PYUSD Balance</span>
              </div>
              <div className="feature">
                <span className="feature-icon">•</span>
                <span>Send PYUSD</span>
              </div>
              <div className="feature">
                <span className="feature-icon">•</span>
                <span>Receive PYUSD</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App