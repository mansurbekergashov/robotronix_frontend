

type Listener = (type: string, action: string, data?: any) => void;

class SyncService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Listener[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  private intentionalDisconnect = false;
  private _token: string = '';

  init(token: string) {
    // Always update the token so reconnects use the freshest one
    this._token = token;
    if (this.socket || this.isConnecting) return;
    this.intentionalDisconnect = false;
    this.connect(token);
  }

  private connect(token: string) {
    this.isConnecting = true;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/chat?token=${encodeURIComponent(token)}&roomId=all`;

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const envelope = JSON.parse(event.data);
        if (envelope?.type === 'system_update') {
          const update = envelope?.payload;
          if (update && update.entityType) {
            this.notifyListeners(update.entityType, update.action, update);
          }
        }
      } catch (error) {
        console.error('Error parsing sync message:', error);
      }
    };

    this.socket.onclose = () => {
      this.socket = null;
      this.isConnecting = false;

      if (!this.intentionalDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        // Use latest token (may have been refreshed since initial connect)
        setTimeout(() => this.connect(this._token), 2000 * Math.pow(2, this.reconnectAttempts - 1));
      }
    };

    this.socket.onerror = (error) => {
      console.error('Admin SyncService error:', error);
      this.socket?.close();
    };
  }

  subscribe(entityType: string, callback: Listener) {
    const type = entityType.toUpperCase();
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)?.push(callback);
    
    return () => {
      const currentListeners = this.listeners.get(type) || [];
      this.listeners.set(type, currentListeners.filter(cb => cb !== callback));
    };
  }

  private notifyListeners(entityType: string, action: string, data: any) {
    const type = entityType?.toUpperCase();
    const typeListeners = this.listeners.get(type) || [];
    typeListeners.forEach(listener => listener(type, action, data));
  }

  disconnect() {
    this.intentionalDisconnect = true;
    this.reconnectAttempts = 0;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.listeners.clear();
  }
}

export const syncService = new SyncService();
