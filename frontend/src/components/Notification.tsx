import { useState, useEffect } from 'react'

type NotificationType = 'success' | 'error' | 'info'

interface NotificationProps {
  message: string
  type: NotificationType
  duration?: number
  onClose?: () => void
}

function Notification({ message, type, duration = 5000, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose?.(), 300) // Wait for animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const colors = {
    success: {
      bg: '#d4edda',
      border: '#c3e6cb',
      text: '#155724',
      icon: '✓'
    },
    error: {
      bg: '#f8d7da',
      border: '#f5c6cb',
      text: '#721c24',
      icon: '✕'
    },
    info: {
      bg: '#d1ecf1',
      border: '#bee5eb',
      text: '#0c5460',
      icon: 'ℹ'
    }
  }

  const style = colors[type]

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: style.bg,
        border: `2px solid ${style.border}`,
        color: style.text,
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 10000,
        maxWidth: '400px',
        animation: 'slideIn 0.3s ease-out',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.95rem',
        fontWeight: '500'
      }}
    >
      <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{style.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(() => onClose?.(), 300)
        }}
        style={{
          background: 'none',
          border: 'none',
          color: style.text,
          cursor: 'pointer',
          fontSize: '1.2rem',
          padding: '0',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default Notification

