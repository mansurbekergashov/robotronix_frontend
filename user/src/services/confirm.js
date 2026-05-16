/**
 * showConfirm({ message, title?, confirmText?, cancelText?, danger? })
 * Returns Promise<boolean>
 */
export default function showConfirm({
    message,
    title,
    confirmText = 'Tasdiqlash',
    cancelText  = 'Bekor qilish',
    danger      = false,
} = {}) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div')
        overlay.className = 'confirm-overlay'

        const icon = danger
            ? '<i class="fas fa-trash confirm-icon-danger"></i>'
            : '<i class="fas fa-exclamation-triangle confirm-icon-warn"></i>'

        overlay.innerHTML = `
            <div class="confirm-modal">
                <div class="confirm-icon-wrap ${danger ? 'danger' : 'warn'}">${icon}</div>
                <h3 class="confirm-title">${title ?? (danger ? "O'chirish" : 'Tasdiqlash')}</h3>
                <p class="confirm-message">${message}</p>
                <div class="confirm-actions">
                    <button class="confirm-cancel btn-secondary">${cancelText}</button>
                    <button class="confirm-ok ${danger ? 'btn-danger' : 'btn-primary'}">${confirmText}</button>
                </div>
            </div>
        `

        const close = (result) => {
            overlay.classList.remove('confirm-visible')
            setTimeout(() => overlay.remove(), 250)
            resolve(result)
        }

        overlay.querySelector('.confirm-ok').addEventListener('click', () => close(true))
        overlay.querySelector('.confirm-cancel').addEventListener('click', () => close(false))
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false) })

        document.body.appendChild(overlay)
        requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('confirm-visible')))
    })
}
