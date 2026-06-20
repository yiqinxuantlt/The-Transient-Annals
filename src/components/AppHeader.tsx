import { FolderKanban } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

const logoUrl = `${import.meta.env.BASE_URL}fushenglu-logo.png`

export default function AppHeader() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <Link to="/" className="flex items-center gap-3" aria-label="返回浮生录首页">
        <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-goldline/45 bg-paper-50 shadow-soft">
          <img
            src={logoUrl}
            alt="浮生录"
            className="h-full w-full object-cover"
            width="48"
            height="48"
          />
        </span>
        <span>
          <span className="block font-calligraphy text-2xl text-ink-900 tracking-wide">浮生录</span>
          <span className="hidden text-xs text-ink-500 sm:block">人物 · 事件 · 图谱 · 时间线</span>
        </span>
      </Link>
      <nav className="flex items-center gap-2 text-sm text-ink-700">
        <ThemeToggle />
        <NavLink
          to="/projects"
          className={({ isActive }) =>
            [
              'inline-flex min-h-11 items-center gap-2 rounded-lg px-4 transition',
              isActive ? 'bg-ink-900 text-paper-50' : 'bg-paper-50/70 hover:bg-paper-50',
            ].join(' ')
          }
        >
          <FolderKanban size={17} />
          图谱项目
        </NavLink>
      </nav>
    </header>
  )
}
