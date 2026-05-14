

type Listener = (type: string, action: string, data?: any) => void;

class SyncService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Listener[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  init(token: string) {
    if (this.socket || this.isConnecting) return;
    this.connect(token);
  }

  private connect(token: string) {
    this.isConnecting = true;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/chat?token=${encodeURIComponent(token)}&roomId=all`;
    
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('Admin SyncService connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const envelope = JSON.parse(event.data);
        if (envelope?.type === 'system_update') {
          const update = envelope?.payload;
          console.log('Received system update:', update);
          if (update && update.entityType) {
            this.notifyListeners(update.entityType, update.action, update);
          }
        }
      } catch (error) {
        console.error('Error parsing sync message:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('Admin SyncService disconnected');
      this.socket = null;
      this.isConnecting = false;
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(token), 2000 * Math.pow(2, this.reconnectAttempts - 1));
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
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.listeners.clear();
  }
}

export const syncService = new SyncService();
