import {
  Archive,
  GitBranch,
  LayoutDashboard,
  Network,
  ScrollText,
  Settings,
  UsersRound,
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { to: 'dashboard', label: '总览', icon: LayoutDashboard },
  { to: 'entities', label: '人物志', icon: UsersRound },
  { to: 'events', label: '事件簿', icon: ScrollText },
  { to: 'timeline', label: '流年轴', icon: GitBranch },
  { to: 'relation-graph', label: '群像图', icon: Network },
  { to: 'event-graph', label: '因果图', icon: GitBranch },
  { to: 'library', label: '藏卷', icon: Archive },
  { to: 'settings', label: '设置', icon: Settings },
]

type Props = {
  projectId: string
}

export default function ProjectSidebar({ projectId }: Props) {
  return (
    <aside className="border-b border-ink-900/10 bg-[rgb(37_33_27)] text-[rgb(247_240_223)] dark:bg-[rgb(14_13_11)] lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 px-4 py-4 lg:block lg:px-5 lg:py-6">
          <Link to="/" className="flex items-center gap-3 font-serif text-2xl font-semibold">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[rgba(247,240,223,.28)] bg-[rgba(247,240,223,.08)] shadow-soft">
              <img
                src="/fushenglu-logo.png"
                alt="浮生录"
                className="h-full w-full object-cover"
                width="48"
                height="48"
              />
            </span>
            <span>浮生录</span>
          </Link>
          <Link
            to="/projects"
            className="rounded-lg border border-[rgba(247,240,223,.16)] px-3 py-2 text-xs text-[rgba(247,240,223,.80)] transition hover:bg-[rgba(247,240,223,.10)] lg:mt-5 lg:inline-flex"
          >
            返回项目
          </Link>
        </div>
        <nav className="fsl-scrollbar flex gap-2 overflow-x-auto px-3 pb-4 lg:flex-1 lg:flex-col lg:overflow-x-visible lg:px-4 lg:pb-6">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={`/projects/${projectId}/${item.to}`}
                className={({ isActive }) =>
                  [
                    'inline-flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm transition',
                    isActive
                      ? 'bg-paper-50 text-ink-900 shadow-soft'
                      : 'text-[rgba(247,240,223,.72)] hover:bg-[rgba(247,240,223,.10)] hover:text-[rgb(255,253,246)]',
                  ].join(' ')
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
