import { useEffect, useRef } from 'react'

const DRONES = [
  { id: 1, top: '10vh', left: '88%', size: 92,  parallax: 0.11, dur: '4.2s', delay: '0s',    opacity: 0.48 },
  { id: 2, top: '40vh', left: '3%',  size: 62,  parallax: 0.07, dur: '5.6s', delay: '-2.1s', opacity: 0.28 },
  { id: 3, top: '65vh', left: '82%', size: 48,  parallax: 0.14, dur: '3.9s', delay: '-1.4s', opacity: 0.20 },
  { id: 4, top: '80vh', left: '18%', size: 38,  parallax: 0.05, dur: '6.2s', delay: '-3.5s', opacity: 0.14 },
]

function DroneSVG() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* ── Arms ── */}
      <line x1="60" y1="60" x2="18" y2="18" stroke="#214291" strokeWidth="3"   strokeLinecap="round"/>
      <line x1="60" y1="60" x2="102" y2="18" stroke="#214291" strokeWidth="3"  strokeLinecap="round"/>
      <line x1="60" y1="60" x2="18" y2="102" stroke="#214291" strokeWidth="3"  strokeLinecap="round"/>
      <line x1="60" y1="60" x2="102" y2="102" stroke="#214291" strokeWidth="3" strokeLinecap="round"/>

      {/* ── Propeller disc blur ── */}
      <circle cx="18"  cy="18"  r="16" fill="#214291" opacity="0.07"/>
      <circle cx="102" cy="18"  r="16" fill="#214291" opacity="0.07"/>
      <circle cx="18"  cy="102" r="16" fill="#214291" opacity="0.07"/>
      <circle cx="102" cy="102" r="16" fill="#214291" opacity="0.07"/>

      {/* ── Motor housings ── */}
      <circle cx="18"  cy="18"  r="9" fill="#1e2a4a" stroke="#3557cc" strokeWidth="1.5"/>
      <circle cx="102" cy="18"  r="9" fill="#1e2a4a" stroke="#3557cc" strokeWidth="1.5"/>
      <circle cx="18"  cy="102" r="9" fill="#1e2a4a" stroke="#3557cc" strokeWidth="1.5"/>
      <circle cx="102" cy="102" r="9" fill="#1e2a4a" stroke="#3557cc" strokeWidth="1.5"/>

      {/* ── Spinning propellers ── */}
      <g className="dp dp--tl"><ellipse cx="18"  cy="18"  rx="15" ry="2.5" fill="#4a7fd4" opacity="0.85"/></g>
      <g className="dp dp--tr"><ellipse cx="102" cy="18"  rx="15" ry="2.5" fill="#4a7fd4" opacity="0.85"/></g>
      <g className="dp dp--bl"><ellipse cx="18"  cy="102" rx="15" ry="2.5" fill="#4a7fd4" opacity="0.85"/></g>
      <g className="dp dp--br"><ellipse cx="102" cy="102" rx="15" ry="2.5" fill="#4a7fd4" opacity="0.85"/></g>

      {/* ── Body ── */}
      <rect x="42" y="42" width="36" height="36" rx="8" fill="#214291"/>
      <rect x="47" y="47" width="26" height="26" rx="6" fill="#1a2a5e"/>

      {/* ── Camera gimbal ── */}
      <circle cx="60" cy="72" r="7.5" fill="#0d1526" stroke="#3557cc" strokeWidth="1"/>
      <circle cx="60" cy="72" r="4.5" fill="#214291"/>
      <circle cx="60" cy="72" r="2"   fill="#82b4ff"/>

      {/* ── Antenna ── */}
      <line x1="60" y1="42" x2="60" y2="34" stroke="#3557cc" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="60" cy="33" r="2" fill="#4a9ff5" className="drone-led-g"/>

      {/* ── LEDs ── */}
      <circle cx="18"  cy="18"  r="3.5" fill="#00e676" className="drone-led-g"/>
      <circle cx="102" cy="102" r="3.5" fill="#ff5252" className="drone-led-r"/>
    </svg>
  )
}

export default function DroneBackground() {
  const refs = useRef([])

  useEffect(() => {
    let rafId
    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const sy = window.scrollY
        DRONES.forEach((d, i) => {
          const el = refs.current[i]
          if (el) el.style.transform = `translateY(${-sy * d.parallax}px)`
        })
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div className="drone-bg" aria-hidden="true">
      {DRONES.map((d, i) => (
        <div
          key={d.id}
          ref={el => (refs.current[i] = el)}
          className="drone-parallax"
          style={{ top: d.top, left: d.left, opacity: d.opacity }}
        >
          <div
            className="drone-float"
            style={{ width: d.size, height: d.size, animationDuration: d.dur, animationDelay: d.delay }}
          >
            <DroneSVG />
          </div>
        </div>
      ))}
    </div>
  )
}
