// Sync Service for real-time updates
import { AuthService } from './auth.js';

class SyncService {
    constructor() {
        this.auth = new AuthService();
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimer = null;
        this.callbacks = new Set();
    }

    init() {
        const user = this.auth.getUser();
        if (!user) return;

        this.connect();
    }

    connect() {
        const token = this.auth.getToken();
        if (!token) return;

        const roomId = 'user_sync';
        
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/chat?roomId=${encodeURIComponent(roomId)}&token=${encodeURIComponent(token)}`;

        if (this.ws) {
            try { this.ws.close(); } catch (e) {}
        }

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('âœ… Sync Service connected');
            this.reconnectAttempts = 0;
        };

        this.ws.onmessage = (event) => {
            try {
                const envelope = JSON.parse(event.data);
                if (envelope?.type === 'system_update') {
                    const update = envelope?.payload;
                    console.log('Received system update:', update);
                    this.notifyListeners(update);
                }
            } catch (e) {
                // ignore
            }
        };

        this.ws.onclose = (event) => {
            // Stop reconnecting on auth/forbidden errors
            if (event.code === 1008 || event.code === 3000 || event.code === 3003) {
                console.warn('Sync Service unauthorized, stopping reconnection');
                return;
            }

            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                const delay = Math.pow(2, this.reconnectAttempts) * 1000;
                this.reconnectTimer = setTimeout(() => {
                    this.reconnectAttempts++;
                    this.connect();
                }, delay);
            }
        };

        this.ws.onerror = () => {
            this.ws.close();
        };
    }

    onUpdate(callback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    notifyListeners(update) {
        this.callbacks.forEach(cb => {
            try { cb(update); } catch (e) { console.error('Sync callback error:', e); }
        });
        
        // Also dispatch a global browser event
        const event = new CustomEvent('robotronix-update', { detail: update });
        window.dispatchEvent(event);
    }
}

export const syncService = new SyncService();
