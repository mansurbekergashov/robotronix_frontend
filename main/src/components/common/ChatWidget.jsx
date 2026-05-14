import { useEffect, useRef, useState } from 'react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import './ChatWidget.css'

export default function ChatWidget() {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [roomId, setRoomId] = useState(null)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)

    const wsRef = useRef(null)
    const messagesEnd = useRef(null)

    useEffect(() => {
        messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (!isOpen) {
            try {
                wsRef.current?.close()
            } catch {
                // ignore
            }
            wsRef.current = null
            setMessages([])
            setRoomId(null)
            setNewMessage('')
            return
        }

        if (isOpen && user && !roomId) {
            initChat()
        }

        return () => {
            // nothing
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, user])

    const connectWebSocket = (rid) => {
        const token = localStorage.getItem('token')
        if (!token) return

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/chat?roomId=${encodeURIComponent(rid)}&token=${encodeURIComponent(token)}`

        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onmessage = (event) => {
            try {
                const envelope = JSON.parse(String(event.data))
                if (envelope?.type !== 'chat') return
                const msg = envelope?.payload
                if (!msg?.id) return

                setMessages((prev) => {
                    if (prev.some((m) => m.id === msg.id)) return prev
                    return [...prev, msg]
                })

                if (msg.sender?.id !== user?.id) {
                    api.put(`/chat/room/${rid}/read`).catch(() => undefined)
                }
            } catch {
                // ignore
            }
        }

        ws.onclose = () => {
            // silent
        }

        ws.onerror = () => {
            try {
                ws.close()
            } catch {
                // ignore
            }
        }
    }

    const initChat = async () => {
        try {
            const res = await api.post('/chat/start')
            const { roomId: rid } = res.data
            setRoomId(rid)

            const histRes = await api.get(`/chat/room/${rid}`)
            setMessages(histRes.data || [])

            await api.put(`/chat/room/${rid}/read`).catch(() => undefined)

            connectWebSocket(rid)
        } catch (err) {
            console.error('Chat init error:', err)
        }
    }

    const sendMessage = () => {
        if (!newMessage.trim() || !roomId || !user) return

        const ws = wsRef.current
        if (!ws || ws.readyState !== WebSocket.OPEN) return

        ws.send(JSON.stringify({ content: newMessage.trim() }))
        setNewMessage('')
    }

    return (
        <>
            <button className="chat-widget-btn" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? 'X' : 'Chat'}
            </button>

            {isOpen && (
                <div className="chat-widget-panel">
                    <div className="chat-widget-header">
                        <h4>Robotronix Yordam</h4>
                        <button onClick={() => setIsOpen(false)}>X</button>
                    </div>

                    {user ? (
                        <>
                            <div className="chat-widget-messages">
                                {messages.length === 0 && (
                                    <p style={{ textAlign: 'center', color: '#8b92a7', padding: '2rem 0' }}>
                                        Xush kelibsiz! Savolingizni yozing.
                                    </p>
                                )}
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`chat-widget-msg ${msg.sender?.id === user.id ? 'sent' : 'received'}`}
                                    >
                                        <div>{msg.content}</div>
                                        <div className="cw-time">
                                            {msg.createdAt
                                                ? new Date(msg.createdAt).toLocaleTimeString('uz-UZ', {
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                  })
                                                : ''}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEnd} />
                            </div>
                            <div className="chat-widget-input">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Xabar yozing..."
                                />
                                <button 
                                    type="button" 
                                    className="cw-emoji-btn"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                >
                                    😊
                                </button>
                                <button onClick={sendMessage} className="cw-send-btn">
                                    <i className="fas fa-paper-plane"></i>
                                </button>
                            </div>
                            {showEmojiPicker && (
                                <div className="cw-emoji-picker-container">
                                    <EmojiPicker
                                        theme={Theme.DARK}
                                        onEmojiClick={(emojiData) => {
                                            setNewMessage(prev => prev + emojiData.emoji);
                                        }}
                                        width="100%"
                                        height={350}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="chat-widget-login-msg">
                            <p>Chat ishlatish uchun avval tizimga kiring</p>
                        </div>
                    )}
                </div>
            )}
        </>
    )
}
