import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useBalance } from 'wagmi'

// PYUSD Token 地址
const PYUSD_ADDRESSES = {
  1: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8' as `0x${string}`, // Ethereum
  42161: '0x46850aD61C2B7d64d08c9C754F45254596696984' as `0x${string}` // Arbitrum
}

function SendPage() {
  const { address } = useAccount()
  const [sendMethod, setSendMethod] = useState<'address' | 'qr'>('address')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'arbitrum'>('ethereum')

  // const targetChainId = selectedChain === 'ethereum' ? 1 : 42161 // 用於實際發送時確定目標鏈

  // 獲取所有鏈上的 PYUSD 餘額
  const { data: ethBalance, isLoading: isEthLoading } = useBalance({
    address,
    token: PYUSD_ADDRESSES[1],
    chainId: 1,
    query: {
      enabled: !!address,
    },
  })

  const { data: arbBalance, isLoading: isArbLoading } = useBalance({
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

  const handleSend = () => {
    if (!recipientAddress || !amount) {
      alert('Please fill in complete information')
      return
    }
    
    // Here will implement the actual sending logic
    console.log('Send:', { recipientAddress, amount, chain: selectedChain })
    alert('Send functionality will be implemented later')
  }

  const handleQRScan = () => {
    // Here will implement QR scanning functionality
    alert('QR scanning functionality will be implemented later')
  }

  return (
    <div className="send-page">
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

            <button className="send-button" onClick={handleSend}>
              Send PYUSD
            </button>
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
