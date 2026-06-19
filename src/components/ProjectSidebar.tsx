import clsx from 'clsx'
import { BookOpen, FolderOpen, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useFushengluStore } from '../store/useFushengluStore'
import { getProjectTemplate, templateNavItems } from '../templates/projectTemplates'
import type { ProjectTemplateId } from '../types'

type Props = {
  projectId: string
  templateId: ProjectTemplateId
}

const MIN_WIDTH = 200
const MAX_WIDTH = 400
const COLLAPSED_WIDTH = 88 // 5.5rem ≈ 88px

export default function ProjectSidebar({ projectId, templateId }: Props) {
  const collapsed = useFushengluStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useFushengluStore((state) => state.toggleSidebar)
  const sidebarWidth = useFushengluStore((state) => state.sidebarWidth)
  const setSidebarWidth = useFushengluStore((state) => state.setSidebarWidth)
  const template = getProjectTemplate(templateId)

  const [isDragging, setIsDragging] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (collapsed) return
    setIsDragging(true)
    dragStartX.current = e.clientX
    dragStartWidth.current = sidebarWidth
    e.preventDefault()
  }, [collapsed, sidebarWidth])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    const delta = e.clientX - dragStartX.current
    const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, dragStartWidth.current + delta))
    setSidebarWidth(newWidth)
  }, [isDragging, setSidebarWidth])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const currentWidth = collapsed ? COLLAPSED_WIDTH : sidebarWidth

  return (
    <aside
      ref={sidebarRef}
      style={{ width: currentWidth }}
      className={clsx(
        'ink-sidebar relative border-b border-goldline/15 text-ink-800 shadow-[12px_0_42px_rgb(0_0_0/0.12)] transition-[width] duration-300 lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r',
        isDragging && 'transition-none',
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
              'flex items-center gap-3',
              collapsed && 'lg:justify-center',
            )}
            title="浮生录"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-goldline/30 bg-paper-50/80 shadow-soft">
              <img
                src="/fushenglu-logo.png"
                alt="浮生录"
                className="h-full w-full object-cover"
                width="48"
                height="48"
              />
            </span>
            <span className={clsx('whitespace-nowrap font-calligraphy text-3xl tracking-wide text-ink-900', collapsed && 'lg:hidden')}>浮生录</span>
          </Link>
          <p
            className={clsx(
              'mt-3 text-xs leading-5 text-ink-500',
              collapsed && 'lg:hidden',
            )}
          >
            {template.name} · 案卷管理工作台
          </p>
          <div className={clsx('flex items-center gap-2', collapsed ? 'lg:flex-col' : 'lg:mt-5')}>
            <Link
              to="/projects"
              className={clsx(
                'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-goldline/25 bg-paper-50/60 px-3 text-xs text-ink-700 transition-all duration-200 hover:border-goldline/45 hover:bg-paper-50 hover:text-ink-900 hover:shadow-soft',
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
              className="hidden h-10 w-10 items-center justify-center rounded-lg border border-goldline/25 bg-paper-50/60 text-ink-700 transition-all duration-200 hover:border-goldline/45 hover:bg-paper-50 hover:text-ink-900 hover:shadow-soft lg:inline-flex"
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
                    'group relative inline-flex min-h-11 shrink-0 items-center gap-3 overflow-hidden rounded-lg border px-3 text-sm transition-all duration-200',
                    collapsed && 'lg:w-12 lg:justify-center lg:px-0',
                    isActive
                      ? 'border-transparent text-cinnabar font-semibold shadow-[inset_3px_0_0_rgb(var(--cinnabar))]'
                      : 'border-ink-900/6 bg-ink-900/[0.02] text-ink-600 hover:border-goldline/30 hover:bg-goldline/5 hover:text-ink-800 hover:shadow-soft',
                  )
                }
                title={label}
                aria-label={label}
              >
                <Icon size={18} className={clsx('transition-colors duration-200', 'group-[.text-cinnabar]:text-cinnabar')} />
                <span className={clsx('whitespace-nowrap', collapsed && 'lg:hidden')}>{label}</span>
              </NavLink>
            )
          })}
          <div className={clsx('mt-auto hidden px-1 pt-4 lg:block', collapsed && 'lg:px-0')}>
            <div
              className={clsx(
                'rounded-lg border border-goldline/15 bg-paper-100/50 p-3 text-xs leading-5 text-ink-500',
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

      {/* 拖拽手柄 */}
      {!collapsed && (
        <div
          className={clsx(
            'absolute right-0 top-0 bottom-0 z-50 w-1 cursor-col-resize transition-colors duration-200',
            'hover:bg-cinnabar/40 active:bg-cinnabar/60',
            isDragging && 'bg-cinnabar/50',
          )}
          onMouseDown={handleMouseDown}
          title="拖拽调整宽度"
        />
      )}
    </aside>
  )
}
