import { useState } from 'react'
import { useAccount } from 'wagmi'

function ReceivePage() {
  const { address } = useAccount()
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'arbitrum'>('ethereum')
  const [showQR, setShowQR] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Address copied to clipboard')
  }

  const generateQRCode = () => {
    // Here will implement QR code generation functionality
    setShowQR(true)
  }

  return (
    <div className="receive-page">
      <div className="receive-card">
        <h2>Receive PYUSD</h2>

        <div className="chain-selector">
          <h3>Select Network</h3>
          <div className="chain-buttons">
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

        <div className="address-section">
          <h3>Your Address</h3>
          <div className="address-text">
            {address ? address : 'Wallet not connected'}
          </div>
          
          <div className="action-buttons">
            <button 
              className="action-button"
              onClick={() => address && copyToClipboard(address)}
              disabled={!address}
            >
              Copy
            </button>
            <button 
              className="action-button"
              onClick={generateQRCode}
              disabled={!address}
            >
              Show QR Code
            </button>
          </div>
        </div>

      </div>
      
      {/* QR Code Slide-up Modal */}
      {showQR && address && (
        <div className="qr-modal-overlay" onClick={() => setShowQR(false)}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qr-modal-header">
              <h3>QR Code</h3>
              <button className="close-button" onClick={() => setShowQR(false)}>
                ×
              </button>
            </div>
            <div className="qr-modal-content">
              <div className="qr-code">
                <div className="qr-pattern">
                  {Array.from({ length: 25 }, (_, i) => (
                    <div key={i} className={`qr-dot ${Math.random() > 0.5 ? 'filled' : ''}`}></div>
                  ))}
                </div>
              </div>
              <p className="qr-hint">Scan this QR code to send PYUSD</p>
              <div className="qr-address">
                <span className="qr-address-text">{address}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReceivePage
