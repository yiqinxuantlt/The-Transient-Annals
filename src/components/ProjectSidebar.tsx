import {
  Archive,
  BookOpen,
  FolderOpen,
  GitBranch,
  LayoutDashboard,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Settings,
  UsersRound,
} from 'lucide-react'
import clsx from 'clsx'
import { Link, NavLink } from 'react-router-dom'
import { useFushengluStore } from '../store/useFushengluStore'

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
  const collapsed = useFushengluStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useFushengluStore((state) => state.toggleSidebar)

  return (
    <aside
      className={clsx(
        'border-b border-ink-900/10 bg-[rgb(37_33_27)] text-[rgb(247_240_223)] transition-[width] duration-300 dark:bg-[rgb(14_13_11)] lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r',
        collapsed ? 'lg:w-[5.5rem]' : 'lg:w-64',
      )}
    >
      <div className="flex h-full flex-col">
        <div
          className={clsx(
            'flex items-center justify-between gap-4 px-4 py-4 lg:px-5 lg:py-6',
            collapsed ? 'lg:flex-col lg:gap-3' : 'lg:block',
          )}
        >
          <Link
            to="/"
            className={clsx(
              'flex items-center gap-3 font-serif text-2xl font-semibold',
              collapsed && 'lg:justify-center',
            )}
            title="浮生录"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[rgba(247,240,223,.28)] bg-[rgba(247,240,223,.08)] shadow-soft">
              <img
                src="/fushenglu-logo.png"
                alt="浮生录"
                className="h-full w-full object-cover"
                width="48"
                height="48"
              />
            </span>
            <span className={clsx('whitespace-nowrap', collapsed && 'lg:hidden')}>浮生录</span>
          </Link>
          <div className={clsx('flex items-center gap-2', collapsed ? 'lg:flex-col' : 'lg:mt-5')}>
            <Link
              to="/projects"
              className={clsx(
                'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[rgba(247,240,223,.16)] px-3 text-xs text-[rgba(247,240,223,.80)] transition hover:bg-[rgba(247,240,223,.10)]',
                collapsed && 'lg:w-10 lg:px-0',
              )}
              title="返回项目"
              aria-label="返回项目"
            >
              <FolderOpen size={16} />
              <span className={clsx(collapsed && 'lg:hidden')}>返回项目</span>
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden h-10 w-10 items-center justify-center rounded-lg border border-[rgba(247,240,223,.16)] text-[rgba(247,240,223,.80)] transition hover:bg-[rgba(247,240,223,.10)] lg:inline-flex"
              aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
              aria-expanded={!collapsed}
              title={collapsed ? '展开侧边栏' : '收起侧边栏'}
            >
              {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </button>
          </div>
        </div>
        <nav
          className={clsx(
            'fsl-scrollbar flex gap-2 overflow-x-auto px-3 pb-4 lg:flex-1 lg:flex-col lg:overflow-x-visible lg:px-4 lg:pb-6',
            collapsed && 'lg:items-center',
          )}
        >
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={`/projects/${projectId}/${item.to}`}
                className={({ isActive }) =>
                  clsx(
                    'inline-flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm transition',
                    collapsed && 'lg:w-12 lg:justify-center lg:px-0',
                    isActive
                      ? 'bg-paper-50 text-ink-900 shadow-soft'
                      : 'text-[rgba(247,240,223,.72)] hover:bg-[rgba(247,240,223,.10)] hover:text-[rgb(255,253,246)]',
                  )
                }
                title={item.label}
                aria-label={item.label}
              >
                <Icon size={18} />
                <span className={clsx('whitespace-nowrap', collapsed && 'lg:hidden')}>
                  {item.label}
                </span>
              </NavLink>
            )
          })}
          <div className={clsx('mt-auto hidden px-1 pt-4 lg:block', collapsed && 'lg:px-0')}>
            <div
              className={clsx(
                'rounded-lg border border-[rgba(247,240,223,.12)] bg-[rgba(247,240,223,.06)] p-3 text-xs leading-5 text-[rgba(247,240,223,.64)]',
                collapsed && 'flex h-12 w-12 items-center justify-center p-0',
              )}
              title="案卷工作台"
            >
              {collapsed ? <BookOpen size={17} /> : '案卷工作台会自动保存布局、节点与线索。'}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  )
}
