const ICONS = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle',
}

function show(message, type = 'success', duration = 4000) {
    const el = document.createElement('div')
    el.className = `toast toast-${type}`
    el.innerHTML = `<i class="fas ${ICONS[type] ?? ICONS.info}"></i><span>${message}</span>`
    document.body.appendChild(el)

    requestAnimationFrame(() => {
        requestAnimationFrame(() => el.classList.add('show'))
    })

    const remove = () => {
        el.classList.remove('show')
        setTimeout(() => el.remove(), 300)
    }

    const timer = setTimeout(remove, duration)
    el.addEventListener('click', () => { clearTimeout(timer); remove() }, { once: true })
}

const toast = {
    success: (msg) => show(msg, 'success'),
    error:   (msg) => show(msg, 'error'),
    warning: (msg) => show(msg, 'warning'),
    info:    (msg) => show(msg, 'info'),
}

export default toast
