import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useComputePyPayAddress, useDeployPyPayContract } from '../hooks/useFactoryContract'

interface DeployPageProps {
  isEthereumDeployed: boolean
  isArbitrumDeployed: boolean
  onDeploySuccess?: (deployedAddress: string, chain: 'ethereum' | 'arbitrum') => void
}

function DeployPage({ isEthereumDeployed, isArbitrumDeployed, onDeploySuccess }: DeployPageProps) {
  const { address } = useAccount()
  
  // 自動選擇第一個未部署的鏈
  const getInitialChain = () => {
    if (!isEthereumDeployed) return 'ethereum'
    if (!isArbitrumDeployed) return 'arbitrum'
    return 'ethereum' // 預設
  }
  
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'arbitrum'>(getInitialChain())
  
  // 計算 PyPay 合約地址
  const targetChainId = selectedChain === 'ethereum' ? 1 : 42161
  const { data: computedAddress, isLoading: isComputing } = useComputePyPayAddress(address, targetChainId)
  
  // 部署合約
  const { deploy, hash, isPending, isConfirming, isSuccess, error } = useDeployPyPayContract(address, targetChainId)

  useEffect(() => {
    // 當部署成功時，保存信息
    if (isSuccess && computedAddress) {
      console.log('Contract deployed successfully at:', computedAddress)
      
      // 保存部署信息到 localStorage
      const deployInfo = {
        deployedAddress: computedAddress,
        selectedChain: selectedChain
      }
      localStorage.setItem('pypay_deploy_info', JSON.stringify(deployInfo))
    }
  }, [isSuccess, computedAddress, selectedChain])

  return (
    <div className="deploy-page">
      <div className="deploy-card">
        <h2>Deploy PyPay Contract</h2>
        <p className="deploy-description">
          Deploy your PyPay contract to start using the platform
        </p>

        <div className="chain-selector">
          <h3>Select Network</h3>
          <div className="chain-buttons">
            {!isEthereumDeployed ? (
              <button
                className={`chain-button ${selectedChain === 'ethereum' ? 'active' : ''}`}
                onClick={() => setSelectedChain('ethereum')}
              >
                Ethereum
              </button>
            ) : (
              <button
                className="chain-button"
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              >
                Ethereum (Deployed)
              </button>
            )}
            {!isArbitrumDeployed ? (
              <button
                className={`chain-button ${selectedChain === 'arbitrum' ? 'active' : ''}`}
                onClick={() => setSelectedChain('arbitrum')}
              >
                Arbitrum
              </button>
            ) : (
              <button
                className="chain-button"
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              >
                Arbitrum (Deployed)
              </button>
            )}
          </div>
        </div>

        <div className="deploy-info">
          <div className="info-item">
            <span className="info-label">Factory Contract:</span>
            <span className="info-value">0x49aa018dC29772561795E13a09aCA3DaAF4777Be</span>
          </div>
          <div className="info-item">
            <span className="info-label">Operator:</span>
            <span className="info-value">0x3d94E55a2C3Cf83226b3D056eBeBb43b4731417f</span>
          </div>
          <div className="info-item">
            <span className="info-label">Your Address:</span>
            <span className="info-value">{address || 'Not connected'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">PyPay Contract Address:</span>
            <span className="info-value">
              {isComputing ? 'Computing...' : computedAddress || 'Not calculated'}
            </span>
          </div>
        </div>

        {error && (
          <div className="deploy-status" style={{ background: '#f8d7da', color: '#721c24' }}>
            Error: {error.message}
          </div>
        )}

        {isPending && (
          <div className="deploy-status deploying">
            Initializing deployment...
          </div>
        )}

        {isConfirming && (
          <div className="deploy-status deploying">
            Waiting for transaction confirmation...
          </div>
        )}

        {isSuccess && (
          <div className="deploy-status success">
            <div style={{ marginBottom: '1rem' }}>
              Contract deployed successfully!
            </div>
            <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
              Transaction Hash: {hash}
            </div>
            <button 
              className="deploy-button"
              onClick={onDeploySuccess ? () => onDeploySuccess(computedAddress || '', selectedChain) : undefined}
              style={{ marginTop: '1rem', width: '100%' }}
            >
              Continue to Approve PYUSD →
            </button>
          </div>
        )}

        {/* 只有在至少有一條鏈未部署時才顯示 Deploy 按鈕 */}
        {(!isEthereumDeployed || !isArbitrumDeployed) && (
          <button 
            className="deploy-button" 
            onClick={deploy}
            disabled={!address || isPending || isConfirming || (isEthereumDeployed && isArbitrumDeployed)}
          >
            {isPending || isConfirming ? 'Deploying...' : 'Deploy Contract'}
          </button>
        )}

        {/* 如果兩條鏈都已經部署了，顯示完成信息 */}
        {isEthereumDeployed && isArbitrumDeployed && (
          <div className="deploy-status success" style={{ marginTop: '2rem' }}>
            <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              All contracts deployed successfully!
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              Your PyPay contract is now active on both Ethereum and Arbitrum networks.
            </div>
          </div>
        )}

        <div className="deploy-instructions">
          <h3>Deploy Instructions</h3>
          <ul>
            <li>Make sure you have sufficient gas for the deployment</li>
            <li>The deployment will create your PyPay contract address</li>
            <li>You need to deploy on both Ethereum and Arbitrum</li>
            <li>Transaction cannot be reversed after deployment</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default DeployPage

