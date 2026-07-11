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
          <path d="M4 6h4l9 12h3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 18h4l2.5-3.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.5 7.3 17 4h3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m17 8 3-4-3-4" transform="translate(0 4)" strokeLinecap="round" strokeLinejoin="round" />
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
  const activeIndex = TABS.findIndex((t) => t.id === active)

  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      <div
        className="bottom-nav-indicator"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />
      {TABS.map((tab) => (
        <button
          key={tab.id}
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
