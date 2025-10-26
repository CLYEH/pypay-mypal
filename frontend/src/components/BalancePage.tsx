import { useState, useEffect } from 'react'
import { useAccount, useBalance } from 'wagmi'

// PYUSD Contract Addresses
import { PYUSD_ADDRESSES } from '../config/constants'

const PYUSD_CONTRACTS = {
  ethereum: PYUSD_ADDRESSES[1],
  arbitrum: PYUSD_ADDRESSES[42161]
}

function BalancePage() {
  const { address } = useAccount()
  const [showDetailed, setShowDetailed] = useState(false)
  
  // Ethereum Balance
  const { data: ethBalance, isLoading: ethLoading } = useBalance({
    address,
    token: PYUSD_CONTRACTS.ethereum,
    chainId: 1,
  })
  
  // Arbitrum Balance
  const { data: arbBalance, isLoading: arbLoading } = useBalance({
    address,
    token: PYUSD_CONTRACTS.arbitrum,
    chainId: 42161,
  })

  const totalBalance = ethBalance && arbBalance 
    ? Number(ethBalance.formatted) + Number(arbBalance.formatted)
    : 0

  const formatBalance = (balance: number) => {
    return balance.toFixed(6)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Here you can add a toast notification
  }

  return (
    <div className="balance-page">
      <div className="balance-card">
        <h2>PYUSD Balance</h2>
        
        <div className="total-balance" onClick={() => setShowDetailed(!showDetailed)}>
          <div className="balance-amount">
            {ethLoading || arbLoading ? (
              <span className="loading">Loading...</span>
            ) : (
              <span className="amount">{formatBalance(totalBalance)} PYUSD</span>
            )}
          </div>
          <div className="balance-label">
            {showDetailed ? 'Click to hide details' : 'Click to view details'}
          </div>
        </div>

        {showDetailed && (
          <div className="detailed-balance">
            <div className="chain-balance">
              <div className="chain-info">
                <span className="chain-name">Ethereum</span>
                <span className="chain-address" onClick={() => copyToClipboard(PYUSD_CONTRACTS.ethereum)}>
                  {PYUSD_CONTRACTS.ethereum.slice(0, 6)}...{PYUSD_CONTRACTS.ethereum.slice(-4)}
                </span>
              </div>
              <div className="chain-amount">
                {ethLoading ? (
                  <span className="loading">Loading...</span>
                ) : (
                  <span>{formatBalance(Number(ethBalance?.formatted || 0))} PYUSD</span>
                )}
              </div>
            </div>

            <div className="chain-balance">
              <div className="chain-info">
                <span className="chain-name">Arbitrum</span>
                <span className="chain-address" onClick={() => copyToClipboard(PYUSD_CONTRACTS.arbitrum)}>
                  {PYUSD_CONTRACTS.arbitrum.slice(0, 6)}...{PYUSD_CONTRACTS.arbitrum.slice(-4)}
                </span>
              </div>
              <div className="chain-amount">
                {arbLoading ? (
                  <span className="loading">Loading...</span>
                ) : (
                  <span>{formatBalance(Number(arbBalance?.formatted || 0))} PYUSD</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="balance-actions">
          <button className="action-button refresh">
            Refresh Balance
          </button>
        </div>
      </div>
    </div>
  )
}

export default BalancePage
