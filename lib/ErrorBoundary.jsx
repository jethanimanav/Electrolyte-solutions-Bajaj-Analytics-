import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: '#0b0f19', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
          gap: 16, fontFamily: 'Inter, sans-serif', padding: 32
        }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
          <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem' }}>Something went wrong</div>
          <div style={{ color: '#64748b', fontSize: '0.8rem', maxWidth: 400, textAlign: 'center' }}>
            {this.state.error?.message || 'An unexpected error occurred. Please refresh the page.'}
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
            style={{
              marginTop: 8, padding: '8px 20px', background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: '#60a5fa',
              cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'Inter'
            }}
          >
            Reload Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
