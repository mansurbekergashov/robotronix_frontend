// Chat Page
import { AuthService } from '../services/auth.js';
import api from '../services/api.js';
import toast from '../services/toast.js';


export default class Chat {
    constructor() {
        this.container = document.getElementById('main-content');
        this.auth = new AuthService();
        this.user = this.auth.getUser();
        this.messages = [];
        this.ws = null;
        this.roomId = null;
        this.adminId = null;
        this._messageQueue = [];
        this._reconnectTimer = null;
        this._reconnectDelay = 2000;
        this._destroyed = false;
    }

    render() {
        this.container.innerHTML = `
            <div class="page-header">
                <h1><i class="fas fa-comments"></i> Chat</h1>
                <p>Admin bilan suhbatlashing</p>
            </div>

            <div class="chat-layout">
                <!-- Chat Messages -->
                <div class="chat-messages-container">
                    <div class="chat-header">
                        <div class="chat-header-info">
                            <div class="admin-avatar">
                                <img src="https://ui-avatars.com/api/?name=Admin&background=0066ff&color=fff" alt="Admin">
                                <span class="status-indicator online"></span>
                            </div>
                            <div>
                                <h3>Robotronix Admin</h3>
                                <p class="status-text">Onlayn</p>
                            </div>
                        </div>
                        <div class="chat-actions">
                            <button class="btn-icon" title="Yangilash" id="refreshBtn">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                    </div>

                    <div class="chat-messages" id="chatMessages">
                        <div class="loading-messages">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Xabarlar yuklanmoqda...</p>
                        </div>
                    </div>

                    <div class="chat-input-container">
                        <div class="chat-input-wrapper">
                            <div class="emoji-picker-container" id="emojiPicker" style="display: none;">
                                <div class="emoji-grid" id="emojiGrid"></div>
                            </div>
                            <button class="btn-icon" id="attachBtn" title="Fayl biriktirish">
                                <i class="fas fa-paperclip"></i>
                            </button>
                            <button class="btn-icon" id="emojiBtn" title="Emoji">
                                <i class="fas fa-smile"></i>
                            </button>
                            <textarea 
                                id="messageInput" 
                                placeholder="Xabar yozing..." 
                                rows="1"
                            ></textarea>
                            <button class="btn-send" id="sendBtn" title="Yuborish">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                        <input type="file" id="fileInput" style="display: none;" multiple accept="image/*,.pdf,.doc,.docx,.zip,.rar,.txt">
                    </div>
                </div>

                <!-- Chat Info Sidebar -->
                <div class="chat-info-sidebar">
                    <div class="info-section">
                        <h4><i class="fas fa-info-circle"></i> Ma'lumot</h4>
                        <p>Admin bilan to'g'ridan-to'g'ri suhbatlashing. Savollaringizga tez javob oling.</p>
                    </div>

                    <div class="info-section">
                        <h4><i class="fas fa-clock"></i> Ish vaqti</h4>
                        <p>Dushanba - Shanba: 9:00 - 18:00</p>
                        <p>Yakshanba: Dam olish</p>
                    </div>

                    <div class="info-section">
                        <h4><i class="fas fa-paperclip"></i> Fayl yuklash</h4>
                        <p>Rasm, PDF, Word va boshqa fayllarni yuborishingiz mumkin.</p>
                        <div class="file-types">
                            <span class="file-type-badge"><i class="fas fa-image"></i> Rasm</span>
                            <span class="file-type-badge"><i class="fas fa-file-pdf"></i> PDF</span>
                            <span class="file-type-badge"><i class="fas fa-file-word"></i> Word</span>
                        </div>
                    </div>

                    <div class="info-section">
                        <h4><i class="fas fa-shield-alt"></i> Xavfsizlik</h4>
                        <p>Barcha xabarlar shifrlangan va xavfsiz.</p>
                    </div>
                </div>
            </div>
        `;

        this.attachEvents();
        this.initializeChat();
    }

    attachEvents() {
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        const emojiBtn = document.getElementById('emojiBtn');
        const attachBtn = document.getElementById('attachBtn');
        const fileInput = document.getElementById('fileInput');

        // Send message
        sendBtn?.addEventListener('click', () => this.sendMessage());
        messageInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        messageInput?.addEventListener('input', (e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
        });

        // Refresh messages
        refreshBtn?.addEventListener('click', () => this.loadMessages());

        // Emoji Picker Logic (using Picmo from CDN)
        const emojiPickerEl = document.getElementById('emojiPicker');
        
        emojiBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (emojiPickerEl) {
                const isHidden = emojiPickerEl.style.display === 'none';
                
                if (isHidden) {
                    emojiPickerEl.style.display = 'block';
                    if (!emojiPickerEl.querySelector('emoji-picker')) {
                        const picker = document.createElement('emoji-picker');
                        picker.classList.add('light'); // or dark, it auto-detects but we can force
                        picker.style.width = '100%';
                        picker.style.height = '100%';
                        emojiPickerEl.appendChild(picker);
                        
                        picker.addEventListener('emoji-click', event => {
                            const emoji = event.detail.unicode;
                            const start = messageInput.selectionStart;
                            const end = messageInput.selectionEnd;
                            const text = messageInput.value;
                            messageInput.value = text.substring(0, start) + emoji + text.substring(end);
                            messageInput.focus();
                            const newPos = start + emoji.length;
                            messageInput.setSelectionRange(newPos, newPos);
                            // Trigger input event for auto-resize
                            messageInput.dispatchEvent(new Event('input'));
                        });
                        
                        // Close on click outside
                        document.addEventListener('click', (e) => {
                            if (!emojiPickerEl.contains(e.target) && !emojiBtn.contains(e.target)) {
                                emojiPickerEl.style.display = 'none';
                            }
                        }, { once: true });
                    }
                } else {
                    emojiPickerEl.style.display = 'none';
                }
            }
        });

        // Close emoji picker when clicking outside
        this._emojiClickOutside = (e) => {
            if (emojiPickerEl && emojiPickerEl.style.display === 'block' && !emojiPickerEl.contains(e.target) && !emojiBtn.contains(e.target)) {
                emojiPickerEl.style.display = 'none';
            }
        };
        document.addEventListener('click', this._emojiClickOutside);

        // File attachment
        attachBtn?.addEventListener('click', () => {
            fileInput?.click();
        });

        fileInput?.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                this.handleFileUpload(files);
            }
        });
    }

    async initializeChat() {
        try {
            // Start chat and get room ID
            const response = await api.post('/chat/start');

            if (!response) {
                throw new Error('No response from server');
            }

            // API client returns data directly, not wrapped in .data property
            if (!response.roomId || !response.adminId) {
                throw new Error('Invalid response format: ' + JSON.stringify(response));
            }

            this.roomId = response.roomId;
            this.adminId = parseInt(response.adminId);

            // Load messages
            await this.loadMessages();

            // Connect WebSocket
            this.connectWebSocket();

            // Mark messages as read
            await this.markAsRead();

        } catch (error) {
            console.error('Chat initialization failed:', error);
            this.showError('Chat yuklanmadi: ' + error.message);
        }
    }

    async loadMessages() {
        if (!this.roomId) {
            return;
        }

        try {
            const response = await api.get(`/chat/room/${this.roomId}`);

            // API client returns data directly, not wrapped in .data property
            this.messages = response || [];

            this.renderMessages();
        } catch (error) {
            console.error('Error loading messages:', error);
            const messagesContainer = document.getElementById('chatMessages');
            if (messagesContainer) {
                messagesContainer.innerHTML = `
                    <div class="empty-chat">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Xabarlarni yuklashda xatolik yuz berdi</p>
                    </div>
                `;
            }
        }
    }

    renderMessages() {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) {
            return;
        }

        if (this.messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="empty-chat">
                    <i class="fas fa-comments"></i>
                    <h3>Suhbatni boshlang</h3>
                    <p>Admin bilan birinchi xabaringizni yuboring</p>
                </div>
            `;
            return;
        }

        messagesContainer.innerHTML = this.messages.map(msg => this.renderMessage(msg)).join('');
        this.scrollToBottom();
    }

    renderMessage(msg) {
        const isOwn = msg.sender?.id === this.user?.id;
        const time = new Date(msg.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
        const senderName = msg.sender?.fullName || 'Unknown';

        return `
            <div class="message ${isOwn ? 'message-own' : 'message-other'}">
                ${!isOwn ? `
                    <div class="message-avatar">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=0066ff&color=fff" alt="${senderName}">
                    </div>
                ` : ''}
                <div class="message-content">
                    ${!isOwn ? `<div class="message-sender">${this.escapeHtml(senderName)}</div>` : ''}
                    ${msg.fileUrl && (msg.fileType || '').startsWith('image/') ? `
                        <a href="${msg.fileUrl}" target="_blank" rel="noopener noreferrer">
                            <img src="${msg.fileUrl}" alt="Rasm" style="max-width: 260px; max-height: 200px; border-radius: 10px; display: block; margin-bottom: 4px;">
                        </a>
                    ` : msg.fileUrl ? `
                        <a href="${msg.fileUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; gap: 8px; color: #00ccff; text-decoration: none; padding: 8px 0;">
                            <i class="fas fa-file-alt"></i> ${this.escapeHtml(msg.content || 'Fayl')}
                        </a>
                    ` : `
                        <div class="message-text">${this.escapeHtml(msg.content)}</div>
                    `}
                    <div class="message-time">
                        ${time}
                        ${isOwn && msg.read ? '<i class="fas fa-check-double" style="color: #0066ff;"></i>' : ''}
                        ${isOwn && !msg.read ? '<i class="fas fa-check" style="color: #8b98a5;"></i>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    async connectWebSocket() {
        if (!this.roomId || this._destroyed) return;

        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }

        let ticket;
        try {
            const res = await api.post('/chat/ws-ticket');
            ticket = res?.ticket;
        } catch (e) {
            console.error('Could not get WebSocket ticket', e);
            this._scheduleReconnect();
            return;
        }

        if (!ticket) {
            this._scheduleReconnect();
            return;
        }

        try {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${window.location.host}/ws/chat?roomId=${encodeURIComponent(this.roomId)}&ticket=${encodeURIComponent(ticket)}`;

            if (this.ws) {
                try { this.ws.close(); } catch (e) { }
                this.ws = null;
            }

            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                this._reconnectDelay = 2000;
                this._updateConnectionStatus(true);
                // Flush queued messages
                while (this._messageQueue.length > 0) {
                    const queued = this._messageQueue.shift();
                    try { this.ws.send(queued); } catch (e) { /* drop */ }
                }
            };

            this.ws.onmessage = (event) => {
                try {
                    const envelope = JSON.parse(String(event.data));
                    if (envelope?.type !== 'chat') return;
                    const newMessage = envelope?.payload;
                    if (!newMessage?.id) return;

                    const existingMsgIndex = this.messages.findIndex(m => m.id === newMessage.id);
                    if (existingMsgIndex === -1) {
                        this.messages.push(newMessage);
                    } else {
                        this.messages[existingMsgIndex] = newMessage;
                    }

                    this.renderMessages();

                    if (newMessage.sender?.id !== this.user?.id) {
                        this.markAsRead();
                    }
                } catch (e) {
                    // ignore
                }
            };

            this.ws.onclose = (event) => {
                this._updateConnectionStatus(false);
                if (event.code === 1008 || event.code === 3000) {
                    console.warn('WebSocket unauthorized');
                    this.showError('Sessiya muddati tugagan. Iltimos, qaytadan kiring.');
                    return;
                }
                this._scheduleReconnect();
            };

            this.ws.onerror = () => {
                try { this.ws?.close(); } catch (e) { }
            };
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this._scheduleReconnect();
        }
    }

    _scheduleReconnect() {
        if (this._destroyed) return;
        this._reconnectTimer = setTimeout(() => {
            this.connectWebSocket();
        }, this._reconnectDelay);
        this._reconnectDelay = Math.min(this._reconnectDelay * 2, 30000);
    }

    _updateConnectionStatus(connected) {
        const statusText = document.querySelector('.status-text');
        const statusIndicator = document.querySelector('.status-indicator');
        if (statusText) statusText.textContent = connected ? 'Onlayn' : 'Ulanmoqda...';
        if (statusIndicator) {
            statusIndicator.style.background = connected ? '' : '#f59e0b';
        }
    }

    async markAsRead() {
        if (!this.roomId) return;

        try {
            await api.put(`/chat/room/${this.roomId}/read`);
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }

    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput?.value?.trim();

        if (!message || !this.roomId) return;

        const payload = JSON.stringify({ content: message });

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(payload);
            messageInput.value = '';
            messageInput.style.height = 'auto';
        } else if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            this._messageQueue.push(payload);
            messageInput.value = '';
            messageInput.style.height = 'auto';
            toast.info('Xabar navbatga qo\'shildi, ulanish amalga oshgach yuboriladi.');
        } else {
            this._messageQueue.push(payload);
            messageInput.value = '';
            messageInput.style.height = 'auto';
            toast.warning('Qayta ulanmoqda, xabar yuboriladi...');
            this.connectWebSocket();
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
        }
    }

    showError(message) {
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="empty-chat">
                    <i class="fas fa-exclamation-circle" style="color: #ef5350;"></i>
                    <h3>Xatolik</h3>
                    <p>${this.escapeHtml(message)}</p>
                    <button class="btn-primary" onclick="location.reload()">Qayta yuklash</button>
                </div>
            `;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async handleFileUpload(files) {
        if (!this.roomId) return;
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            toast.warning('Ulanmoqda... Iltimos bir oz kuting.');
            this.connectWebSocket();
            return;
        }

        for (const file of files) {
            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await api.post('/chat/upload', formData, true);
                const fileUrl = response.fileUrl;
                const fileType = response.fileType;

                this.ws.send(JSON.stringify({
                    content: file.name,
                    fileUrl: fileUrl,
                    fileType: fileType
                }));
            } catch (error) {
                console.error('Error uploading file:', error);
                toast.error('Fayl yuklashda xatolik yuz berdi: ' + file.name);
            }
        }

        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.value = '';
    }

    destroy() {
        this._destroyed = true;
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
        if (this.ws) {
            try { this.ws.close(); } catch (e) { }
            this.ws = null;
        }
        if (this._emojiClickOutside) {
            document.removeEventListener('click', this._emojiClickOutside);
            this._emojiClickOutside = null;
        }
    }
}
