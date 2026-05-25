import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ToastType } from '../utils/toast'

interface Toast {
    id: string
    type: ToastType
    message: string
    exiting: boolean
}

interface ToastApi {
    success: (msg: string) => void
    error: (msg: string) => void
    info: (msg: string) => void
    warning: (msg: string) => void
}

const ToastContext = createContext<ToastApi>({
    success: () => {},
    error: () => {},
    info: () => {},
    warning: () => {},
})

const ICONS: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const remove = useCallback((id: string) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300)
    }, [])

    const add = useCallback((type: ToastType, message: string) => {
        const id = Math.random().toString(36).slice(2)
        setToasts(prev => [...prev.slice(-2), { id, type, message, exiting: false }])
        setTimeout(() => remove(id), 4000)
    }, [remove])

    const api = useMemo<ToastApi>(() => ({
        success: (msg) => add('success', msg),
        error: (msg) => add('error', msg),
        info: (msg) => add('info', msg),
        warning: (msg) => add('warning', msg),
    }), [add])

    useEffect(() => {
        const handle = (e: Event) => {
            const { type, message } = (e as CustomEvent<{ type: ToastType; message: string }>).detail
            add(type, message)
        }
        window.addEventListener('robotronix:toast', handle)
        return () => window.removeEventListener('robotronix:toast', handle)
    }, [add])

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div className="toast-container" aria-live="polite">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`toast toast-${t.type}${t.exiting ? ' toast-exit' : ''}`}
                        onClick={() => remove(t.id)}
                    >
                        <span className="toast-icon">{ICONS[t.type]}</span>
                        <span className="toast-message">{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = (): ToastApi => useContext(ToastContext)
