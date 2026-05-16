import { createContext, useCallback, useContext, useState } from 'react'
import { FaTrash, FaExclamationTriangle } from 'react-icons/fa'

interface ConfirmOptions {
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
    danger?: boolean
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false))

interface ConfirmState {
    isOpen: boolean
    options: ConfirmOptions
    resolve: (value: boolean) => void
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<ConfirmState | null>(null)

    const confirm: ConfirmFn = useCallback((options) => {
        return new Promise(resolve => {
            setState({ isOpen: true, options, resolve })
        })
    }, [])

    const handleConfirm = () => {
        state?.resolve(true)
        setState(null)
    }

    const handleCancel = () => {
        state?.resolve(false)
        setState(null)
    }

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {state?.isOpen && (
                <div className="confirm-overlay" onClick={handleCancel}>
                    <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                        <div className={`confirm-icon-wrap ${state.options.danger !== false ? 'danger' : 'info'}`}>
                            {state.options.danger !== false ? <FaTrash /> : <FaExclamationTriangle />}
                        </div>
                        <h3 className="confirm-title">
                            {state.options.title ?? (state.options.danger !== false ? "O'chirish" : 'Tasdiqlash')}
                        </h3>
                        <p className="confirm-message">{state.options.message}</p>
                        <div className="confirm-actions">
                            <button className="btn-secondary confirm-cancel" onClick={handleCancel}>
                                {state.options.cancelText ?? 'Bekor qilish'}
                            </button>
                            <button
                                className={`confirm-ok ${state.options.danger !== false ? 'btn-danger' : 'btn-primary'}`}
                                onClick={handleConfirm}
                            >
                                {state.options.confirmText ?? (state.options.danger !== false ? "O'chirish" : 'Tasdiqlash')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    )
}

export const useConfirm = (): ConfirmFn => useContext(ConfirmContext)
