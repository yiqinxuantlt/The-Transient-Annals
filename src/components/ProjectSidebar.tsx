import clsx from 'clsx'
import { BookOpen, FolderOpen, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useFushengluStore } from '../store/useFushengluStore'
import { getProjectTemplate, templateNavItems } from '../templates/projectTemplates'
import type { ProjectTemplateId } from '../types'

type Props = {
  projectId: string
  templateId: ProjectTemplateId
}

export default function ProjectSidebar({ projectId, templateId }: Props) {
  const collapsed = useFushengluStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useFushengluStore((state) => state.toggleSidebar)
  const template = getProjectTemplate(templateId)

  return (
    <aside
      className={clsx(
        'ink-sidebar border-b border-[rgba(247,240,223,.14)] text-[rgb(247_240_223)] transition-[width] duration-300 lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r',
        collapsed ? 'lg:w-[5.5rem]' : 'lg:w-72',
      )}
    >
      <div className="relative z-10 flex h-full flex-col">
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
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[rgba(247,240,223,.24)] bg-[rgba(247,240,223,.08)] shadow-soft">
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
          <p
            className={clsx(
              'mt-3 text-xs leading-5 text-[rgba(247,240,223,.58)]',
              collapsed && 'lg:hidden',
            )}
          >
            {template.name} · 案卷管理工作台
          </p>
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
          {templateNavItems.map((item) => {
            const Icon = item.icon
            const label = template.nav[item.key]

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
                title={label}
                aria-label={label}
              >
                <Icon size={18} />
                <span className={clsx('whitespace-nowrap', collapsed && 'lg:hidden')}>{label}</span>
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
              {collapsed ? (
                <BookOpen size={17} />
              ) : (
                `${template.shortName}会自动保存布局、节点与线索，便于持续整理。`
              )}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  )
}
