import { Moon, Sun } from 'lucide-react'
import { useFushengluStore } from '../store/useFushengluStore'

export default function ThemeToggle() {
  const theme = useFushengluStore((state) => state.theme)
  const toggleTheme = useFushengluStore((state) => state.toggleTheme)
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-ink-900/10 bg-paper-50/75 px-3 text-sm text-ink-700 shadow-sm transition hover:bg-paper-50 hover:text-ink-900"
      aria-label={isDark ? '切换到浅色模式' : '切换到暗黑模式'}
      title={isDark ? '浅色模式' : '暗黑模式'}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
      <span className="hidden sm:inline">{isDark ? '浅色' : '暗黑'}</span>
    </button>
  )
}
