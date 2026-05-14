import { useState, useEffect } from 'react'

const Preloader = () => {
    const [isVisible, setIsVisible] = useState(true)
    const [opacity, setOpacity] = useState(1)

    useEffect(() => {
        const hasShown = sessionStorage.getItem('preloaderShown')
        if (hasShown) {
            setIsVisible(false)
            return
        }

        // Only show once per session, and hide as soon as possible
        // We keep a small 100ms delay just to let the DOM settle, but remove the 800ms wait
        const timer = setTimeout(() => {
            setOpacity(0)
            setTimeout(() => {
                setIsVisible(false)
                sessionStorage.setItem('preloaderShown', 'true')
            }, 300)
        }, 100)

        return () => clearTimeout(timer)
    }, [])

    if (!isVisible) return null

    return (
        <div
            id="preloader"
            style={{ opacity, transition: 'opacity 0.5s ease' }}
        >
            <div className="robot-loader">
                <div className="robot-head">
                    <div className="robot-eye left"></div>
                    <div className="robot-eye right"></div>
                </div>
                <div className="loading-text">Yuklanmoqda...</div>
            </div>
        </div>
    )
}

export default Preloader
