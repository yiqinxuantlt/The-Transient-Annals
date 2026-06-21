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
const COLLAPSED_WIDTH = 72
const logoUrl = `${import.meta.env.BASE_URL}fushenglu-logo.png`

/* ── Grouped nav keys ── */
const mainGroupKeys = ['dashboard', 'entities', 'events', 'timeline']
const graphGroupKeys = ['relationGraph', 'eventGraph']
const utilGroupKeys = ['library', 'help', 'settings']

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

  const renderNavItem = (item: (typeof templateNavItems)[number]) => {
    const Icon = item.icon
    const label = template.nav[item.key as keyof typeof template.nav]

    return (
      <NavLink
        key={item.to}
        to={`/projects/${projectId}/${item.to}`}
        className={({ isActive }) =>
          clsx(
            'group relative flex min-h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-[0.8125rem] leading-5 transition-all duration-150',
            collapsed ? 'lg:w-11 lg:justify-center lg:px-0' : 'w-full',
            isActive
              ? 'bg-cinnabar/[0.08] font-semibold text-cinnabar shadow-[inset_3px_0_0_rgb(var(--cinnabar)/0.7)] dark:bg-cinnabar/[0.12]'
              : 'text-ink-600 hover:bg-paper-100 hover:text-ink-800 dark:hover:bg-paper-200',
          )
        }
        title={label}
        aria-label={label}
      >
        <Icon
          size={17}
          className={clsx(
            'shrink-0 transition-colors duration-150',
            'group-[.text-cinnabar]:text-cinnabar',
          )}
        />
        <span className={clsx('whitespace-nowrap', collapsed && 'lg:hidden')}>
          {label}
        </span>
      </NavLink>
    )
  }

  const renderSectionLabel = (text: string) =>
    !collapsed ? (
      <div className="hidden px-3 pt-5 pb-1.5 lg:block">
        <span className="text-[0.625rem] font-medium uppercase tracking-[0.14em] text-ink-500/60">
          {text}
        </span>
      </div>
    ) : null

  return (
    <aside
      ref={sidebarRef}
      style={{ width: currentWidth }}
      className={clsx(
        'relative border-r border-ink-900/[0.06] bg-paper-50 text-ink-800 transition-[width] duration-300 dark:border-ink-900/[0.15] lg:sticky lg:top-0 lg:h-dvh',
        isDragging && 'transition-none',
      )}
    >
      <div className="relative z-10 flex h-full flex-col">
        {/* ── Header ── */}
        <div
          className={clsx(
            'flex-shrink-0 border-b border-ink-900/[0.06] px-4 pt-5 pb-4 dark:border-ink-900/[0.12] lg:px-5',
            collapsed && 'lg:px-3',
          )}
        >
          {/* Logo + Title */}
          <Link
            to="/"
            className={clsx(
              'flex items-center gap-3',
              collapsed ? 'lg:justify-center' : '',
            )}
            title="浮生录"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink-900/[0.08] bg-paper-100 shadow-sm dark:border-ink-900/[0.15] dark:bg-paper-200">
              <img
                src={logoUrl}
                alt="浮生录"
                className="h-full w-full object-cover"
                width="40"
                height="40"
              />
            </span>
            <div className={clsx('min-w-0', collapsed && 'lg:hidden')}>
              <span className="block font-calligraphy text-2xl tracking-wide text-ink-900 leading-tight">
                浮生录
              </span>
              <span className="block text-[0.6875rem] leading-4 text-ink-500/80 mt-0.5 truncate">
                {template.name} · 工作台
              </span>
            </div>
          </Link>

          {/* Action buttons */}
          <div className={clsx('flex items-center gap-2 mt-4', collapsed && 'lg:flex-col lg:mt-3')}>
            <Link
              to="/projects"
              className={clsx(
                'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-ink-900/[0.08] bg-paper-100 px-3 text-xs font-medium text-ink-700 transition-all duration-150 hover:border-ink-900/[0.14] hover:bg-paper-50 hover:text-ink-900 active:bg-paper-100 dark:border-ink-900/[0.15] dark:bg-paper-200 dark:hover:bg-paper-100',
                collapsed ? 'lg:w-9 lg:px-0' : 'flex-1',
              )}
              title="返回项目"
              aria-label="返回项目"
            >
              <FolderOpen size={15} />
              <span className={clsx(collapsed && 'lg:hidden')}>返回项目</span>
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden h-9 w-9 items-center justify-center rounded-lg border border-ink-900/[0.08] bg-paper-100 text-ink-500 transition-all duration-150 hover:border-ink-900/[0.14] hover:bg-paper-50 hover:text-ink-700 active:bg-paper-100 dark:border-ink-900/[0.15] dark:bg-paper-200 dark:hover:bg-paper-100 lg:inline-flex"
              aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
              aria-expanded={!collapsed}
              title={collapsed ? '展开侧边栏' : '收起侧边栏'}
            >
              {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </button>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav
          className={clsx(
            'fsl-scrollbar flex-1 overflow-x-auto overflow-y-auto px-3 py-2 lg:px-3',
            collapsed && 'lg:flex lg:flex-col lg:items-center lg:overflow-x-visible lg:px-2',
          )}
        >
          {/* Main section */}
          {renderSectionLabel('工作台')}
          <div className={clsx('flex gap-0.5 lg:flex-col', collapsed && 'lg:items-center')}>
            {templateNavItems
              .filter((item) => mainGroupKeys.includes(item.key))
              .map(renderNavItem)}
          </div>

          {/* Graph section */}
          {renderSectionLabel('图谱')}
          <div className={clsx('flex gap-0.5 lg:flex-col', collapsed && 'lg:items-center')}>
            {templateNavItems
              .filter((item) => graphGroupKeys.includes(item.key))
              .map(renderNavItem)}
          </div>

          {/* Utilities section */}
          {renderSectionLabel('工具')}
          <div className={clsx('flex gap-0.5 lg:flex-col', collapsed && 'lg:items-center')}>
            {templateNavItems
              .filter((item) => utilGroupKeys.includes(item.key))
              .map(renderNavItem)}
          </div>

          {/* ── Footer hint ── */}
          <div className={clsx('mt-auto hidden pt-4 pb-2 lg:block', collapsed && 'lg:px-0')}>
            <div
              className={clsx(
                'rounded-lg bg-paper-100/50 p-3 text-[0.6875rem] leading-5 text-ink-500/70 dark:bg-paper-200/30',
                collapsed && 'flex h-10 w-10 items-center justify-center p-0',
              )}
              title="自动保存"
            >
              {collapsed ? (
                <BookOpen size={15} className="text-ink-500/50" />
              ) : (
                <span className="flex items-start gap-2">
                  <BookOpen size={13} className="mt-0.5 shrink-0 text-ink-500/40" />
                  <span>
                    {template.shortName}会自动保存布局、节点与线索，便于持续整理。
                  </span>
                </span>
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
            'hover:bg-cinnabar/30 active:bg-cinnabar/50',
            isDragging && 'bg-cinnabar/40',
          )}
          onMouseDown={handleMouseDown}
          title="拖拽调整宽度"
        />
      )}
    </aside>
  )
}
