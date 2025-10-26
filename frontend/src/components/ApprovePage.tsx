import { useState, useEffect } from 'react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useComputePyPayAddress } from '../hooks/useFactoryContract'

// ERC20 ABI (僅需 approve 函數)
const ERC20_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

// PYUSD Token 地址
const PYUSD_ADDRESSES = {
  1: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8' as `0x${string}`, // Ethereum
  42161: '0x46850aD61C2B7d64d08c9C754F45254596696984' as `0x${string}` // Arbitrum
}

interface ApprovePageProps {
  isEthereumDeployed: boolean
  isArbitrumDeployed: boolean
}

function ApprovePage({ isEthereumDeployed, isArbitrumDeployed }: ApprovePageProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  
  // 計算兩個鏈上的 PyPay 合約地址
  const { data: ethComputedAddress } = useComputePyPayAddress(address, 1)
  const { data: arbComputedAddress } = useComputePyPayAddress(address, 42161)
  
  // 自動選擇第一個已部署的鏈
  const getInitialChain = () => {
    if (isEthereumDeployed) return 'ethereum'
    if (isArbitrumDeployed) return 'arbitrum'
    return 'ethereum' // 預設
  }
  
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'arbitrum'>(getInitialChain())
  
  // 當部署狀態改變時，自動選擇已部署的鏈
  useEffect(() => {
    if (isEthereumDeployed && selectedChain !== 'ethereum') {
      setSelectedChain('ethereum')
    } else if (isArbitrumDeployed && !isEthereumDeployed && selectedChain !== 'arbitrum') {
      setSelectedChain('arbitrum')
    }
  }, [isEthereumDeployed, isArbitrumDeployed])
  
  const targetChainId = selectedChain === 'ethereum' ? 1 : 42161
  const deployedAddress = selectedChain === 'ethereum' ? ethComputedAddress : arbComputedAddress
  const pyusdAddress = PYUSD_ADDRESSES[targetChainId as keyof typeof PYUSD_ADDRESSES]

  // 檢查當前的 allowance
  const { data: currentAllowance } = useReadContract({
    address: pyusdAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && deployedAddress ? [address as `0x${string}`, deployedAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!address && !!deployedAddress,
    },
  })

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const handleApprove = () => {
    if (!address || !deployedAddress || !pyusdAddress) return
    
    // 清除之前的錯誤狀態，允許重新嘗試
    if (error) {
      setErrorCleared(true)
      // 重置 pending 狀態，以便重新嘗試
      setPendingApproval(false)
      setIsSwitchingChain(false)
    }
    
    // 檢查用戶連接的網路是否正確，如果不對則自動切換
    if (chainId !== targetChainId) {
      // 自動切換網路並設置 pending 狀態
      if (switchChain && targetChainId) {
        try {
          setIsSwitchingChain(true)
          setPendingApproval(true)
          switchChain({ chainId: targetChainId })
        } catch (error) {
          console.error('Failed to switch chain:', error)
          setIsSwitchingChain(false)
          setPendingApproval(false)
        }
      }
      return
    }

    // 網絡正確，直接執行批准
    const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
    
    try {
      writeContract({
        address: pyusdAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [deployedAddress as `0x${string}`, maxUint256],
      })
    } catch (error: any) {
      console.error('Failed to write contract:', error)
      // 如果是使用者取消，重置狀態
      if (error?.code === 4001 || error?.message?.includes('User rejected')) {
        setPendingApproval(false)
        setIsSwitchingChain(false)
      }
    }
  }

  // 檢查是否已經有足夠的 allowance
  const hasApproval = currentAllowance && currentAllowance > BigInt(0)

  const [isSwitchingChain, setIsSwitchingChain] = useState(false)
  const [pendingApproval, setPendingApproval] = useState(false)
  const [errorCleared, setErrorCleared] = useState(false)

  useEffect(() => {
    if (isSuccess) {
      console.log('Approval successful!')
      setPendingApproval(false)
      setIsSwitchingChain(false)
    }
  }, [isSuccess])

  // 監聽網路切換完成後自動執行 approve
  useEffect(() => {
    // 如果用戶手動點擊後清除了錯誤，允許自動執行
    // 但如果是自動觸發且有錯誤，則不執行
    const shouldBlockAutoExecution = error && !errorCleared
    
    if (shouldBlockAutoExecution) {
      return
    }
    
    // 只有在狀態正確時才自動執行
    if (pendingApproval && chainId === targetChainId && !isPending && !isConfirming) {
      // 網路已切換，執行批准
      const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
      if (address && deployedAddress && pyusdAddress) {
        try {
          writeContract({
            address: pyusdAddress,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [deployedAddress as `0x${string}`, maxUint256],
          })
        } catch (error: any) {
          console.error('Failed to write contract:', error)
          setPendingApproval(false)
          setIsSwitchingChain(false)
          // 如果是使用者取消，不要顯示錯誤訊息
          if (error?.code === 4001 || error?.message?.includes('User rejected')) {
            console.log('User rejected the transaction')
          }
        }
      }
    }
  }, [chainId, targetChainId, pendingApproval, isPending, isConfirming, error, errorCleared, address, deployedAddress, pyusdAddress, writeContract])

  // 處理錯誤，特別是使用者取消交易
  useEffect(() => {
    if (error) {
      const errorMessage = error.message || error.toString()
      console.error('Transaction error:', error)
      
      // 檢查是否為使用者取消交易
      if (
        errorMessage.includes('User rejected') ||
        errorMessage.includes('user rejected') ||
        errorMessage.includes('User denied') ||
        errorMessage.includes('user denied') ||
        error.code === 4001
      ) {
        console.log('User cancelled the transaction')
      }
      
      // 重置所有狀態
      setPendingApproval(false)
      setIsSwitchingChain(false)
      // 當有新的錯誤時，重置 errorCleared 狀態
      setErrorCleared(false)
    }
  }, [error])

  // 當 pending 或 confirming 狀態改變時，重置 errorCleared（允許再次嘗試）
  useEffect(() => {
    if (isPending || isConfirming) {
      setErrorCleared(false)
    }
  }, [isPending, isConfirming])

  // 如果兩條鏈都未部署，顯示提示訊息
  if (!isEthereumDeployed && !isArbitrumDeployed) {
    return (
      <div className="approve-page">
        <div className="approve-card">
          <h2>Approve PYUSD</h2>
          <div className="approve-status" style={{ background: '#fff3cd', color: '#856404', marginTop: '1rem' }}>
            <p style={{ fontWeight: 'bold' }}>
              No contracts deployed yet
            </p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Please deploy your PyPay contract on Ethereum or Arbitrum first before approving PYUSD.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="approve-page">
      <div className="approve-card">
        <h2>Approve PYUSD</h2>
        <p className="approve-description">
          You need to approve PYUSD tokens for your PyPay contract to use them
        </p>

        <div className="chain-selector">
          <h3>Select Network</h3>
          <div className="chain-buttons">
            {isEthereumDeployed ? (
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
                Ethereum (Not Deployed)
              </button>
            )}
            {isArbitrumDeployed ? (
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
                Arbitrum (Not Deployed)
              </button>
            )}
          </div>
        </div>

        <div className="chain-info-display">
          <div className="info-item">
            <span className="info-label">Network:</span>
            <span className="info-value">{selectedChain === 'ethereum' ? 'Ethereum' : 'Arbitrum'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Your PyPay Contract:</span>
            <span className="info-value">{deployedAddress || 'Computing...'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">PYUSD Token:</span>
            <span className="info-value">{pyusdAddress}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Approval Amount:</span>
            <span className="info-value">Unlimited (Max)</span>
          </div>
        </div>

        {hasApproval && (
          <div className="approve-status">
            <p style={{ color: '#28a745', fontWeight: 'bold' }}>
              You already have approval set for this contract
            </p>
            {currentAllowance && (
              <p style={{ fontSize: '0.9rem', color: '#666' }}>
                Current allowance: {currentAllowance.toString()}
              </p>
            )}
          </div>
        )}

        {/* 顯示網路檢查警告 */}
        {chainId !== targetChainId && (
          <div className="approve-status" style={{ background: '#fff3cd', color: '#856404' }}>
            <p style={{ fontWeight: 'bold' }}>
              Network Mismatch!
            </p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              You are connected to Chain ID: {chainId} ({chainId === 1 ? 'Ethereum' : chainId === 42161 ? 'Arbitrum' : 'Unknown'})
              <br />
              Clicking the button will automatically switch to Chain ID: {targetChainId} ({targetChainId === 1 ? 'Ethereum' : 'Arbitrum'}).
            </p>
          </div>
        )}

        {error && !errorCleared && (() => {
          const errorMessage = error.message || error.toString()
          const isUserCancelled = 
            errorMessage.includes('User rejected') ||
            errorMessage.includes('user rejected') ||
            errorMessage.includes('User denied') ||
            errorMessage.includes('user denied') ||
            error.code === 4001
          
          return (
            <div className="approve-status" style={{ 
              background: isUserCancelled ? '#fff3cd' : '#f8d7da', 
              color: isUserCancelled ? '#856404' : '#721c24' 
            }}>
              {isUserCancelled ? (
                <p style={{ fontWeight: 'bold' }}>Transaction cancelled by user</p>
              ) : (
                <p>Error: {errorMessage}</p>
              )}
            </div>
          )
        })()}

        {isPending && (
          <div className="approve-status" style={{ background: '#d1ecf1', color: '#0c5460' }}>
            Initializing approval...
          </div>
        )}

        {isConfirming && (
          <div className="approve-status" style={{ background: '#d1ecf1', color: '#0c5460' }}>
            Waiting for transaction confirmation...
          </div>
        )}

        {isSuccess && (
          <div className="approve-status" style={{ background: '#d4edda', color: '#155724' }}>
            Approval successful! Hash: {hash}
          </div>
        )}

        <button 
          className="approve-button" 
          onClick={handleApprove}
          disabled={!address || isPending || isConfirming || hasApproval || isSwitchingChain}
        >
          {isSwitchingChain
            ? 'Switching Network...'
            : chainId !== targetChainId
            ? 'Switch Network to Approve'
            : isPending || isConfirming 
            ? 'Approving...' 
            : hasApproval 
            ? 'Already Approved' 
            : 'Approve Unlimited PYUSD'
          }
        </button>

        <div className="approve-instructions">
          <h3>Why Approve?</h3>
          <ul>
            <li>This allows your PyPay contract to transfer PYUSD on your behalf</li>
            <li>The approval amount is unlimited for convenience</li>
            <li>You can revoke this approval anytime</li>
            <li>This is a standard ERC20 operation and completely safe</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ApprovePage

