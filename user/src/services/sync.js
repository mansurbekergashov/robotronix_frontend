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

        // For users, we can just use a generic 'user_sync' roomId or their first possible room.
        // The backend will now deliver SYSTEM_UPDATE messages to ANY room connection.
        // We just need ANY valid connection to receive these broadcasts.
        const roomId = 'user_monitor';
        // Actually, let's just use 'room_all' if user was admin, but they are not.
        // To avoid "Admin not found" or "Authorization" issues, we should ideally have a 
        // /chat/start equivalent for sync if it doesn't already exist.
        // But for now, let's use a very safe room ID.
        
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
            // If closed due to authorization error (status 4000+ or custom), don't retry automatically
            if (event.code === 1008 || event.code === 3000) {
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
