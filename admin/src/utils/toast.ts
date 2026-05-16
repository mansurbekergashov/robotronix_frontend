export type ToastType = 'success' | 'error' | 'info' | 'warning'

export function dispatchToast(type: ToastType, message: string): void {
    window.dispatchEvent(new CustomEvent('robotronix:toast', { detail: { type, message } }))
}
