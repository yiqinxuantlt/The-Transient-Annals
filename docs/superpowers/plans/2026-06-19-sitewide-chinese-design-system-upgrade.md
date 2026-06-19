# Sitewide Chinese Design System Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Fushenglu into a unified Chinese paper-archive interface, repair visible mojibake, and keep all current data flows intact.

**Architecture:** First lock text-integrity tests and shared archive UI primitives, then migrate shells and pages in phases. Existing React Router, Zustand, template config, React Flow, and page components remain the behavioral base.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Vitest, React Testing Library, Zustand, React Router, React Flow, Lucide React.

---

## Scope Check

This plan covers one cohesive design-system upgrade, not independent product features. The work is broad, so it is split into staged commits:

1. Text integrity and shared archive primitives.
2. Global shell and routing chrome.
3. People and event record pages.
4. Graph and timeline workspaces.
5. Global project pages, help, library, settings, and QA.

Do not stage `server/data/fushenglu-db.json`. It currently contains runtime node-position changes that belong to the user, not to this UI upgrade.

## File Structure

Create:

- `src/components/archive/ArchiveEmptyState.tsx`: reusable empty state for archive pages.
- `src/components/archive/ArchiveField.tsx`: reusable label/value field for side panels and detail cards.
- `src/components/archive/ArchivePageHeader.tsx`: shared page header with ribbon, seal, title, description, and actions.
- `src/components/archive/ArchiveTag.tsx`: shared tag chip.
- `src/components/archive/ArchiveToolbar.tsx`: shared search/filter/action toolbar wrapper.
- `src/components/archive/SealBadge.tsx`: reusable stamp/seal visual.
- `src/components/archive/ScrollRibbon.tsx`: reusable vertical ribbon visual.
- `src/components/archive/index.ts`: barrel export for archive primitives.
- `src/test/noMojibake.test.ts`: source scan that blocks common mojibake markers in `src`.

Modify:

- `src/index.css`: add archive system utilities and responsive/reduced-motion rules.
- `src/templates/projectTemplates.ts`: repair Chinese labels and keep current template API.
- `src/templates/projectTemplates.test.ts`: assert repaired template strings.
- `src/content/helpContent.ts`: repair help text.
- `src/content/helpContent.test.ts`: assert repaired help titles.
- `src/data/sampleData.ts`: repair shipped seed content if corrupted.
- `src/data/sampleData.test.ts`: assert repaired sample content.
- `src/routes/router.tsx`: repair loading fallback and style it with archive empty state.
- `src/layouts/RootLayout.tsx`: harmonize global shell if visible chrome needs style alignment.
- `src/layouts/ProjectLayout.tsx`: repair project header text and archive styling.
- `src/components/AppHeader.tsx`: repair global header text and style.
- `src/components/ProjectSidebar.tsx`: repair text and convert sidebar into archive book-spine navigation.
- `src/components/AvatarBadge.tsx`: improve Chinese seal/avatar fallback.
- `src/components/EntityCard.tsx`: convert to genealogy-card visual.
- `src/components/EventCard.tsx`: convert to chronicle-card visual.
- `src/components/DetailPanel.tsx`: repair text and use archive fields/tags.
- `src/pages/EntitiesPage.tsx`: implement tool-style genealogy scroll layout.
- `src/pages/EventsPage.tsx`: implement chronicle note layout.
- `src/pages/ProjectDashboard.tsx`: implement archive summary layout.
- `src/pages/LibraryPage.tsx`: implement collection note layout.
- `src/pages/HelpPage.tsx`: implement book-page help layout.
- `src/pages/ProjectSettingsPage.tsx`: implement archive settings layout.
- `src/pages/ProjectsPage.tsx`: repair text and align global project cards.
- `src/pages/TemplateSelectPage.tsx`: repair text and align template cards.
- `src/pages/HomePage.tsx`: light polish only, preserving current first-screen experience.
- `src/components/TemplateCard.tsx`: align template card styling if needed.
- `src/components/GraphWorkbench.tsx`: align workbench panels with archive utilities.
- `src/components/GraphToolbar.tsx`: repair text and align tool buttons.
- `src/components/GraphFilterPanel.tsx`: repair text and align filter panel.
- `src/components/GraphEvidencePanel.tsx`: repair text and align evidence notes.
- `src/components/GraphInspectorPanel.tsx`: repair text and align inspector.
- `src/components/GraphConnectionComposer.tsx`: repair text and align connection composer.
- `src/components/GraphCanvas.tsx`: align node visuals with paper-map language.
- `src/components/EventTimeline.tsx`: align timeline rail, cards, and compact view.

Reference source for repaired Chinese strings:

- `git show e808533:src/templates/projectTemplates.ts`
- `git show e808533:src/content/helpContent.ts`
- `git show e808533:src/pages/EntitiesPage.tsx`
- `git show e808533:src/components/DetailPanel.tsx`
- `git show e808533:src/pages/ProjectDashboard.tsx`

Use those files as string references only. Keep all graph-workbench APIs and props introduced after `e808533`.

---

### Task 1: Add Text Integrity Regression Tests

**Files:**
- Modify: `src/templates/projectTemplates.test.ts`
- Modify: `src/content/helpContent.test.ts`
- Modify: `src/data/sampleData.test.ts`
- Create: `src/test/noMojibake.test.ts`

- [ ] **Step 1: Replace template tests with repaired Chinese expectations**

Replace `src/templates/projectTemplates.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import { projectTemplates, templateNavItems } from './projectTemplates'

describe('projectTemplates', () => {
  it('exposes repaired Chinese labels for the history template', () => {
    expect(projectTemplates.history.name).toBe('历史人物事件')
    expect(projectTemplates.history.shortName).toBe('历史模板')
    expect(projectTemplates.history.nav.entities).toBe('人物志')
    expect(projectTemplates.history.nav.events).toBe('纪事簿')
    expect(projectTemplates.history.nav.help).toBe('使用手册')
    expect(projectTemplates.history.pages.relationGraph.title).toBe('势力图')
    expect(projectTemplates.history.pages.eventGraph.title).toBe('因果图')
    expect(projectTemplates.history.relationTypes).toContain('联盟')
    expect(projectTemplates.history.eventLinkTypes).toContain('奠定基础')
  })

  it('exposes repaired Chinese labels for the fiction template', () => {
    expect(projectTemplates.fiction.name).toBe('小说人物情节')
    expect(projectTemplates.fiction.shortName).toBe('小说模板')
    expect(projectTemplates.fiction.nav.entities).toBe('人物志')
    expect(projectTemplates.fiction.nav.timeline).toBe('流年轴')
    expect(projectTemplates.fiction.pages.relationGraph.title).toBe('群像图')
    expect(projectTemplates.fiction.pages.eventGraph.title).toBe('因果图')
    expect(projectTemplates.fiction.entityTypeLabels.character).toBe('小说角色')
    expect(projectTemplates.fiction.defaultEntityTags).toEqual(['待完善'])
  })

  it('adds a help nav entry alongside the template workspace nav items', () => {
    expect(templateNavItems.some((item) => item.to === 'help' && item.key === 'help')).toBe(true)
  })
})
```

- [ ] **Step 2: Replace help content tests with repaired Chinese expectations**

Replace `src/content/helpContent.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import { helpSections } from './helpContent'

describe('helpSections', () => {
  it('contains the six required manual sections in order', () => {
    expect(helpSections.map((section) => section.id)).toEqual([
      'overview',
      'quick-start',
      'workspace-guide',
      'common-actions',
      'data-and-storage',
      'development-and-troubleshooting',
    ])
  })

  it('uses the approved Chinese section titles', () => {
    expect(helpSections.map((section) => section.title)).toEqual([
      '产品概览',
      '快速开始',
      '工作区页面说明',
      '常用操作',
      '数据与保存',
      '开发说明与常见问题',
    ])
  })

  it('keeps user-facing help copy readable', () => {
    const serialized = JSON.stringify(helpSections)
    expect(serialized).toContain('浮生录用于整理历史、小说、剧本与世界观设定')
    expect(serialized).toContain('新增、编辑和删除人物、事件、关系与资料条目')
    expect(serialized).not.toMatch(/鍘|妗|璇|鈥|锛|鐨|绌|鎼/)
  })
})
```

- [ ] **Step 3: Replace sample data tests with repaired Chinese expectations**

Replace `src/data/sampleData.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import {
  createFictionSampleProject,
  createHistorySampleProject,
  sampleProjects,
} from './sampleData'

describe('sampleData', () => {
  it('ships repaired sample project titles', () => {
    expect(sampleProjects.map((project) => project.title)).toEqual(
      expect.arrayContaining(['浮生录示例案卷', '楚汉旧闻', '星海边境设定']),
    )
  })

  it('ships repaired representative entity and event copy', () => {
    expect(createHistorySampleProject().entities[0]?.name).toBe('刘邦')
    expect(createHistorySampleProject().entities[1]?.name).toBe('项羽')
    expect(createFictionSampleProject().events[0]?.title).toBe('神秘信件出现')
    expect(createFictionSampleProject().libraryItems[0]?.title).toBe('主题札记：身份与选择')
  })

  it('does not serialize replacement characters or common mojibake markers into shipped sample data', () => {
    const serialized = JSON.stringify(sampleProjects)
    expect(serialized).not.toContain('\uFFFD')
    expect(serialized).not.toMatch(/鍘|妗|璇|鈥|锛|鐨|绌|鎼/)
  })
})
```

- [ ] **Step 4: Create a source-level mojibake scan**

Create `src/test/noMojibake.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'

const sourceRoot = join(process.cwd(), 'src')
const scannedExtensions = new Set(['.ts', '.tsx'])
const mojibakePattern = /鍘|妗|璇|鈥|锛|鐨|绌|鎼|瀵|浜虹|鏂板|杩|绾跨|缂栧|浣跨|涓庵|灏忚|鏃堕|鍥犳|鎬昏|鐢熷|闃佃|绫诲|濮撳/

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    const stats = statSync(path)

    if (stats.isDirectory()) {
      return collectSourceFiles(path)
    }

    if (!stats.isFile()) {
      return []
    }

    const extension = path.slice(path.lastIndexOf('.'))
    return scannedExtensions.has(extension) ? [path] : []
  })
}

describe('source text integrity', () => {
  it('does not contain common mojibake markers in source files', () => {
    const offenders = collectSourceFiles(sourceRoot)
      .filter((file) => basename(file) !== 'noMojibake.test.ts')
      .filter((file) => mojibakePattern.test(readFileSync(file, 'utf8')))
      .map((file) => file.replace(`${process.cwd()}\\`, '').replace(`${process.cwd()}/`, ''))

    expect(offenders).toEqual([])
  })
})
```

- [ ] **Step 5: Run the red tests**

Run:

```powershell
npm test -- --run src/templates/projectTemplates.test.ts src/content/helpContent.test.ts src/data/sampleData.test.ts src/test/noMojibake.test.ts
```

Expected: FAIL. The failures should show current mojibake strings such as template names and help titles.

- [ ] **Step 6: Commit the red tests**

Run:

```powershell
git add src/templates/projectTemplates.test.ts src/content/helpContent.test.ts src/data/sampleData.test.ts src/test/noMojibake.test.ts
git commit -m "test: cover chinese text integrity"
```

Do not add `server/data/fushenglu-db.json`.

---

### Task 2: Repair Mojibake in Source Content

**Files:**
- Modify: `src/templates/projectTemplates.ts`
- Modify: `src/content/helpContent.ts`
- Modify: `src/data/sampleData.ts`
- Modify: `src/routes/router.tsx`
- Modify: `src/layouts/ProjectLayout.tsx`
- Modify: `src/components/ProjectSidebar.tsx`
- Modify: `src/pages/ProjectsPage.tsx`
- Modify: `src/pages/TemplateSelectPage.tsx`
- Modify: `src/pages/ProjectDashboard.tsx`
- Modify: `src/pages/EntitiesPage.tsx`
- Modify: `src/components/EntityCard.tsx`
- Modify: `src/components/AvatarBadge.tsx`
- Modify: `src/components/DetailPanel.tsx`
- Modify: graph component files with visible mojibake found by the red scan.

- [ ] **Step 1: Inspect known-good Chinese references**

Run:

```powershell
git show e808533:src/templates/projectTemplates.ts | Select-Object -First 260
git show e808533:src/content/helpContent.ts
git show e808533:src/pages/EntitiesPage.tsx | Select-Object -First 220
git show e808533:src/components/DetailPanel.tsx | Select-Object -First 220
git show e808533:src/pages/ProjectDashboard.tsx | Select-Object -First 80
```

Expected: output contains readable strings such as `历史人物事件`, `小说人物情节`, `人物志`, `产品概览`, `请选择人物、事件、关系或线索`.

- [ ] **Step 2: Repair template configuration without changing its exported types**

In `src/templates/projectTemplates.ts`, replace corrupted user-facing strings using the readable strings from `e808533`. Preserve all current types, imports, `templateNavItems`, `inferTemplateId`, `getProjectTemplate`, `templateOptions`, and `createTemplateBadge`.

Critical expected values after the edit:

```ts
projectTemplates.history.name === '历史人物事件'
projectTemplates.history.shortName === '历史模板'
projectTemplates.history.nav.entities === '人物志'
projectTemplates.history.nav.events === '纪事簿'
projectTemplates.history.nav.timeline === '编年轴'
projectTemplates.history.nav.relationGraph === '势力图'
projectTemplates.history.nav.eventGraph === '因果图'
projectTemplates.history.nav.library === '史料库'
projectTemplates.history.defaultEntityTags[0] === '待考据'
projectTemplates.fiction.name === '小说人物情节'
projectTemplates.fiction.shortName === '小说模板'
projectTemplates.fiction.nav.relationGraph === '群像图'
projectTemplates.fiction.nav.timeline === '流年轴'
projectTemplates.fiction.pages.entities.addLabel === '新增角色'
projectTemplates.fiction.defaultEntityTags[0] === '待完善'
```

- [ ] **Step 3: Repair help content**

In `src/content/helpContent.ts`, replace corrupted user-facing strings with the readable `e808533` content. The six titles must be:

```ts
;[
  '产品概览',
  '快速开始',
  '工作区页面说明',
  '常用操作',
  '数据与保存',
  '开发说明与常见问题',
]
```

The first overview description must include:

```ts
'浮生录用于整理历史、小说、剧本与世界观设定中的人物、事件、关系和资料'
```

- [ ] **Step 4: Repair sample source data**

In `src/data/sampleData.ts`, restore readable sample strings using the known-good project data from `e808533` when needed. Preserve any graph-workbench fields introduced later, including `analysisNotes`, `entityNodePositions`, and `eventNodePositions`.

Critical expected values after the edit:

```ts
createHistorySampleProject().entities[0]?.name === '刘邦'
createHistorySampleProject().entities[1]?.name === '项羽'
createFictionSampleProject().events[0]?.title === '神秘信件出现'
sampleProjects.some((project) => project.title === '星海边境设定') === true
```

- [ ] **Step 5: Repair visible strings in shell and page files**

Use the no-mojibake test output as the exact file list. Repair each file while preserving current behavior. Known required replacements include:

```ts
// src/routes/router.tsx
'正在展开案卷...'

// src/layouts/ProjectLayout.tsx
'当前案卷'
'案卷库已连接'
'连接案卷库'
'本地模式'
'线索'

// src/components/ProjectSidebar.tsx
'浮生录'
'返回项目'
'展开侧边栏'
'收起侧边栏'
'案卷工作台'

// src/pages/ProjectDashboard.tsx
`最近编辑：${new Date(project.updatedAt).toLocaleString('zh-CN')}`

// src/components/EntityCard.tsx
'历史人物'
'小说角色'
'组织'
'地点'
'其他'
'尚未补充档案。'

// src/components/AvatarBadge.tsx
'录'
```

- [ ] **Step 6: Run the text tests again**

Run:

```powershell
npm test -- --run src/templates/projectTemplates.test.ts src/content/helpContent.test.ts src/data/sampleData.test.ts src/test/noMojibake.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run all tests**

Run:

```powershell
npm test
```

Expected: PASS.

- [ ] **Step 8: Commit the repaired Chinese content**

Run:

```powershell
git status -sb
git add src/templates/projectTemplates.ts src/content/helpContent.ts src/data/sampleData.ts src/routes/router.tsx src/layouts/ProjectLayout.tsx src/components/ProjectSidebar.tsx src/pages/ProjectsPage.tsx src/pages/TemplateSelectPage.tsx src/pages/ProjectDashboard.tsx src/pages/EntitiesPage.tsx src/components/EntityCard.tsx src/components/AvatarBadge.tsx src/components/DetailPanel.tsx src/components/GraphToolbar.tsx src/components/GraphFilterPanel.tsx src/components/GraphEvidencePanel.tsx src/components/GraphInspectorPanel.tsx src/components/GraphConnectionComposer.tsx src/test/noMojibake.test.ts src/templates/projectTemplates.test.ts src/content/helpContent.test.ts src/data/sampleData.test.ts
git commit -m "fix: repair chinese interface copy"
```

If a listed graph component was not changed because the scan did not flag it, omit that path from `git add`. Do not add `server/data/fushenglu-db.json`.

---

### Task 3: Add Archive Design Primitives

**Files:**
- Create: `src/components/archive/SealBadge.tsx`
- Create: `src/components/archive/ScrollRibbon.tsx`
- Create: `src/components/archive/ArchiveTag.tsx`
- Create: `src/components/archive/ArchiveField.tsx`
- Create: `src/components/archive/ArchiveEmptyState.tsx`
- Create: `src/components/archive/ArchiveToolbar.tsx`
- Create: `src/components/archive/ArchivePageHeader.tsx`
- Create: `src/components/archive/index.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Create SealBadge**

Create `src/components/archive/SealBadge.tsx`:

```tsx
type Props = {
  children: string
  className?: string
}

export default function SealBadge({ children, className = '' }: Props) {
  return (
    <span
      className={[
        'seal-mark flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border-2 border-cinnabar/55 font-serif text-xs font-semibold leading-4 text-cinnabar/80',
        className,
      ].join(' ')}
      aria-hidden="true"
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 2: Create ScrollRibbon**

Create `src/components/archive/ScrollRibbon.tsx`:

```tsx
type Props = {
  label: string
  className?: string
}

export default function ScrollRibbon({ label, className = '' }: Props) {
  return (
    <span
      className={[
        'archive-ribbon hidden min-h-28 w-16 shrink-0 items-center justify-center rounded-sm border border-cinnabar/25 bg-cinnabar/8 px-2 py-4 font-serif text-sm text-cinnabar/80 md:flex',
        className,
      ].join(' ')}
    >
      <span className="[writing-mode:vertical-rl] tracking-[0.22em]">{label}</span>
    </span>
  )
}
```

- [ ] **Step 3: Create ArchiveTag**

Create `src/components/archive/ArchiveTag.tsx`:

```tsx
import clsx from 'clsx'

type Props = {
  children: string
  tone?: 'gold' | 'jade' | 'cinnabar' | 'ink'
}

const toneClass = {
  gold: 'border-goldline/25 bg-goldline/12 text-ink-700',
  jade: 'border-jade/25 bg-jade/10 text-jade',
  cinnabar: 'border-cinnabar/25 bg-cinnabar/10 text-cinnabar',
  ink: 'border-ink-900/10 bg-ink-900/5 text-ink-700',
}

export default function ArchiveTag({ children, tone = 'gold' }: Props) {
  return (
    <span className={clsx('inline-flex min-h-7 items-center rounded-full border px-3 text-xs', toneClass[tone])}>
      {children}
    </span>
  )
}
```

- [ ] **Step 4: Create ArchiveField**

Create `src/components/archive/ArchiveField.tsx`:

```tsx
import type { ReactNode } from 'react'

type Props = {
  label: string
  value?: ReactNode
  wide?: boolean
}

export default function ArchiveField({ label, value, wide = false }: Props) {
  if (value === undefined || value === null || value === '') return null

  return (
    <div
      className={[
        'archive-field rounded-lg border border-ink-900/8 bg-paper-50/62 p-3',
        wide ? 'md:col-span-2' : '',
      ].join(' ')}
    >
      <p className="text-xs tracking-[0.12em] text-ink-500">{label}</p>
      <div className="mt-1 text-sm leading-6 text-ink-800">{value}</div>
    </div>
  )
}
```

- [ ] **Step 5: Create ArchiveEmptyState**

Create `src/components/archive/ArchiveEmptyState.tsx`:

```tsx
import type { ReactNode } from 'react'

type Props = {
  title: string
  description: string
  action?: ReactNode
}

export default function ArchiveEmptyState({ title, description, action }: Props) {
  return (
    <div className="archive-empty rounded-lg border border-dashed border-goldline/35 bg-paper-100/55 p-6 text-center">
      <p className="font-serif text-xl font-semibold text-ink-900">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-ink-600">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
```

- [ ] **Step 6: Create ArchiveToolbar**

Create `src/components/archive/ArchiveToolbar.tsx`:

```tsx
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function ArchiveToolbar({ children }: Props) {
  return (
    <div className="archive-toolbar mt-5 flex flex-col gap-3 rounded-lg border border-goldline/20 bg-paper-100/48 p-3 shadow-sm md:flex-row md:items-center">
      {children}
    </div>
  )
}
```

- [ ] **Step 7: Create ArchivePageHeader**

Create `src/components/archive/ArchivePageHeader.tsx`:

```tsx
import type { ReactNode } from 'react'
import SealBadge from './SealBadge'
import ScrollRibbon from './ScrollRibbon'

type Props = {
  eyebrow: string
  title: string
  description: string
  ribbonLabel: string
  sealLabel?: string
  actions?: ReactNode
}

export default function ArchivePageHeader({
  eyebrow,
  title,
  description,
  ribbonLabel,
  sealLabel = '浮生',
  actions,
}: Props) {
  return (
    <section className="archive-page-header archive-card paper-grain rounded-lg border border-goldline/25 p-5 shadow-soft md:p-6">
      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <ScrollRibbon label={ribbonLabel} />
          <div className="min-w-0">
            <p className="text-xs tracking-[0.18em] text-cinnabar">{eyebrow}</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight text-ink-900">{title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-700">{description}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {actions}
          <SealBadge>{sealLabel}</SealBadge>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 8: Create archive barrel export**

Create `src/components/archive/index.ts`:

```ts
export { default as ArchiveEmptyState } from './ArchiveEmptyState'
export { default as ArchiveField } from './ArchiveField'
export { default as ArchivePageHeader } from './ArchivePageHeader'
export { default as ArchiveTag } from './ArchiveTag'
export { default as ArchiveToolbar } from './ArchiveToolbar'
export { default as SealBadge } from './SealBadge'
export { default as ScrollRibbon } from './ScrollRibbon'
```

- [ ] **Step 9: Add CSS utilities**

Append to `src/index.css` after `.archive-card` and existing paper utilities:

```css
.archive-ribbon {
  box-shadow:
    inset 0 0 0 1px rgb(var(--paper-50) / 0.48),
    0 12px 32px rgb(var(--shadow-soft) / 0.08);
}

.archive-page-header::after,
.archive-field::after,
.archive-empty::after {
  position: absolute;
  pointer-events: none;
  content: "";
}

.archive-toolbar {
  background-image:
    linear-gradient(90deg, rgb(var(--ink-900) / 0.025) 1px, transparent 1px),
    linear-gradient(180deg, rgb(var(--paper-50) / 0.72), rgb(var(--paper-100) / 0.48));
  background-size: 34px 34px, 100% 100%;
}

.archive-input {
  min-height: 2.75rem;
  border-radius: 0.5rem;
  border: 1px solid rgb(var(--ink-900) / 0.1);
  background: rgb(var(--paper-50) / 0.72);
  padding: 0 0.75rem;
  color: rgb(var(--ink-800));
  outline: none;
}

.archive-input:focus {
  border-color: rgb(var(--goldline) / 0.65);
  box-shadow: 0 0 0 3px rgb(var(--goldline) / 0.12);
}

.archive-primary-button {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  background: rgb(var(--ink-900));
  padding: 0 1.25rem;
  color: rgb(var(--paper-50));
  box-shadow: 0 10px 30px rgb(var(--shadow-soft) / 0.12);
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.archive-primary-button:hover {
  background: rgb(var(--ink-700));
}

.archive-icon-button {
  display: inline-flex;
  height: 2.5rem;
  width: 2.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

- [ ] **Step 10: Run component type check through build**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 11: Commit archive primitives**

Run:

```powershell
git add src/components/archive src/index.css
git commit -m "feat: add archive design primitives"
```

---

### Task 4: Upgrade Global Shell and Navigation

**Files:**
- Modify: `src/routes/router.tsx`
- Modify: `src/layouts/ProjectLayout.tsx`
- Modify: `src/layouts/RootLayout.tsx`
- Modify: `src/components/AppHeader.tsx`
- Modify: `src/components/ProjectSidebar.tsx`

- [ ] **Step 1: Repair and restyle route fallback**

In `src/routes/router.tsx`, import `ArchiveEmptyState`:

```tsx
import { ArchiveEmptyState } from '../components/archive'
```

Replace the Suspense fallback with:

```tsx
<ArchiveEmptyState title="正在展开案卷" description="页面内容正在载入，请稍候。" />
```

- [ ] **Step 2: Upgrade ProjectLayout header copy and classes**

In `src/layouts/ProjectLayout.tsx`, replace corrupted strings with:

```tsx
<p className="text-xs tracking-[0.18em] text-ink-500">当前案卷</p>
```

and:

```tsx
{backendStatus === 'online'
  ? '案卷库已连接'
  : backendStatus === 'checking'
    ? '连接案卷库'
    : '本地模式'}
```

Change the header root class to:

```tsx
className="sticky top-0 z-20 border-b border-goldline/20 bg-paper-50/90 px-4 py-4 shadow-[0_12px_35px_rgb(var(--shadow-soft)/0.08)] backdrop-blur md:px-8"
```

- [ ] **Step 3: Repair and restyle ProjectSidebar**

In `src/components/ProjectSidebar.tsx`, replace corrupted strings with:

```tsx
title="浮生录"
alt="浮生录"
<span className={clsx('whitespace-nowrap', collapsed && 'lg:hidden')}>浮生录</span>
{template.name} · 案卷管理工作台
title="返回项目"
aria-label="返回项目"
<span className={clsx(collapsed && 'lg:hidden')}>返回项目</span>
aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
title={collapsed ? '展开侧边栏' : '收起侧边栏'}
title="案卷工作台"
`${template.shortName}会自动保存布局、节点与线索，便于持续整理。`
```

Keep the existing collapse behavior and `NavLink` active-state logic.

- [ ] **Step 4: Upgrade global AppHeader copy if mojibake scan flags it**

In `src/components/AppHeader.tsx`, ensure the visible subtitle remains:

```tsx
人物 · 事件 · 图谱 · 时间线
```

Keep all links and routes unchanged.

- [ ] **Step 5: Run focused shell tests**

Run:

```powershell
npm test -- --run src/test/noMojibake.test.ts
npm run build
```

Expected: both PASS.

- [ ] **Step 6: Commit shell upgrade**

Run:

```powershell
git add src/routes/router.tsx src/layouts/ProjectLayout.tsx src/layouts/RootLayout.tsx src/components/AppHeader.tsx src/components/ProjectSidebar.tsx src/index.css
git commit -m "feat: upgrade archive shell"
```

If `RootLayout.tsx` or `AppHeader.tsx` had no changes, omit those paths.

---

### Task 5: Upgrade People and Events Pages

**Files:**
- Modify: `src/components/AvatarBadge.tsx`
- Modify: `src/components/EntityCard.tsx`
- Modify: `src/components/EventCard.tsx`
- Modify: `src/components/DetailPanel.tsx`
- Modify: `src/pages/EntitiesPage.tsx`
- Modify: `src/pages/EventsPage.tsx`

- [ ] **Step 1: Upgrade AvatarBadge fallback**

In `src/components/AvatarBadge.tsx`, set the fallback initial to:

```tsx
const initial = entity.name.trim().slice(0, 1) || '录'
```

Add a seal-like class layer to the `span` class list:

```tsx
'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-goldline/35 bg-goldline/14 font-serif font-semibold text-ink-900 shadow-soft ring-1 ring-paper-50/60'
```

- [ ] **Step 2: Upgrade EntityCard to genealogy card**

In `src/components/EntityCard.tsx`, replace mojibake labels with:

```ts
const entityTypeLabel: Record<Entity['type'], string> = {
  person: '历史人物',
  character: '小说角色',
  organization: '组织',
  place: '地点',
  other: '其他',
}
```

Change the article class assembly to:

```tsx
className={[
  'archive-card paper-grain rounded-lg border p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-archive',
  selected ? 'border-cinnabar/50 ring-2 ring-cinnabar/10' : 'border-goldline/18',
].join(' ')}
```

Change the empty description fallback to:

```tsx
{entity.description || entity.identity || '尚未补充档案。'}
```

Change button labels to:

```tsx
aria-label={`编辑 ${entity.name}`}
aria-label={`删除 ${entity.name}`}
```

- [ ] **Step 3: Upgrade EventCard to chronicle card**

In `src/components/EventCard.tsx`, keep behavior and update the article base class:

```tsx
'archive-card paper-grain rounded-lg border p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-archive'
```

Keep the existing readable fallback:

```tsx
{event.description || '尚未补充事件描述。'}
```

- [ ] **Step 4: Upgrade DetailPanel to archive fields**

In `src/components/DetailPanel.tsx`, import:

```tsx
import { ArchiveField, ArchiveTag, SealBadge } from './archive'
```

Replace the local `Tags` implementation with:

```tsx
function Tags({ tags }: { tags: string[] }) {
  if (!tags.length) return null

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <ArchiveTag key={tag}>{tag}</ArchiveTag>
      ))}
    </div>
  )
}
```

Replace `Field` with:

```tsx
function Field({ label, value }: { label: string; value?: string | number }) {
  return <ArchiveField label={label} value={value} />
}
```

Keep the `compactChrome` prop if it exists in the current file.

- [ ] **Step 5: Upgrade EntitiesPage header and toolbar**

In `src/pages/EntitiesPage.tsx`, import:

```tsx
import { ArchivePageHeader, ArchiveToolbar, ArchiveEmptyState } from '../components/archive'
```

Replace the top header block with:

```tsx
<ArchivePageHeader
  eyebrow={template.pages.entities.eyebrow}
  title={template.pages.entities.title}
  description={template.pages.entities.description}
  ribbonLabel={template.id === 'history' ? '人物入谱' : '角色入谱'}
  actions={
    <button type="button" onClick={openCreate} className="archive-primary-button">
      <Plus size={18} />
      {template.pages.entities.addLabel}
    </button>
  }
/>
```

Move the search input into:

```tsx
<ArchiveToolbar>
  <input
    value={query}
    onChange={(event) => setQuery(event.target.value)}
    placeholder={template.pages.entities.search}
    className="archive-input w-full"
  />
</ArchiveToolbar>
```

After the card grid condition, render:

```tsx
{filteredEntities.length === 0 ? (
  <ArchiveEmptyState
    title="暂无匹配人物"
    description={query ? '清空搜索条件后再查看完整人物谱。' : '先新增人物，再补充身份、阵营和关系。'}
  />
) : null}
```

- [ ] **Step 6: Repair EntitiesPage modal copy**

Ensure visible modal strings are:

```tsx
window.alert('请选择图片文件。')
window.alert('头像图片建议小于 900KB，避免占用过多本地存储。')
if (window.confirm(`确认删除「${entity.name}」？相关人物关系也会移除。`)) {
title={editingId ? `编辑${template.entitySingular}档案` : `新增${template.entitySingular}档案`}
submitLabel={editingId ? '保存修改' : `创建${template.entitySingular}`}
<p className="mb-2 text-sm">人物头像</p>
name: draft.name || '人物'
上传图片
移除头像
```

- [ ] **Step 7: Upgrade EventsPage header and toolbar**

In `src/pages/EventsPage.tsx`, import archive primitives:

```tsx
import { ArchivePageHeader, ArchiveToolbar, ArchiveEmptyState } from '../components/archive'
```

Use `ArchivePageHeader` with:

```tsx
ribbonLabel={template.id === 'history' ? '编年札记' : '情节札记'}
```

Use `ArchiveToolbar` and `archive-input` for search.

Render empty state:

```tsx
{filteredEvents.length === 0 ? (
  <ArchiveEmptyState
    title="暂无匹配事件"
    description={query ? '清空搜索条件后再查看完整事件簿。' : '先新增事件，再补充时间、地点和相关人物。'}
  />
) : null}
```

- [ ] **Step 8: Run tests and build**

Run:

```powershell
npm test
npm run build
```

Expected: both PASS.

- [ ] **Step 9: Commit people and events upgrade**

Run:

```powershell
git add src/components/AvatarBadge.tsx src/components/EntityCard.tsx src/components/EventCard.tsx src/components/DetailPanel.tsx src/pages/EntitiesPage.tsx src/pages/EventsPage.tsx
git commit -m "feat: upgrade archive record pages"
```

---

### Task 6: Upgrade Dashboard, Library, Help, Settings, Projects, and Templates

**Files:**
- Modify: `src/pages/ProjectDashboard.tsx`
- Modify: `src/pages/LibraryPage.tsx`
- Modify: `src/pages/HelpPage.tsx`
- Modify: `src/pages/ProjectSettingsPage.tsx`
- Modify: `src/pages/ProjectsPage.tsx`
- Modify: `src/pages/TemplateSelectPage.tsx`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/components/TemplateCard.tsx`

- [ ] **Step 1: Upgrade ProjectDashboard header and stat cards**

In `src/pages/ProjectDashboard.tsx`, import `ArchivePageHeader` and replace the first section with:

```tsx
<ArchivePageHeader
  eyebrow={template.dashboard.eyebrow}
  title={project.title}
  description={project.subtitle}
  ribbonLabel="案卷总览"
  sealLabel="总览"
  actions={
    <p className="text-sm text-ink-500">
      最近编辑：{new Date(project.updatedAt).toLocaleString('zh-CN')}
    </p>
  }
/>
```

Change stat cards to use `archive-card paper-grain`.

- [ ] **Step 2: Upgrade LibraryPage header and cards**

In `src/pages/LibraryPage.tsx`, use `ArchivePageHeader` with:

```tsx
ribbonLabel={template.id === 'history' ? '史料入库' : '藏卷入库'}
sealLabel="藏卷"
```

Use `ArchiveTag` for item tags and `archive-card paper-grain` for library cards.

- [ ] **Step 3: Upgrade ProjectSettingsPage header and side cards**

In `src/pages/ProjectSettingsPage.tsx`, use `ArchivePageHeader`:

```tsx
<ArchivePageHeader
  eyebrow="Settings"
  title="项目设置"
  description="管理当前案卷的基础信息、本地 JSON 导入导出，以及恢复示例数据。"
  ribbonLabel="案卷校订"
  sealLabel="设置"
/>
```

Use `archive-input` for inputs, textareas, and selects where the existing fields are currently styled individually.

- [ ] **Step 4: Repair and upgrade ProjectsPage**

In `src/pages/ProjectsPage.tsx`, set category labels to:

```ts
const categoryLabel: Record<ProjectCategory, string> = {
  history: '历史专题',
  novel: '小说作品',
  script: '剧本项目',
  worldbuilding: '世界观设定',
  research: '研究资料',
}
```

Repair visible strings:

```tsx
<h1 className="mt-2 font-serif text-4xl font-semibold">图谱项目</h1>
使用手册
新建图谱
关系
线索
打开案卷
```

Use `archive-card paper-grain` for project cards.

- [ ] **Step 5: Repair and upgrade TemplateSelectPage**

In `src/pages/TemplateSelectPage.tsx`, repair visible strings:

```tsx
['楚汉人物谱', '晚唐藩镇纪事', '明末辽东战局']
返回项目
项目模板
选择项目模板
不同模板会影响导航名称、表单字段、默认标签、关系类型、事件连接类型和示例数据。
重选模板
创建{template.name}项目
项目名称
项目简介
创建并进入
模板会预设
导航：{Object.values(template.nav).join('、')}
关系类型：{template.relationTypes.slice(0, 5).join('、')}
事件连接：{template.eventLinkTypes.slice(0, 5).join('、')}
项目命名示例
```

Use `archive-card paper-grain` for the main form and side panel.

- [ ] **Step 6: Light-polish HomePage and TemplateCard**

Keep `HomePage` as the app entry screen. Add archive card styling to existing cards and previews without changing routes or page structure:

```tsx
className="archive-card paper-grain rounded-lg border border-goldline/25 bg-paper-50/75 p-4 shadow-archive"
```

Apply the same style direction to `TemplateCard.tsx`.

- [ ] **Step 7: Run tests and build**

Run:

```powershell
npm test
npm run build
```

Expected: both PASS.

- [ ] **Step 8: Commit secondary pages upgrade**

Run:

```powershell
git add src/pages/ProjectDashboard.tsx src/pages/LibraryPage.tsx src/pages/HelpPage.tsx src/pages/ProjectSettingsPage.tsx src/pages/ProjectsPage.tsx src/pages/TemplateSelectPage.tsx src/pages/HomePage.tsx src/components/TemplateCard.tsx
git commit -m "feat: upgrade archive support pages"
```

---

### Task 7: Upgrade Graph and Timeline Surfaces

**Files:**
- Modify: `src/components/GraphWorkbench.tsx`
- Modify: `src/components/GraphToolbar.tsx`
- Modify: `src/components/GraphFilterPanel.tsx`
- Modify: `src/components/GraphEvidencePanel.tsx`
- Modify: `src/components/GraphInspectorPanel.tsx`
- Modify: `src/components/GraphConnectionComposer.tsx`
- Modify: `src/components/GraphCanvas.tsx`
- Modify: `src/components/EventTimeline.tsx`

- [ ] **Step 1: Repair GraphToolbar labels**

In `src/components/GraphToolbar.tsx`, set mode labels to:

```ts
const modeLabels: Array<{ value: GraphWorkMode; label: string }> = [
  { value: 'browse', label: '浏览' },
  { value: 'reasoning', label: '推理' },
  { value: 'organize', label: '整理' },
]
```

Repair button labels:

```tsx
添加连接
自动整理
aria-label="适应视图"
清空筛选
退出聚焦
{immersive ? '退出沉浸' : '沉浸'}
```

- [ ] **Step 2: Upgrade GraphToolbar classes**

Change the segmented control class to:

```tsx
className="inline-flex rounded-lg border border-goldline/30 bg-paper-50/90 p-1 shadow-soft backdrop-blur"
```

Keep existing `graph-tool-button` utility for graph actions.

- [ ] **Step 3: Repair graph panel labels flagged by noMojibake**

Run:

```powershell
npm test -- --run src/test/noMojibake.test.ts
```

For every graph component path listed as an offender, repair visible strings using the intended meanings from component behavior. Known labels include:

```tsx
筛选
图层
证据链
分析札记
详情
样式
清空
保存札记
删除札记
连接说明
```

- [ ] **Step 4: Align GraphWorkbench panels**

In `src/components/GraphWorkbench.tsx`, add `archive-card paper-grain` to outer panel surfaces that currently use plain `bg-paper-50`. Keep current layout, `ReactFlowProvider`, `DetailPanel`, and callbacks unchanged.

Use `ArchiveEmptyState` if the workbench empty state is locally rendered in this file. If the empty state is in a child component, leave behavior in the child and only update classes.

- [ ] **Step 5: Align GraphCanvas node surfaces**

In `src/components/GraphCanvas.tsx`, keep node dimensions stable. Add paper-map classes to entity/event custom nodes without changing handles or node data:

```tsx
'archive-card paper-grain rounded-lg border border-goldline/25 bg-paper-50 px-4 py-3 shadow-soft'
```

Selected nodes must still include a non-color signal:

```tsx
selected ? 'ring-2 ring-cinnabar/20 border-cinnabar/55' : ''
```

- [ ] **Step 6: Align EventTimeline**

In `src/components/EventTimeline.tsx`, preserve central-spine and compact behavior. Add archive card classes to event cards and keep mobile media query behavior in `src/index.css`.

- [ ] **Step 7: Run graph tests and full build**

Run:

```powershell
npm test -- --run src/lib/graphWorkbench.test.ts src/components/GraphEvidencePanel.test.tsx src/components/GraphFilterPanel.test.tsx src/test/noMojibake.test.ts
npm run build
```

Expected: both PASS.

- [ ] **Step 8: Commit graph and timeline upgrade**

Run:

```powershell
git add src/components/GraphWorkbench.tsx src/components/GraphToolbar.tsx src/components/GraphFilterPanel.tsx src/components/GraphEvidencePanel.tsx src/components/GraphInspectorPanel.tsx src/components/GraphConnectionComposer.tsx src/components/GraphCanvas.tsx src/components/EventTimeline.tsx src/index.css
git commit -m "feat: align graph and timeline archive surfaces"
```

---

### Task 8: Final QA, Visual Verification, and Push Readiness

**Files:**
- Modify only files required by QA findings.

- [ ] **Step 1: Confirm user data is still unstaged**

Run:

```powershell
git status -sb
git diff --name-only
```

Expected: if `server/data/fushenglu-db.json` is listed, it remains unstaged unless the user explicitly asked to commit runtime data.

- [ ] **Step 2: Run full validation**

Run:

```powershell
npm test
npm run build
```

Expected: both PASS.

- [ ] **Step 3: Start dev server for visual QA**

Run:

```powershell
npm run dev
```

Expected: Vite prints a local URL, usually `http://localhost:5173/`, and the API server starts in the same command. Keep the server running while checking the browser.

- [ ] **Step 4: Check desktop pages**

Open the app and check:

```text
/
/projects
/projects/new
/projects/project-chuhan/dashboard
/projects/project-chuhan/entities
/projects/project-chuhan/events
/projects/project-chuhan/timeline
/projects/project-chuhan/relation-graph
/projects/project-chuhan/event-graph
/projects/project-chuhan/library
/projects/project-chuhan/help
/projects/project-chuhan/settings
```

Expected:

- No mojibake text.
- No horizontal overflow.
- Header, cards, detail panels, graph tools, and forms share the archive design language.
- Person and event cards remain readable and operable.
- Graph nodes, handles, and edge interactions still work.

- [ ] **Step 5: Check narrow viewport**

Use browser devtools or Playwright to inspect a 375px wide viewport. At minimum check:

```text
/projects/project-chuhan/entities
/projects/project-chuhan/relation-graph
/projects/project-chuhan/settings
```

Expected:

- No overlapping text.
- Buttons remain tappable.
- Sidebar/topbar layout remains usable.
- Graph workbench panels do not cover essential canvas controls.

- [ ] **Step 6: Fix QA findings in small commits**

For each distinct QA issue, make the smallest focused edit and run:

```powershell
npm test -- --run src/test/noMojibake.test.ts
npm run build
```

Expected: both PASS.

Commit each fix with a focused message such as:

```powershell
git add <changed-files>
git commit -m "fix: polish archive mobile layout"
```

- [ ] **Step 7: Final status report**

Run:

```powershell
git log --oneline origin/main..HEAD
git status -sb
```

Expected:

- Local branch contains the implementation commits.
- Only user runtime data remains unstaged if it was present before implementation.

Do not push unless the user asks to push, or the execution request explicitly includes publishing changes.

---

## Self-Review Notes

Spec coverage:

- Text repair is covered by Tasks 1 and 2.
- Shared archive visual language is covered by Task 3.
- Global shell is covered by Task 4.
- People and events pages are covered by Task 5.
- Dashboard, library, help, settings, projects, template selection, and home are covered by Task 6.
- Graph and timeline surfaces are covered by Task 7.
- Desktop, narrow viewport, tests, build, and user-data staging checks are covered by Task 8.

Placeholder scan:

- The plan contains JSX `placeholder` attributes because form inputs need real placeholder text.
- The plan does not contain deferred implementation markers.

Type and path consistency:

- Archive primitives are exported through `src/components/archive/index.ts`.
- Page examples import archive primitives from `../components/archive`.
- Component examples import sibling archive primitives from `./archive`.
- Test commands use existing `npm test` and `npm run build` scripts.
