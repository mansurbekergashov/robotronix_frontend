import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FaComments, FaPaperPlane, FaArrowLeft, FaPaperclip, FaFileAlt, FaSmile } from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import './Chat.css';

interface Room {
    roomId: string;
    senderName: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

interface Message {
    id: number;
    sender: { id: number; fullName: string };
    receiverId: number;
    content: string;
    fileUrl?: string;
    fileType?: string;
    roomId: string;
    read: boolean;
    createdAt: string;
}

export default function Chat() {
    const location = useLocation();
    const { user } = useAuth();

    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [connected, setConnected] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimerRef = useRef<number | null>(null);
    const reconnectAttemptRef = useRef(0);
    const selectedRoomRef = useRef<string | null>(null);
    const shouldReconnectRef = useRef(false);

    const messagesEnd = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const initializationDone = useRef(false);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    useEffect(() => {
        selectedRoomRef.current = selectedRoom;
    }, [selectedRoom]);

    useEffect(() => {
        const initChat = async () => {
            setLoading(true);
            await fetchRooms();

            // Handle initiated chat from Users page
            const state = location.state as { userId?: number, fullName?: string };
            if (state?.userId && !initializationDone.current) {
                if (user) {
                    initializationDone.current = true;
                    const roomId = user.id < state.userId
                        ? `room_${user.id}_${state.userId}`
                        : `room_${state.userId}_${user.id}`;
                    selectRoom(roomId);
                    
                    // Add a temporary room to the sidebar so it's visible even if it has 0 messages
                    setRooms(prev => {
                        if (!prev.some(r => r.roomId === roomId)) {
                            return [{
                                roomId,
                                senderName: state.fullName || 'Foydalanuvchi',
                                lastMessage: '',
                                lastMessageTime: new Date().toISOString(),
                                unreadCount: 0
                            }, ...prev];
                        }
                        return prev;
                    });
                }
            }
            setLoading(false);
        };

        if (user) {
            initChat();
        }

        return () => {
            cleanupWebSocket();
        };
    }, [location.state, user]);

    useEffect(() => {
        if (!user) return;
        connectWebSocket(selectedRoom || 'all');
        return () => {
            cleanupWebSocket();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRoom, user]);

    useEffect(() => {
        messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const cleanupWebSocket = () => {
        shouldReconnectRef.current = false;

        if (reconnectTimerRef.current) {
            window.clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        reconnectAttemptRef.current = 0;

        if (wsRef.current) {
            try {
                wsRef.current.close();
            } catch {
                // ignore
            }
            wsRef.current = null;
        }

        setConnected(false);
    };

    const connectWebSocket = (roomId: string) => {
        cleanupWebSocket();
        shouldReconnectRef.current = true;

        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/chat?roomId=${encodeURIComponent(roomId)}&token=${encodeURIComponent(token)}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            reconnectAttemptRef.current = 0;
            setConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const envelope = JSON.parse(String(event.data)) as { type?: string; payload?: Message };
                if (!envelope?.type) return;

                // 1. Handle System Updates (Entity changes)
                if (envelope.type === 'system_update') {
                    // Refresh current data if applicable
                    fetchRooms();
                    return;
                }

                if (envelope.type !== 'chat' || !envelope.payload) return;
                const newMsg = envelope.payload;

                // 2. Update messages list if it's for the selected room
                if (selectedRoomRef.current && newMsg.roomId === selectedRoomRef.current) {
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });

                    // Mark as read when admin is actively viewing this room
                    if (newMsg.sender?.id !== user?.id) {
                        api.put(`/chat/room/${selectedRoomRef.current}/read`).catch(() => undefined);
                    }
                }

                // 3. Always refresh rooms list on any message to keep last message/unread count in sync
                fetchRooms();
            } catch (err) {
                console.error('Error handling WebSocket message:', err);
            }
        };

        ws.onerror = () => {
            // onclose will schedule reconnect
            try {
                ws.close();
            } catch {
                // ignore
            }
        };

        ws.onclose = (event) => {
            setConnected(false);

            if (event.code === 3000) {
                console.warn('WebSocket unauthorized, stopping reconnection');
                shouldReconnectRef.current = false;
                return;
            }

            if (!shouldReconnectRef.current) return;
            if (selectedRoomRef.current !== roomId) return;

            const attempt = reconnectAttemptRef.current + 1;
            reconnectAttemptRef.current = attempt;
            const delay = Math.min(10_000, 1000 * attempt);

            reconnectTimerRef.current = window.setTimeout(() => {
                if (shouldReconnectRef.current && selectedRoomRef.current === roomId) {
                    connectWebSocket(roomId);
                }
            }, delay);
        };
    };

    const fetchRooms = async () => {
        try {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            if (!token || !userData) {
                setLoading(false);
                return;
            }

            const res = await api.get('/chat/rooms');
            setRooms(res.data);
        } catch (err: unknown) {
            console.error('Error fetching rooms:', err);
        } finally {
            setLoading(false);
        }
    };

    const selectRoom = async (roomId: string) => {
        setSelectedRoom(roomId);

        // Add chat-active class for mobile
        document.querySelector('.chat-layout')?.classList.add('chat-active');

        try {
            const res = await api.get(`/chat/history/${roomId}`);
            setMessages(res.data || []);
            try {
                await api.put(`/chat/room/${roomId}/read`);
            } catch (readErr) {
                // Ignore 404/error on marking as read for new/empty rooms
                console.debug('Could not mark room as read (might be new):', roomId);
            }
            setRooms((prev) =>
                prev.map((r) => (r.roomId === roomId ? { ...r, unreadCount: 0 } : r))
            );
            window.dispatchEvent(new Event('robotronix:chat-unread-update'));
        } catch (err) {
            console.error('Error fetching messages:', err);
            setMessages([]); // Fallback to empty if 404
        }
    };

    const goBackToRooms = () => {
        cleanupWebSocket();
        setSelectedRoom(null);
        setMessages([]);
        document.querySelector('.chat-layout')?.classList.remove('chat-active');
    };

    const sendMessage = () => {
        if (!newMessage.trim() || !selectedRoom || !user) return;

        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            // If WS is not ready, try connecting again or notify
            alert('Muloqot ulanishi hali tayyor emas. Iltimos bir necha soniya kuting.');
            if (ws?.readyState === WebSocket.CLOSED) {
                connectWebSocket(selectedRoom);
            }
            return;
        }

        ws.send(JSON.stringify({ content: newMessage.trim() }));
        setNewMessage('');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedRoom || !user) return;

        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            alert('WebSocket ulanmagan. Iltimos qaytadan urinib ko\'ring.');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await api.post('/chat/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const { fileUrl, fileType } = res.data;

            ws.send(
                JSON.stringify({
                    content: file.name,
                    fileUrl,
                    fileType,
                })
            );
        } catch (err) {
            console.error('Error uploading file:', err);
            alert('Fayl yuklashda xatolik yuz berdi');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (loading) return <div className="page-container"><p>Yuklanmoqda...</p></div>;

    const totalUnread = rooms.reduce((sum, room) => sum + (Number(room.unreadCount) || 0), 0);

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1><FaComments /> Chat</h1>
                    <p>Foydalanuvchilar bilan muloqot</p>
                </div>
            </div>

            <div className="chat-layout">
                <div className="chat-rooms">
                    <h3>
                        Suhbatlar ({rooms.length})
                        {totalUnread > 0 && <span className="rooms-unread">{totalUnread} yangi</span>}
                    </h3>
                    {rooms.map((room) => (
                        <div
                            key={room.roomId}
                            className={`room-item ${selectedRoom === room.roomId ? 'active' : ''}`}
                            onClick={() => selectRoom(room.roomId)}
                        >
                            <div className="room-name">
                                {room.senderName}
                                {room.unreadCount > 0 && <span className="unread-dot">{room.unreadCount}</span>}
                            </div>
                            <div className="room-preview">{room.lastMessage}</div>
                            <span className="room-time">
                                {room.lastMessageTime
                                    ? new Date(room.lastMessageTime).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
                                    : ''}
                            </span>
                        </div>
                    ))}
                    {rooms.length === 0 && (
                        <p style={{ padding: '1.5rem', textAlign: 'center', color: '#8b98a5' }}>Hali suhbatlar yo'q</p>
                    )}
                </div>

                {selectedRoom ? (
                    <div className="chat-main">
                        <button className="chat-back-btn" onClick={goBackToRooms}>
                            <FaArrowLeft /> Orqaga
                        </button>

                        <div className="chat-messages">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`message-bubble ${msg.sender?.id === user?.id ? 'sent' : 'received'}`}
                                >
                                    <div>
                                        {msg.sender?.id !== user?.id && (
                                            <div className="msg-sender">{msg.sender?.fullName}</div>
                                        )}

                                        {msg.fileUrl && msg.fileType?.startsWith('image/') ? (
                                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="message-image-link">
                                                <img src={msg.fileUrl} alt="Biktirilgan rasm" className="message-image" />
                                            </a>
                                        ) : msg.fileUrl ? (
                                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="message-file-link">
                                                <div className="file-icon-wrapper">
                                                    <FaFileAlt />
                                                </div>
                                                <div className="file-details">
                                                    <span className="file-name">{msg.content || 'Fayl'}</span>
                                                    <span className="file-type">{msg.fileType}</span>
                                                </div>
                                            </a>
                                        ) : (
                                            <div className="message-text">{msg.content}</div>
                                        )}

                                        <div className="msg-time">
                                            {msg.createdAt
                                                ? new Date(msg.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
                                                : ''}
                                            {msg.sender?.id === user?.id && msg.read && (
                                                <i className="fas fa-check-double" style={{ color: '#0ac630', marginLeft: '4px' }}></i>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEnd} />
                        </div>

                        <div className="chat-input-area">
                            <div className="chat-input-wrapper">
                                {showEmojiPicker && (
                                    <div className="emoji-picker-container">
                                        <EmojiPicker
                                            theme={Theme.DARK}
                                            lazyLoadEmojis={true}
                                            searchPlaceholder="Emoji qidirish..."
                                            onEmojiClick={(emojiData: EmojiClickData) => {
                                                setNewMessage((prev) => prev + emojiData.emoji);
                                            }}
                                            width="100%"
                                            height={400}
                                        />
                                    </div>
                                )}

                                <button
                                    className="action-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading || !connected}
                                    title={!connected ? 'WebSocket ulanmagan' : 'Fayl yuborish'}
                                >
                                    {uploading ? <i className="fas fa-spinner fa-spin"></i> : <FaPaperclip />}
                                </button>

                                <button
                                    className="action-btn"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    title="Emoji"
                                >
                                    <FaSmile />
                                </button>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleFileUpload}
                                    accept="image/*,.pdf,.doc,.docx,.zip,.rar,.txt"
                                />

                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder={connected ? 'Xabar yozing...' : 'Ulanish kutilmoqda...'}
                                    className="chat-text-input"
                                />
                                <button className="send-btn" onClick={sendMessage} disabled={!connected}>
                                    <FaPaperPlane />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="no-chat-selected">
                        Suhbatni tanlang yoki foydalanuvchi xabar yozishini kuting
                    </div>
                )}
            </div>
        </div>
    );
}

