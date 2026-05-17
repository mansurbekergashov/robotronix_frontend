import { useEffect, useRef } from 'react'

const DRONES = [
  { id: 1, top: '8vh',  left: '84%', size: 116, parallax: 0.11, dur: '4.4s', delay: '0s'    , opacity: 0.50 },
  { id: 2, top: '38vh', left: '2%',  size: 76,  parallax: 0.07, dur: '5.8s', delay: '-2.2s' , opacity: 0.28 },
  { id: 3, top: '64vh', left: '78%', size: 60,  parallax: 0.14, dur: '4.0s', delay: '-1.5s' , opacity: 0.20 },
  { id: 4, top: '80vh', left: '14%', size: 46,  parallax: 0.05, dur: '6.4s', delay: '-3.8s' , opacity: 0.13 },
]

let _uid = 0
function uid() { return ++_uid }

/* Drone drawn in 3/4 perspective: front-right, slightly above */
function DroneSVG() {
  const id  = useRef(uid()).current
  const tg  = `dTG${id}`   // body top surface gradient
  const mg  = `dMG${id}`   // motor radial gradient
  const ag  = `dAG${id}`   // arm linear gradient
  const cg  = `dCG${id}`   // camera lens gradient
  const rg  = `dRG${id}`   // rim/edge gradient

  return (
    <svg viewBox="0 0 200 175" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Body top — lit from front-left */}
        <linearGradient id={tg} x1="68" y1="54" x2="136" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#5c84ec"/>
          <stop offset="50%"  stopColor="#1e3fa4"/>
          <stop offset="100%" stopColor="#091538"/>
        </linearGradient>
        {/* Motor */}
        <radialGradient id={mg} cx="33%" cy="28%" r="68%">
          <stop offset="0%"   stopColor="#5a80dc"/>
          <stop offset="100%" stopColor="#0c1840"/>
        </radialGradient>
        {/* Arm */}
        <linearGradient id={ag} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#3868d0"/>
          <stop offset="100%" stopColor="#091535"/>
        </linearGradient>
        {/* Camera */}
        <radialGradient id={cg} cx="33%" cy="28%" r="62%">
          <stop offset="0%"   stopColor="#52a0ff"/>
          <stop offset="100%" stopColor="#091a54"/>
        </radialGradient>
        {/* Body edge rim */}
        <linearGradient id={rg} x1="68" y1="56" x2="128" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05"/>
        </linearGradient>
      </defs>

      {/* ═══ REAR ARMS (drawn before body so body sits on top) ═══ */}
      <line x1="84"  y1="69" x2="44"  y2="110" stroke={`url(#${ag})`} strokeWidth="5"   strokeLinecap="round"/>
      <line x1="118" y1="69" x2="158" y2="110" stroke={`url(#${ag})`} strokeWidth="5"   strokeLinecap="round"/>

      {/* Rear motor housings */}
      <circle cx="40"  cy="114" r="12" fill={`url(#${mg})`} stroke="#2050a0" strokeWidth="1"/>
      <circle cx="162" cy="114" r="12" fill={`url(#${mg})`} stroke="#2050a0" strokeWidth="1"/>
      <ellipse cx="37"  cy="109" rx="3.5" ry="1.8" fill="white" opacity="0.18" transform="rotate(-20,37,109)"/>
      <ellipse cx="165" cy="109" rx="3.5" ry="1.8" fill="white" opacity="0.18" transform="rotate( 20,165,109)"/>

      {/* Rear propeller discs */}
      <ellipse cx="40"  cy="112" rx="19" ry="4.5" fill="#3a60c0" opacity="0.11" transform="rotate(-4,40,112)"/>
      <g className="dp dp--bl"><ellipse cx="40"  cy="112" rx="17" ry="3" fill="#5888ec" opacity="0.65" transform="rotate(-4,40,112)"/></g>
      <ellipse cx="162" cy="112" rx="19" ry="4.5" fill="#3a60c0" opacity="0.11" transform="rotate( 4,162,112)"/>
      <g className="dp dp--br"><ellipse cx="162" cy="112" rx="17" ry="3" fill="#5888ec" opacity="0.65" transform="rotate( 4,162,112)"/></g>

      {/* ═══ BODY (3-face box: right side + front face + top face) ═══ */}

      {/* Right side face (darker — away from light) */}
      <polygon points="128,56 138,74 138,86 128,68" fill="#0b1840" opacity="0.97"/>
      {/* Front face (medium dark — partially lit) */}
      <polygon points="68,68 128,68 138,86 78,86"   fill="#0e1e4c" opacity="0.92"/>
      {/* Top surface (main — brightest) */}
      <polygon points="68,56 128,56 138,74 78,74"   fill={`url(#${tg})`}/>

      {/* Inner panel grid on top */}
      <polygon points="76,60 122,60 130,70 84,70" fill="none" stroke="#3464c8" strokeWidth="0.7" opacity="0.40"/>
      {/* Specular highlight top-left of top face */}
      <ellipse cx="88" cy="59" rx="18" ry="4.5" fill="white" opacity="0.10" transform="rotate(-10,88,59)"/>
      {/* Rim light along top edge */}
      <line x1="68" y1="56" x2="128" y2="56" stroke={`url(#${rg})`} strokeWidth="1"/>
      {/* Blue status strip */}
      <line x1="94" y1="58.5" x2="112" y2="58.5" stroke="#00c8ff" strokeWidth="1.6" opacity="0.55" strokeLinecap="round"/>

      {/* ═══ FRONT ARMS (drawn after body) ═══ */}
      <line x1="78"  y1="62" x2="34"  y2="24" stroke={`url(#${ag})`} strokeWidth="6"   strokeLinecap="round"/>
      <line x1="120" y1="60" x2="168" y2="24" stroke={`url(#${ag})`} strokeWidth="6"   strokeLinecap="round"/>

      {/* Front motor housings */}
      <circle cx="30"  cy="20" r="15" fill={`url(#${mg})`} stroke="#3060cc" strokeWidth="1.2"/>
      <circle cx="172" cy="20" r="15" fill={`url(#${mg})`} stroke="#3060cc" strokeWidth="1.2"/>
      <ellipse cx="26"  cy="15" rx="5" ry="2.4" fill="white" opacity="0.22" transform="rotate(-30,26,15)"/>
      <ellipse cx="168" cy="15" rx="5" ry="2.4" fill="white" opacity="0.22" transform="rotate( 30,168,15)"/>

      {/* Front propeller discs (larger in front = perspective depth) */}
      <ellipse cx="30"  cy="18" rx="25" ry="6"   fill="#3a60c0" opacity="0.10"/>
      <g className="dp dp--tl"><ellipse cx="30"  cy="18" rx="23" ry="4.5" fill="#7ab0ff" opacity="0.80"/></g>
      <ellipse cx="172" cy="18" rx="25" ry="6"   fill="#3a60c0" opacity="0.10"/>
      <g className="dp dp--tr"><ellipse cx="172" cy="18" rx="23" ry="4.5" fill="#7ab0ff" opacity="0.80"/></g>

      {/* Front LEDs */}
      <circle cx="30"  cy="20" r="3.5" fill="#00e676" className="drone-led-g"/>
      <circle cx="172" cy="20" r="3.5" fill="#ff5252" className="drone-led-r"/>

      {/* ═══ CAMERA GIMBAL ═══ */}
      <rect  x="90" y="82" width="20" height="7" rx="2.5" fill="#060c1e"/>
      <ellipse cx="100" cy="95" rx="13" ry="10" fill="#060c20" stroke="#2448a4" strokeWidth="1"/>
      <circle cx="100" cy="95" r="8"   fill={`url(#${cg})`}/>
      <circle cx="100" cy="95" r="4.5" fill="#091e52"/>
      <circle cx="100" cy="95" r="2.2" fill="#1055dc"/>
      <circle cx="97.5" cy="92.5" r="1.3" fill="white" opacity="0.55"/>

      {/* ═══ LANDING GEAR ═══ */}
      <line x1="80"  y1="86" x2="76"  y2="104" stroke="#162860" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="120" y1="86" x2="124" y2="104" stroke="#162860" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="68"  y1="104" x2="90"  y2="104" stroke="#162860" strokeWidth="2"   strokeLinecap="round"/>
      <line x1="110" y1="104" x2="132" y2="104" stroke="#162860" strokeWidth="2"   strokeLinecap="round"/>

      {/* ═══ ANTENNA ═══ */}
      <line x1="96" y1="56" x2="90" y2="46" stroke="#3565cc" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="90" cy="45" r="2.5" fill="#4af0b0" className="drone-led-g"/>

      {/* ═══ GROUND SHADOW ═══ */}
      <ellipse cx="100" cy="148" rx="44" ry="7" fill="#1a3fa0" opacity="0.06"/>
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
            style={{
              animationDuration: d.dur,
              animationDelay:    d.delay,
              width:  d.size,
              height: Math.round(d.size * 0.875),
            }}
          >
            <DroneSVG />
          </div>
        </div>
      ))}
    </div>
  )
}
