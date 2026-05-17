import { useEffect, useRef } from 'react'

const DRONES = [
  { id: 1, top: '10vh', left: '86%', size: 96,  parallax: 0.11, dur: '4.4s', delay: '0s',    opacity: 0.52, tx: 13,  ty: -8  },
  { id: 2, top: '40vh', left: '3%',  size: 64,  parallax: 0.07, dur: '5.8s', delay: '-2.2s', opacity: 0.30, tx: 18,  ty: 7   },
  { id: 3, top: '66vh', left: '80%', size: 50,  parallax: 0.14, dur: '4.0s', delay: '-1.5s', opacity: 0.22, tx: 15,  ty: -12 },
  { id: 4, top: '82vh', left: '16%', size: 38,  parallax: 0.05, dur: '6.4s', delay: '-3.8s', opacity: 0.14, tx: 20,  ty: 5   },
]

/* ── Unique gradient IDs per instance ── */
let _uid = 0
function uid() { return ++_uid }

function DroneSVG() {
  const id = useRef(uid()).current
  const bg = `drBG${id}`, inn = `drIN${id}`, mot = `drMT${id}`,
        cam = `drCM${id}`, arm = `drAM${id}`

  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Body top-face radial: lit top-left */}
        <radialGradient id={bg} cx="32%" cy="26%" r="68%">
          <stop offset="0%"   stopColor="#5a8be8"/>
          <stop offset="55%"  stopColor="#214291"/>
          <stop offset="100%" stopColor="#0b1535"/>
        </radialGradient>
        {/* Inner panel */}
        <radialGradient id={inn} cx="38%" cy="30%" r="62%">
          <stop offset="0%"   stopColor="#2c56b0"/>
          <stop offset="100%" stopColor="#09112e"/>
        </radialGradient>
        {/* Motor */}
        <radialGradient id={mot} cx="30%" cy="25%" r="70%">
          <stop offset="0%"   stopColor="#6a92d8"/>
          <stop offset="100%" stopColor="#14213f"/>
        </radialGradient>
        {/* Camera lens */}
        <radialGradient id={cam} cx="38%" cy="32%" r="60%">
          <stop offset="0%"   stopColor="#72aeff"/>
          <stop offset="100%" stopColor="#0e2060"/>
        </radialGradient>
        {/* Arm cylinder gradient */}
        <linearGradient id={arm} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#4070d4"/>
          <stop offset="50%"  stopColor="#214291"/>
          <stop offset="100%" stopColor="#0a1740"/>
        </linearGradient>
      </defs>

      {/* ── Arms (cylindrical gradient) ── */}
      <line x1="60" y1="60" x2="18"  y2="18"  stroke={`url(#${arm})`} strokeWidth="4.5" strokeLinecap="round"/>
      <line x1="60" y1="60" x2="102" y2="18"  stroke={`url(#${arm})`} strokeWidth="4.5" strokeLinecap="round"/>
      <line x1="60" y1="60" x2="18"  y2="102" stroke={`url(#${arm})`} strokeWidth="4.5" strokeLinecap="round"/>
      <line x1="60" y1="60" x2="102" y2="102" stroke={`url(#${arm})`} strokeWidth="4.5" strokeLinecap="round"/>

      {/* ── Propeller disc blur ── */}
      <circle cx="18"  cy="18"  r="17" fill="#214291" opacity="0.08"/>
      <circle cx="102" cy="18"  r="17" fill="#214291" opacity="0.08"/>
      <circle cx="18"  cy="102" r="17" fill="#214291" opacity="0.08"/>
      <circle cx="102" cy="102" r="17" fill="#214291" opacity="0.08"/>

      {/* ── Motor housings (gradient + rim highlight) ── */}
      <circle cx="18"  cy="18"  r="10" fill={`url(#${mot})`} stroke="#4a7fd4" strokeWidth="1"/>
      <circle cx="102" cy="18"  r="10" fill={`url(#${mot})`} stroke="#4a7fd4" strokeWidth="1"/>
      <circle cx="18"  cy="102" r="10" fill={`url(#${mot})`} stroke="#4a7fd4" strokeWidth="1"/>
      <circle cx="102" cy="102" r="10" fill={`url(#${mot})`} stroke="#4a7fd4" strokeWidth="1"/>
      {/* Motor specular highlights */}
      <ellipse cx="14.5" cy="15" rx="4" ry="2" fill="white" opacity="0.22" transform="rotate(-35,14.5,15)"/>
      <ellipse cx="98"   cy="15" rx="4" ry="2" fill="white" opacity="0.22" transform="rotate(35,98,15)"/>
      <ellipse cx="14.5" cy="99" rx="4" ry="2" fill="white" opacity="0.22" transform="rotate(35,14.5,99)"/>
      <ellipse cx="98"   cy="99" rx="4" ry="2" fill="white" opacity="0.22" transform="rotate(-35,98,99)"/>

      {/* ── Spinning propellers ── */}
      <g className="dp dp--tl"><ellipse cx="18"  cy="18"  rx="15" ry="2" fill="#7ab0ff" opacity="0.85"/></g>
      <g className="dp dp--tr"><ellipse cx="102" cy="18"  rx="15" ry="2" fill="#7ab0ff" opacity="0.85"/></g>
      <g className="dp dp--bl"><ellipse cx="18"  cy="102" rx="15" ry="2" fill="#7ab0ff" opacity="0.85"/></g>
      <g className="dp dp--br"><ellipse cx="102" cy="102" rx="15" ry="2" fill="#7ab0ff" opacity="0.85"/></g>

      {/* ── Body — 3D layers ── */}
      {/* Bottom shadow face */}
      <rect x="42" y="46" width="36" height="36" rx="9" fill="#060e28" opacity="0.35"/>
      {/* Main top face */}
      <rect x="40" y="40" width="36" height="36" rx="9" fill={`url(#${bg})`}/>
      {/* Inner panel */}
      <rect x="46" y="46" width="24" height="24" rx="6" fill={`url(#${inn})`}/>
      {/* Top-face specular strip */}
      <ellipse cx="51" cy="44" rx="10" ry="3.5" fill="white" opacity="0.13" transform="rotate(-18,51,44)"/>
      {/* Side face illusion (right + bottom) */}
      <rect x="76" y="44" width="4"  height="32" rx="2" fill="#0b1736" opacity="0.45"/>
      <rect x="44" y="76" width="32" height="4"  rx="2" fill="#0b1736" opacity="0.35"/>

      {/* ── Camera gimbal ── */}
      <circle cx="60" cy="73" r="8.5" fill="#0a1020" stroke="#3a6acc" strokeWidth="1.2"/>
      <circle cx="60" cy="73" r="5.5" fill={`url(#${cam})`}/>
      <circle cx="60" cy="73" r="2.5" fill="#1450cc"/>
      {/* Lens flare */}
      <circle cx="57.5" cy="70.5" r="1.3" fill="white" opacity="0.5"/>

      {/* ── Antenna ── */}
      <line x1="60" y1="40" x2="60" y2="31" stroke="#4a7fd4" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="60" cy="30" r="2.5" fill="#5af0b0" className="drone-led-g"/>

      {/* ── LEDs ── */}
      <circle cx="18"  cy="18"  r="3.5" fill="#00e676" className="drone-led-g"/>
      <circle cx="102" cy="102" r="3.5" fill="#ff5252" className="drone-led-r"/>

      {/* ── Ground shadow ── */}
      <ellipse cx="60" cy="108" rx="26" ry="3.5" fill="#214291" opacity="0.09"/>
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
          {/* 3D tilt wrapper (static perspective) */}
          <div
            className="drone-3d"
            style={{
              '--tx': `${d.tx}deg`,
              '--ty': `${d.ty}deg`,
              width: d.size,
              height: d.size,
            }}
          >
            {/* Float animation wrapper */}
            <div
              className="drone-float"
              style={{ animationDuration: d.dur, animationDelay: d.delay }}
            >
              <DroneSVG />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
