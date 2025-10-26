import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useBalance } from 'wagmi'
import { ethers } from 'ethers'
import { FactoryABI } from '../utils/contracts'
import Notification from './Notification'
import { PYUSD_ADDRESSES, FACTORY_ADDRESS, OPERATOR_ADDRESS, BACKEND_URL, NETWORKS } from '../config/constants'

interface NotificationState {
  message: string
  type: 'success' | 'error' | 'info'
}

function SendPage() {
  const { address } = useAccount()
  const [sendMethod, setSendMethod] = useState<'address' | 'qr'>('address')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'arbitrum'>('ethereum')
  const [isSending, setIsSending] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [notification, setNotification] = useState<NotificationState | null>(null)

  // 獲取所有鏈上的 PYUSD 餘額
  const { data: ethBalance, isLoading: isEthLoading, refetch: refetchEthBalance } = useBalance({
    address,
    token: PYUSD_ADDRESSES[1],
    chainId: 1,
    query: {
      enabled: !!address,
    },
  })

  const { data: arbBalance, isLoading: isArbLoading, refetch: refetchArbBalance } = useBalance({
    address,
    token: PYUSD_ADDRESSES[42161],
    chainId: 42161,
    query: {
      enabled: !!address,
    },
  })

  // 計算總餘額
  const totalBalance = () => {
    if (!ethBalance && !arbBalance) return null
    const eth = ethBalance ? parseFloat(ethBalance.formatted) : 0
    const arb = arbBalance ? parseFloat(arbBalance.formatted) : 0
    return eth + arb
  }

  const isLoading = isEthLoading || isArbLoading

  // 處理 MAX 按鈕點擊
  const handleMax = () => {
    if (totalBalance() !== null) {
      setAmount(totalBalance()!.toString())
    }
  }

  // 獲取用戶的合約地址
  const getContractAddress = async (userAddress: string, targetChainId: number) => {
    const rpcUrl = targetChainId === 1 ? NETWORKS.ethereum.rpc : NETWORKS.arbitrum.rpc
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const factory = new ethers.Contract(FACTORY_ADDRESS, FactoryABI, provider)
    return await factory.computeAddress(0n, userAddress, OPERATOR_ADDRESS)
  }

  // 創建簽名
  const createSignature = async (
    sourceChainIds: bigint[],
    amountEach: bigint[],
    nonces: bigint[],
    expiry: bigint,
    destinationChainId: bigint,
    targetAddress: string,
    provider: ethers.BrowserProvider | ethers.JsonRpcProvider
  ) => {
    try {
      // ABI encode
      const abiCoder = ethers.AbiCoder.defaultAbiCoder()
      const types = ['uint256[]', 'uint256[]', 'uint256[]', 'uint256', 'uint256', 'address']
      const values = [sourceChainIds, amountEach, nonces, expiry, destinationChainId, targetAddress]
      
      const encoded = abiCoder.encode(types, values)
      const messageHash = ethers.keccak256(encoded)
      
      console.log('Requesting wallet signature for message hash:', messageHash)
      
      // Get signer and sign - THIS WILL TRIGGER WALLET POPUP
      const signer = await provider.getSigner()
      const signature = await signer.signMessage(ethers.getBytes(messageHash))
      
      console.log('Signature obtained:', signature)
      
      return signature
    } catch (error) {
      console.error('Signature error:', error)
      throw new Error(`Failed to get signature: ${error}`)
    }
  }

  const handleSend = async () => {
    if (!recipientAddress || !amount) {
      setNotification({ message: 'Please fill in complete information', type: 'error' })
      return
    }
    
    if (!address) {
      setNotification({ message: 'Please connect your wallet', type: 'error' })
      return
    }
    
    setIsSending(true)
    setStatusMessage('Checking balance...')
    
    try {
      const amountNum = parseFloat(amount)
      const totalBal = totalBalance()
      
      // Check total balance
      if (!totalBal || amountNum > totalBal) {
        setNotification({ message: 'Insufficient total balance', type: 'error' })
        setIsSending(false)
        setStatusMessage('')
        return
      }
      
      // Get target chain ID
      const targetChainId = selectedChain === 'ethereum' ? 1 : 42161
      const targetBalance = selectedChain === 'ethereum' ? 
        (ethBalance ? parseFloat(ethBalance.formatted) : 0) : 
        (arbBalance ? parseFloat(arbBalance.formatted) : 0)
      
      // Get provider early for signature creation
      // @ts-ignore
      const provider = new ethers.BrowserProvider(window.ethereum)
      
      // Check balance on target chain
      let sourceChainIds: bigint[]
      let amountEach: bigint[]
      let nonces: bigint[]
      
      if (amountNum > targetBalance) {
        // Need to transfer from multiple chains
        const otherChainId = targetChainId === 1 ? 42161 : 1
        const otherChainBalance = targetChainId === 1 ? 
          (arbBalance ? parseFloat(arbBalance.formatted) : 0) : 
          (ethBalance ? parseFloat(ethBalance.formatted) : 0)
        
        const neededFromOtherChain = amountNum - targetBalance
        
        // Check if other chain has enough
        if (otherChainBalance < neededFromOtherChain) {
          setNotification({ message: 'Insufficient total balance across all chains', type: 'error' })
          setIsSending(false)
          setStatusMessage('')
          return
        }
        
        setStatusMessage('Preparing multi-chain transfer...')
        
        // Use multi-chain transfer: [target chain, other chain]
        sourceChainIds = [BigInt(targetChainId), BigInt(otherChainId)]
        const amountFromTarget = ethers.parseUnits(targetBalance.toFixed(6), 6)
        const amountFromOther = ethers.parseUnits(neededFromOtherChain.toFixed(6), 6)
        amountEach = [amountFromTarget, amountFromOther]
        
        // Generate nonces for both chains
        const timestamp = BigInt(Math.floor(Date.now() / 1000))
        const nonce1 = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ['uint256', 'uint256'],
            [timestamp, amountFromTarget]
          )
        )
        const nonce2 = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ['uint256', 'uint256'],
            [timestamp, amountFromOther]
          )
        )
        nonces = [BigInt(nonce1), BigInt(nonce2)]
        
      } else {
        // Single chain transfer - enough balance on target chain
        sourceChainIds = [BigInt(targetChainId)]
        amountEach = [ethers.parseUnits(amount, 6)] // PYUSD has 6 decimals
        
        // Generate nonce
        const timestamp = BigInt(Math.floor(Date.now() / 1000))
        const nonceHash = ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ['uint256', 'uint256'],
            [timestamp, amountEach[0]]
          )
        )
        nonces = [BigInt(nonceHash)]
      }
      
      const expiry = BigInt(Math.floor(Date.now() / 1000) + 5 * 60) // 5 minutes from now
      const destinationChainId = BigInt(targetChainId)
      const targetAddress = recipientAddress as `0x${string}`
      
      // If multi-chain, need two different signatures:
      // 1. For cross-chain transfer: target is self (address)
      // 2. For final transfer: target is recipient (targetAddress)
      if (sourceChainIds.length > 1) {
        const otherChainId = Number(sourceChainIds[1])
        const targetChainIdNum = Number(sourceChainIds[0])
        
        const txHashes = []
        
        // Step 1: Cross-chain transfer signature (to self)
        setStatusMessage('Requesting signature for cross-chain transfer...')
        
        const crossChainSignature = await createSignature(
          [BigInt(otherChainId)],
          [amountEach[1]],
          [nonces[1]],
          expiry,
          BigInt(targetChainIdNum),
          address, // Transfer to self
          provider
        )
        
        // Step 2: Call CrossChainTransfer
        setStatusMessage(`Starting cross-chain transfer from ${otherChainId === 42161 ? 'Arbitrum' : 'Ethereum'} to ${targetChainIdNum === 1 ? 'Ethereum' : 'Arbitrum'}...`)
        
        const contractAddressOther = await getContractAddress(address, otherChainId)
        
        // Estimate native fee
        const estimatedFee = targetChainIdNum === 42161 ? '5000000000000000' : '3000000000000000'
        
        // Call cross-chain transfer for the "other" chain
        const crossChainResponse = await fetch(`${BACKEND_URL}/cross-chain-transfer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contract_address: contractAddressOther,
            source_chain_ids: [otherChainId.toString()],
            amount_each: [amountEach[1].toString()],
            nonces: [nonces[1].toString()],
            expiry: expiry.toString(),
            destination_chain_id: targetChainIdNum.toString(),
            target_address: address, // Transfer to self first
            signature: crossChainSignature,
            native_fee: estimatedFee
          }),
        })
        
        const crossChainData = await crossChainResponse.json()
        
        if (!crossChainData.success) {
          setNotification({ message: `Cross-chain transfer failed: ${crossChainData.error}`, type: 'error' })
          setIsSending(false)
          setStatusMessage('')
          return
        }
        
        txHashes.push(crossChainData.tx_hash)
        
        setStatusMessage('Waiting for cross-chain transfer to complete...')
        
        // Wait for cross-chain transfer
        let retries = 20
        let confirmed = false
        
        while (retries > 0 && !confirmed) {
          await new Promise(resolve => setTimeout(resolve, 3000))
          
          const checkResponse = await fetch(`${BACKEND_URL}/check-cross-chain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              target_address: address,
              amount_expected: amountEach[1].toString(),
              destination_chain_id: targetChainIdNum,
            }),
          })
          
          const checkData = await checkResponse.json()
          if (checkData.success && checkData.result.received) {
            confirmed = true
          }
          retries--
        }
        
        if (!confirmed) {
          setNotification({ message: 'Cross-chain transfer timeout', type: 'error' })
          setIsSending(false)
          setStatusMessage('')
          return
        }
        
        // Step 2: Final transfer signature and execution on target chain
        setStatusMessage('Requesting signature for final transfer...')
        
        const finalSignature = await createSignature(
          sourceChainIds,
          amountEach,
          nonces,
          expiry,
          destinationChainId,
          targetAddress, // Final target
          provider
        )
        
        setStatusMessage('Sending final transfer on target chain...')
        
        const contractAddressTarget = await getContractAddress(address, targetChainIdNum)
        
        const finalResponse = await fetch(`${BACKEND_URL}/transfer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contract_address: contractAddressTarget,
            source_chain_ids: sourceChainIds.map(id => id.toString()),
            amount_each: amountEach.map(amt => amt.toString()),
            nonces: nonces.map(n => n.toString()),
            expiry: expiry.toString(),
            destination_chain_id: destinationChainId.toString(),
            target_address: targetAddress,
            signature: finalSignature,
          }),
        })
        
        const finalData = await finalResponse.json()
        
        if (!finalData.success) {
          setNotification({ message: `Final transfer failed: ${finalData.error}`, type: 'error' })
          setIsSending(false)
          setStatusMessage('')
          return
        }
        
        txHashes.push(finalData.tx_hash)
        
        setNotification({ 
          message: `Transactions sent successfully! Hashes: ${txHashes.join(', ')}`, 
          type: 'success' 
        })
      } else {
        // Single chain transfer - create signature
        setStatusMessage('Requesting wallet signature...')
        
        const signature = await createSignature(
          sourceChainIds,
          amountEach,
          nonces,
          expiry,
          destinationChainId,
          targetAddress,
          provider
        )
        
        setStatusMessage('Getting contract address...')
        const contractAddress = await getContractAddress(address, targetChainId)
        
        setStatusMessage('Sending transaction...')
        
        const response = await fetch(`${BACKEND_URL}/transfer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contract_address: contractAddress,
            source_chain_ids: sourceChainIds.map(id => id.toString()),
            amount_each: amountEach.map(amt => amt.toString()),
            nonces: nonces.map(n => n.toString()),
            expiry: expiry.toString(),
            destination_chain_id: destinationChainId.toString(),
            target_address: targetAddress,
            signature: signature,
          }),
        })
        
        const data = await response.json()
        
        if (data.success) {
          setNotification({ 
            message: `Transaction sent successfully! Hash: ${data.tx_hash}`, 
            type: 'success' 
          })
        } else {
          setNotification({ 
            message: `Error: ${data.error}`, 
            type: 'error' 
          })
        }
      }
      
      setRecipientAddress('')
      setAmount('')
      setStatusMessage('')
      
      // Refresh balances
      setTimeout(() => {
        refetchEthBalance()
        refetchArbBalance()
      }, 3000)
      
      return
    } catch (error) {
      console.error('Error sending transaction:', error)
      setNotification({ 
        message: `Error: ${error}`, 
        type: 'error' 
      })
      setStatusMessage('')
    } finally {
      setIsSending(false)
    }
  }

  const handleQRScan = () => {
    // Here will implement QR scanning functionality
    setNotification({ message: 'QR scanning functionality will be implemented later', type: 'info' })
  }

  return (
    <div className="send-page">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="send-card">
        <h2>Send PYUSD</h2>

        <div className="send-methods">
          <button
            className={`method-button ${sendMethod === 'address' ? 'active' : ''}`}
            onClick={() => setSendMethod('address')}
          >
            Enter Address
          </button>
          <button
            className={`method-button ${sendMethod === 'qr' ? 'active' : ''}`}
            onClick={() => setSendMethod('qr')}
          >
            Scan QR Code
          </button>
        </div>

        {sendMethod === 'address' ? (
          <div className="address-form">
            <div className="form-group">
              <label>Recipient Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="address-input"
              />
            </div>

            <div className="form-group">
              <label>Amount</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="amount-input"
                />
                <button
                  onClick={handleMax}
                  disabled={!address || isLoading || totalBalance() === null}
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: address && !isLoading && totalBalance() !== null ? 'pointer' : 'not-allowed',
                    opacity: address && !isLoading && totalBalance() !== null ? 1 : 0.5,
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                  }}
                >
                  MAX
                </button>
                <span className="currency">PYUSD</span>
              </div>
              {address && (
                <div className="balance-display" style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                  {isLoading ? (
                    'Loading balance...'
                  ) : totalBalance() !== null ? (
                    <>Total Available: {totalBalance()!.toFixed(6)} PYUSD</>
                  ) : (
                    'Unable to fetch balance'
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Select Network</label>
              <div className="chain-selector">
                <button
                  className={`chain-button ${selectedChain === 'ethereum' ? 'active' : ''}`}
                  onClick={() => setSelectedChain('ethereum')}
                >
                  Ethereum
                </button>
                <button
                  className={`chain-button ${selectedChain === 'arbitrum' ? 'active' : ''}`}
                  onClick={() => setSelectedChain('arbitrum')}
                >
                  Arbitrum
                </button>
              </div>
            </div>

            <button 
              className="send-button" 
              onClick={handleSend}
              disabled={isSending}
            >
              {isSending ? statusMessage || 'Sending...' : 'Send PYUSD'}
            </button>
            {statusMessage && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f0f0f0', borderRadius: '8px', fontSize: '0.9rem' }}>
                {statusMessage}
              </div>
            )}
          </div>
        ) : (
          <div className="qr-scan">
            <div className="qr-scanner-placeholder">
              <div className="qr-icon">QR</div>
              <p>QR Scanner</p>
              <p className="qr-hint">Point camera at QR code</p>
            </div>
            <button className="scan-button" onClick={handleQRScan}>
              Start Scanning
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default SendPage
