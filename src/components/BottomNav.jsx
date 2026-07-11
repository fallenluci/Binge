import { useLayoutEffect, useRef, useState } from 'react'
import './BottomNav.css'

const TABS = [
  { id: 'home', icon: 'home', label: 'Главная' },
  { id: 'random', icon: 'random', label: 'Рандом' },
  { id: 'search', icon: 'search', label: 'Поиск' },
  { id: 'add', icon: 'add', label: 'Добавить' },
]

function TabIcon({ id }) {
  switch (id) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 11.5 12 4l8 7.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 10v9h12v-9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'random':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h3.5L16 18h3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 18h3.5l2-2.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.5 8.6 16 6.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m16 6.8 3.5-.1L21 9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m19.5 15 1.5 2.1-1.5 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'search':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-4.3-4.3" strokeLinecap="round" />
        </svg>
      )
    case 'add':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

export default function BottomNav({ active, onChange }) {
  const itemRefs = useRef([])
  const navRef = useRef(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useLayoutEffect(() => {
    function measure() {
      const activeEl = itemRefs.current[TABS.findIndex((t) => t.id === active)]
      const navEl = navRef.current
      if (!activeEl || !navEl) return
      const navRect = navEl.getBoundingClientRect()
      const itemRect = activeEl.getBoundingClientRect()
      setIndicator({
        left: itemRect.left - navRect.left,
        width: itemRect.width,
      })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [active])

  return (
    <nav className="bottom-nav" ref={navRef} aria-label="Основная навигация">
      <div
        className="bottom-nav-indicator"
        style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
      />
      {TABS.map((tab, i) => (
        <button
          key={tab.id}
          ref={(el) => (itemRefs.current[i] = el)}
          className={`bottom-nav-item ${tab.id === active ? 'is-active' : ''}`}
          onClick={() => onChange(tab.id)}
          aria-label={tab.label}
          aria-current={tab.id === active ? 'page' : undefined}
        >
          <TabIcon id={tab.icon} />
        </button>
      ))}
    </nav>
  )
}
