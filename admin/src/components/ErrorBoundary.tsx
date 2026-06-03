import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Agar bu ChunkLoadError bo'lsa (yangi versiya chiqqanda yoki tarmoq xatosi),
    // sahifani avtomatik yangilash
    const isChunkError = error.name === 'ChunkLoadError' || 
                         error.message.includes('Failed to fetch dynamically imported module') ||
                         /Loading chunk [\d]+ failed/.test(error.message);
                         
    if (isChunkError) {
        const reloadCount = parseInt(sessionStorage.getItem('chunk_reload_count') || '0');
        if (reloadCount < 2) {
            sessionStorage.setItem('chunk_reload_count', (reloadCount + 1).toString());
            window.location.reload();
        }
    } else {
        // Boshqa xatolik bo'lsa, reload countni tozalaymiz
        sessionStorage.removeItem('chunk_reload_count');
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg)', color: 'var(--text-primary)' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>Kutilmagan xatolik yuz berdi</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            Iltimos, sahifani yangilang. Agar xatolik davom etsa, administratorga murojaat qiling.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
                padding: '10px 20px', 
                background: 'var(--primary)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
            }}
          >
            Sahifani yangilash
          </button>
          <details style={{ marginTop: '2rem', textAlign: 'left', background: 'rgba(0,0,0,0.05)', padding: '1rem', borderRadius: '8px', maxWidth: '800px', width: '100%', overflow: 'auto' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Xatolik tafsilotlari</summary>
            <pre style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
