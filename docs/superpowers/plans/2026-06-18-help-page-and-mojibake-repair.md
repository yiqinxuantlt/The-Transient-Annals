# Help Page and Mojibake Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair all repository-shipped Chinese mojibake and add a standalone help page that is reachable from the projects list and from inside each project workspace.

**Architecture:** Keep product documentation single-sourced in a new `helpContent` module and render it through one reusable `HelpPage` component exposed by both global and project-scoped routes. Repair garbled text at the actual source files that own UI copy, template copy, sample data, and checked-in API data instead of adding a generic recoding tool.

**Tech Stack:** React 19, TypeScript, Vite, React Router, Zustand, Express, Tailwind CSS, Vitest, Testing Library

---

## File Map

- Create: `vitest.config.ts`
  - Minimal test runner config for jsdom-based UI and content regression tests.
- Create: `src/test/setup.ts`
  - Testing Library matcher setup.
- Create: `src/content/helpContent.ts`
  - Structured help-page sections and bullets.
- Create: `src/content/helpContent.test.ts`
  - Regression tests for required help-page sections.
- Create: `src/pages/HelpPage.tsx`
  - Reusable help page component for both `/help` and `/projects/:projectId/help`.
- Create: `src/pages/HelpPage.test.tsx`
  - Smoke test for help-page rendering.
- Create: `src/templates/projectTemplates.test.ts`
  - Regression tests for corrected template labels.
- Create: `src/data/sampleData.test.ts`
  - Regression tests for corrected sample project titles and representative sample records.
- Modify: `package.json`
  - Add `test` script and test dependencies.
- Modify: `src/routes/router.tsx`
  - Register global and project-scoped help routes.
- Modify: `src/pages/ProjectsPage.tsx`
  - Add help entry and repair local page copy.
- Modify: `src/components/ProjectSidebar.tsx`
  - Add project-scoped help navigation entry and repair shell copy.
- Modify: `src/components/AppHeader.tsx`
  - Repair public-header copy.
- Modify: `src/layouts/RootLayout.tsx`
  - Repair footer copy.
- Modify: `src/layouts/ProjectLayout.tsx`
  - Repair workspace header and backend-status copy.
- Modify: `src/pages/TemplateSelectPage.tsx`
  - Repair template-selection copy.
- Modify: `src/templates/projectTemplates.ts`
  - Repair all template metadata and extend template nav config with a help label.
- Modify: `src/data/sampleData.ts`
  - Repair shipped sample entities, events, relations, library notes, and default project titles.
- Modify: `src/store/useFushengluStore.ts`
  - Repair default fallback project title and subtitle literals.
- Modify: `server/data/fushenglu-db.json`
  - Repair the checked-in API demo data that currently renders mojibake.
- Modify: `README.md`
  - Repair all Chinese documentation copy so repository docs match the UI.

## Task 1: Add a Minimal Regression Test Harness

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/content/helpContent.test.ts`
- Create: `src/pages/HelpPage.test.tsx`
- Create: `src/templates/projectTemplates.test.ts`
- Create: `src/data/sampleData.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Add the failing tests before adding implementation**

Create `src/content/helpContent.test.ts`:

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

  it('uses Chinese section titles that match the approved information structure', () => {
    expect(helpSections.map((section) => section.title)).toEqual([
      '产品概览',
      '快速开始',
      '工作区页面说明',
      '常用操作',
      '数据与保存',
      '开发说明与常见问题',
    ])
  })
})
```

Create `src/pages/HelpPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import HelpPage from './HelpPage'

describe('HelpPage', () => {
  it('renders the standalone manual heading and required sections', () => {
    render(
      <MemoryRouter>
        <HelpPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '使用手册' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '产品概览' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '开发说明与常见问题' })).toBeInTheDocument()
  })
})
```

Create `src/templates/projectTemplates.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { projectTemplates } from './projectTemplates'

describe('projectTemplates', () => {
  it('exposes repaired Chinese labels for the history template', () => {
    expect(projectTemplates.history.name).toBe('历史人物事件')
    expect(projectTemplates.history.shortName).toBe('历史模板')
    expect(projectTemplates.history.nav.help).toBe('使用手册')
  })

  it('exposes repaired Chinese labels for the fiction template', () => {
    expect(projectTemplates.fiction.name).toBe('小说人物情节')
    expect(projectTemplates.fiction.shortName).toBe('小说模板')
    expect(projectTemplates.fiction.pages.relationGraph.title).toBe('群像图')
  })
})
```

Create `src/data/sampleData.test.ts`:

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

  it('ships repaired representative entity and event names', () => {
    expect(createHistorySampleProject().entities[0]?.name).toBe('刘邦')
    expect(createFictionSampleProject().events[0]?.title).toBe('神秘信件出现')
  })
})
```

- [ ] **Step 2: Run the tests to capture the expected failures**

Run:

```bash
npm run test
```

Expected:

- `npm` fails because the `test` script is missing.
- If the script already exists locally, the tests fail because `HelpPage` and `helpContent` do not exist yet and the template/sample labels are still garbled.

- [ ] **Step 3: Add the minimal test tooling**

Modify `package.json`:

```json
{
  "scripts": {
    "dev": "concurrently -k -n api,web -c yellow,cyan \"npm:dev:api\" \"npm:dev:web\"",
    "dev:web": "vite",
    "dev:api": "tsx watch server/src/index.ts",
    "api": "tsx server/src/index.ts",
    "build": "tsc -b && tsc -p server/tsconfig.json && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.8.0",
    "@testing-library/react": "^16.1.0",
    "@types/node": "^24.12.3",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "jsdom": "^26.1.0",
    "vitest": "^3.2.4"
  }
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

Install dependencies:

```bash
npm install
```

- [ ] **Step 4: Run the tests again and verify the failures are now product-specific**

Run:

```bash
npm run test
```

Expected:

- Vitest starts successfully.
- Tests fail because the help page and repaired text have not been implemented yet.

- [ ] **Step 5: Commit the test harness**

Run:

```bash
git add package.json package-lock.json vitest.config.ts src/test/setup.ts src/content/helpContent.test.ts src/pages/HelpPage.test.tsx src/templates/projectTemplates.test.ts src/data/sampleData.test.ts
git commit -m "test: add help and copy regression harness"
```

## Task 2: Implement the Shared Help Content, Help Page, and Help Routes

**Files:**
- Create: `src/content/helpContent.ts`
- Create: `src/pages/HelpPage.tsx`
- Modify: `src/routes/router.tsx`
- Modify: `src/pages/ProjectsPage.tsx`
- Modify: `src/components/ProjectSidebar.tsx`
- Modify: `src/templates/projectTemplates.ts`

- [ ] **Step 1: Write the implementation that satisfies the new help-content tests**

Create `src/content/helpContent.ts`:

```ts
export type HelpSection = {
  id:
    | 'overview'
    | 'quick-start'
    | 'workspace-guide'
    | 'common-actions'
    | 'data-and-storage'
    | 'development-and-troubleshooting'
  eyebrow: string
  title: string
  description: string
  bullets: string[]
}

export const helpSections: HelpSection[] = [
  {
    id: 'overview',
    eyebrow: 'Overview',
    title: '产品概览',
    description: '浮生录用于整理历史、小说、剧本与世界观中的人物、事件、关系与资料。',
    bullets: [
      '历史模板适合记录人物、朝代、战役、政变与史料出处。',
      '小说模板适合记录角色、章节、伏笔、回收、冲突与创作资料。',
    ],
  },
  {
    id: 'quick-start',
    eyebrow: 'Quick Start',
    title: '快速开始',
    description: '先创建项目，再选择模板，最后进入工作区整理实体、事件和图谱。',
    bullets: [
      '在项目列表页点击“新建图谱”。',
      '选择历史模板或小说模板。',
      '填写项目名称与简介后进入工作区。',
    ],
  },
  {
    id: 'workspace-guide',
    eyebrow: 'Workspace',
    title: '工作区页面说明',
    description: '每个项目都拆分为多个页面，避免把全部功能挤在同一屏。',
    bullets: [
      '总览：查看项目摘要与预览。',
      '人物或角色：整理实体档案。',
      '事件：记录事件节点与相关实体。',
      '时间轴：按顺序查看事件推进。',
      '关系图与因果图：可视化连接人物关系与事件因果。',
      '资料库与设置：保存材料并管理项目。',
    ],
  },
  {
    id: 'common-actions',
    eyebrow: 'Actions',
    title: '常用操作',
    description: '帮助用户完成日常整理工作，而不是只展示静态说明。',
    bullets: [
      '新增、编辑和删除人物、事件、关系与资料条目。',
      '拖拽关系图和因果图节点并自动保存布局。',
      '导入、导出、清空项目数据，或恢复示例数据。',
    ],
  },
  {
    id: 'data-and-storage',
    eyebrow: 'Storage',
    title: '数据与保存',
    description: '浮生录优先连接本地 API，API 不可用时会回退到浏览器本地存储。',
    bullets: [
      '本地 API 数据默认保存在 server/data/fushenglu-db.json。',
      '浏览器模式下通过 localStorage 保留项目。',
      '恢复示例数据会使用仓库内置的模板示例内容。',
    ],
  },
  {
    id: 'development-and-troubleshooting',
    eyebrow: 'Development',
    title: '开发说明与常见问题',
    description: '提供最常用的开发命令与高频排障线索。',
    bullets: [
      '启动开发环境：npm install 后执行 npm run dev。',
      '构建与检查：npm run build、npm run lint、npm run test。',
      '如果页面没有数据，先检查本地 API 是否启动，再检查本地缓存是否仍保留旧数据。',
    ],
  },
]
```

- [ ] **Step 2: Render the new standalone help page**

Create `src/pages/HelpPage.tsx`:

```tsx
import { ArrowLeft, BookOpenText } from 'lucide-react'
import { Link, useMatch } from 'react-router-dom'
import { helpSections } from '../content/helpContent'

export default function HelpPage() {
  const inProject = Boolean(useMatch('/projects/:projectId/help'))
  const backTo = inProject ? '..' : '/projects'
  const backLabel = inProject ? '返回项目工作区' : '返回图谱项目'

  return (
    <div className="mx-auto max-w-5xl px-5 pb-12 pt-8 sm:px-8">
      <Link
        to={backTo}
        relative={inProject ? 'path' : undefined}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-ink-900/10 bg-paper-50/70 px-4 text-sm text-ink-700 transition hover:bg-paper-50"
      >
        <ArrowLeft size={16} />
        {backLabel}
      </Link>

      <header className="mt-7 rounded-lg border border-goldline/25 bg-paper-50/82 p-6 shadow-soft">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-goldline/25 bg-goldline/10 text-cinnabar">
            <BookOpenText size={22} />
          </span>
          <div>
            <p className="text-sm text-ink-500">Manual</p>
            <h1 className="mt-1 font-serif text-4xl font-semibold text-ink-900">使用手册</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-700">
              这份手册用于说明浮生录的适用场景、工作区结构、常用操作、数据保存方式与开发排障路径。
            </p>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-5">
        {helpSections.map((section) => (
          <section
            key={section.id}
            className="rounded-lg border border-ink-900/10 bg-paper-50/82 p-6 shadow-soft"
          >
            <p className="text-xs tracking-[0.18em] text-ink-500">{section.eyebrow}</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-ink-900">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-ink-700">{section.description}</p>
            <ul className="mt-4 grid gap-3 text-sm leading-7 text-ink-700">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="rounded-lg bg-paper-100/70 px-4 py-3">
                  {bullet}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire the routes and help entry points**

Modify the router in `src/routes/router.tsx`:

```tsx
const HelpPage = lazy(() => import('../pages/HelpPage'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: page(<HomePage />) },
      { path: 'projects', element: page(<ProjectsPage />) },
      { path: 'projects/new', element: page(<TemplateSelectPage />) },
      { path: 'help', element: page(<HelpPage />) },
    ],
  },
  {
    path: '/projects/:projectId',
    element: <ProjectLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: page(<ProjectDashboard />) },
      { path: 'entities', element: page(<EntitiesPage />) },
      { path: 'events', element: page(<EventsPage />) },
      { path: 'timeline', element: page(<TimelinePage />) },
      { path: 'relation-graph', element: page(<RelationGraphPage />) },
      { path: 'event-graph', element: page(<EventGraphPage />) },
      { path: 'library', element: page(<LibraryPage />) },
      { path: 'settings', element: page(<ProjectSettingsPage />) },
      { path: 'help', element: page(<HelpPage />) },
    ],
  },
])
```

Extend `NavConfig` and `templateNavItems` in `src/templates/projectTemplates.ts`:

```ts
type NavConfig = {
  dashboard: string
  entities: string
  events: string
  timeline: string
  relationGraph: string
  eventGraph: string
  library: string
  settings: string
  help: string
}

export const templateNavItems = [
  { to: 'dashboard', key: 'dashboard', icon: LayoutDashboard },
  { to: 'entities', key: 'entities', icon: UsersRound },
  { to: 'events', key: 'events', icon: ScrollText },
  { to: 'timeline', key: 'timeline', icon: GitBranch },
  { to: 'relation-graph', key: 'relationGraph', icon: Network },
  { to: 'event-graph', key: 'eventGraph', icon: GitBranch },
  { to: 'library', key: 'library', icon: Archive },
  { to: 'settings', key: 'settings', icon: Settings },
  { to: 'help', key: 'help', icon: BookMarked },
] as const
```

Add the projects-page entry in `src/pages/ProjectsPage.tsx`:

```tsx
<div className="flex flex-col gap-3 sm:flex-row">
  <Link
    to="/help"
    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ink-900/10 bg-paper-50/75 px-5 text-ink-800 shadow-soft transition hover:bg-paper-50"
  >
    使用手册
  </Link>
  <Link
    to="/projects/new"
    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink-900 px-5 text-paper-50 shadow-soft transition hover:bg-ink-700"
  >
    <Plus size={18} />
    新建图谱
  </Link>
</div>
```

- [ ] **Step 4: Run the tests and verify the help page now passes**

Run:

```bash
npm run test
```

Expected:

- `helpContent.test.ts` passes.
- `HelpPage.test.tsx` passes.
- `projectTemplates.test.ts` and `sampleData.test.ts` still fail until the copy repair tasks are complete.

- [ ] **Step 5: Commit the help page and route integration**

Run:

```bash
git add src/content/helpContent.ts src/pages/HelpPage.tsx src/routes/router.tsx src/pages/ProjectsPage.tsx src/components/ProjectSidebar.tsx src/templates/projectTemplates.ts
git commit -m "feat: add standalone help routes"
```

## Task 3: Repair Shared UI Copy and Template Metadata

**Files:**
- Modify: `src/pages/ProjectsPage.tsx`
- Modify: `src/components/AppHeader.tsx`
- Modify: `src/components/ProjectSidebar.tsx`
- Modify: `src/layouts/RootLayout.tsx`
- Modify: `src/layouts/ProjectLayout.tsx`
- Modify: `src/pages/TemplateSelectPage.tsx`
- Modify: `src/templates/projectTemplates.ts`
- Modify: `src/store/useFushengluStore.ts`
- Modify: `src/templates/projectTemplates.test.ts`

- [ ] **Step 1: Repair the app-shell and entry-page copy**

Update the shared shell literals to their approved Chinese wording.

In `src/pages/ProjectsPage.tsx` replace the garbled labels with:

```ts
const categoryLabel: Record<ProjectCategory, string> = {
  history: '历史专题',
  novel: '小说作品',
  script: '剧本项目',
  worldbuilding: '世界观设定',
  research: '研究资料',
}
```

and ensure the visible page strings are:

```tsx
<h1 className="mt-2 font-serif text-4xl font-semibold">图谱项目</h1>
<p className="mt-3 max-w-2xl text-sm leading-7 text-ink-700">
  每个项目都是独立案卷。新建时可选择历史或小说模板，字段、导航和示例数据会随模板变化。
</p>
```

In `src/components/AppHeader.tsx`, `src/layouts/RootLayout.tsx`, `src/components/ProjectSidebar.tsx`, `src/layouts/ProjectLayout.tsx`, and `src/pages/TemplateSelectPage.tsx`, normalize the visible strings to:

```txt
浮生录
返回浮生录首页
图谱项目
返回项目
案卷管理工作台
当前案卷
案卷库已连接
连接案卷库
本地模式
选择项目模板
重选模板
创建并进入
模板会预设
项目名示例
使用手册
返回项目工作区
展开侧边栏
收起侧边栏
```

- [ ] **Step 2: Repair all template metadata and nav labels**

In `src/templates/projectTemplates.ts`, replace the garbled metadata with corrected Chinese values. Use these exact representative values as anchors and continue through the rest of the file in the same vocabulary:

```ts
history: {
  id: 'history',
  name: '历史人物事件',
  shortName: '历史模板',
  summary: '适合整理真实人物、朝代脉络、战役政变和史料出处。',
  description: '以史实考据为核心，默认突出年代、地点、身份、朝代与史料笔记。',
  projectKindLabel: '历史专题',
  nav: {
    dashboard: '总览',
    entities: '人物录',
    events: '纪事簿',
    timeline: '编年轴',
    relationGraph: '势力图',
    eventGraph: '因果图',
    library: '史料库',
    settings: '设置',
    help: '使用手册',
  },
}

fiction: {
  id: 'fiction',
  name: '小说人物情节',
  shortName: '小说模板',
  summary: '适合整理角色、章节、伏笔、冲突、情感线和世界观资料。',
  description: '以创作管理为核心，默认突出角色动机、阵营、人物弧光、章节与伏笔回收。',
  projectKindLabel: '小说作品',
  nav: {
    dashboard: '总览',
    entities: '人物志',
    events: '事件簿',
    timeline: '流年轴',
    relationGraph: '群像图',
    eventGraph: '因果图',
    library: '藏卷',
    settings: '设置',
    help: '使用手册',
  },
}
```

Also repair the page-level labels in the same file, including:

```txt
人物录
纪事簿
编年轴
势力图
因果图
史料库
人物志
事件簿
流年轴
群像图
藏卷
新增人物
新增事件
新增史料
新增角色
新增藏卷
```

- [ ] **Step 3: Repair store fallback strings and rerun the template regression test**

In `src/store/useFushengluStore.ts`, change the fallback literals inside `addProject` to:

```ts
title: draft.title || '未命名图谱',
subtitle: draft.subtitle || '一份新的叙事案卷。',
```

Then run:

```bash
npm run test -- src/templates/projectTemplates.test.ts
```

Expected:

- `projectTemplates.test.ts` passes.
- `sampleData.test.ts` still fails until Task 4 lands.

- [ ] **Step 4: Run the full test suite to confirm shell and template copy is stable**

Run:

```bash
npm run test
```

Expected:

- `helpContent.test.ts`, `HelpPage.test.tsx`, and `projectTemplates.test.ts` pass.
- `sampleData.test.ts` remains the only failing suite if sample data is not repaired yet.

- [ ] **Step 5: Commit the shared-copy repair**

Run:

```bash
git add src/pages/ProjectsPage.tsx src/components/AppHeader.tsx src/components/ProjectSidebar.tsx src/layouts/RootLayout.tsx src/layouts/ProjectLayout.tsx src/pages/TemplateSelectPage.tsx src/templates/projectTemplates.ts src/store/useFushengluStore.ts src/templates/projectTemplates.test.ts
git commit -m "fix: repair shared ui and template copy"
```

## Task 4: Repair Sample Data and the Checked-in API Database

**Files:**
- Modify: `src/data/sampleData.ts`
- Modify: `server/data/fushenglu-db.json`
- Modify: `src/data/sampleData.test.ts`

- [ ] **Step 1: Repair the shipped sample data in source**

In `src/data/sampleData.ts`, replace the representative garbled literals below and continue the same repair pattern through the rest of the sample content:

```ts
export const createFictionSampleProject = (
  id = 'project-fushenglu-demo',
  title = '浮生录示例案卷',
  category: ProjectCategory = 'novel',
  subtitle = '用一条身份谜团线串起人物、事件、关系与伏笔回收。',
)

export const createHistorySampleProject = (
  id = 'project-chuhan',
  title = '楚汉旧闻',
  category: ProjectCategory = 'history',
  subtitle = '以秦末楚汉为背景，整理人物联盟、战役节点与政治转折。',
)

sampleProjects: [
  createFictionSampleProject(),
  createHistorySampleProject(),
  createFictionSampleProject(
    'project-starshore',
    '星海边境设定',
    'worldbuilding',
    '用于组织游戏世界观中的势力、地点、主线事件与悬念回收。',
  ),
]
```

Repair representative records to these exact values:

```ts
historyEntities[0].name = '刘邦'
historyEntities[1].name = '项羽'
historyEvents[0].title = '巨鹿之战'
fictionEntities[0].name = '主角'
fictionEvents[0].title = '神秘信件出现'
fictionLibraryItems[0].title = '主题札记：身份与选择'
```

- [ ] **Step 2: Run the sample-data regression test**

Run:

```bash
npm run test -- src/data/sampleData.test.ts
```

Expected:

- The suite passes once the corrected sample data is in place.

- [ ] **Step 3: Regenerate the checked-in local API data from corrected source objects**

From the repository root, rewrite `server/data/fushenglu-db.json` using `tsx` so the checked-in file matches the repaired source data:

```bash
@'
import fs from "node:fs"
import {
  createFictionSampleProject,
  createHistorySampleProject,
} from "./src/data/sampleData.ts"

const db = {
  schemaVersion: 3,
  projects: [
    {
      schemaVersion: 3,
      id: "project-a200e794-60ec-46cc-b646-b5b55eb09bf5",
      title: "资治通鉴",
      subtitle: "整理《资治通鉴》中记述的历史",
      templateId: "history",
      category: "history",
      updatedAt: new Date("2026-06-18T05:53:02.749Z").toISOString(),
      entities: [],
      events: [],
      entityRelations: [],
      eventLinks: [],
      libraryItems: [],
      entityNodePositions: {},
      eventNodePositions: {},
    },
    createHistorySampleProject("project-chuhan", "楚汉旧闻", "history", "以秦末楚汉为背景，整理人物联盟、战役节点与政治转折。"),
    createFictionSampleProject("project-starshore", "星海边境设定", "worldbuilding", "用于组织游戏世界观中的势力、地点、主线事件与悬念回收。"),
    createFictionSampleProject("project-fushenglu-demo", "浮生录示例案卷", "novel", "用一条身份谜团线串起人物、事件、关系与伏笔回收。"),
  ],
}

fs.writeFileSync("server/data/fushenglu-db.json", `${JSON.stringify(db, null, 2)}\n`, "utf8")
'@ | npx tsx -
```

- [ ] **Step 4: Run the full test suite after the data repair**

Run:

```bash
npm run test
```

Expected:

- All Vitest suites pass.

- [ ] **Step 5: Commit the repaired sample and checked-in data**

Run:

```bash
git add src/data/sampleData.ts src/data/sampleData.test.ts server/data/fushenglu-db.json
git commit -m "fix: repair sample and api demo data"
```

## Task 5: Repair the README and Run Final Validation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Repair the repository documentation copy**

Update `README.md` so the product name, overview, feature list, route list, project structure, and data-model descriptions render as normal Chinese. Use these exact anchor strings while repairing the rest of the file:

```md
# 浮生录 The Transient Annals

「浮生录」是一个用于整理人物、事件、关系、时间线和叙事脉络的可视化图谱工具原型。

## 核心特性
- 多项目案卷
- 项目模板
- 人物志
- 事件簿
- 流年轴
- 群像图
- 因果图
- 藏卷
- 数据管理

## 快速开始
npm install
npm run dev
```

Ensure the route list includes:

```md
- `/help`：使用手册
- `/projects/:projectId/help`：项目内使用手册
```

- [ ] **Step 2: Run lint, tests, and build**

Run:

```bash
npm run lint
npm run test
npm run build
```

Expected:

- Lint passes.
- Vitest passes.
- Vite and the server TypeScript build succeed.

- [ ] **Step 3: Run the app and perform the manual smoke checks**

Run:

```bash
npm run dev
```

Manual checks:

- Open `/projects` and confirm `图谱项目`, `使用手册`, and `新建图谱` display correctly.
- Open `/help` and confirm all six sections render with Chinese headings.
- Open any project and verify the sidebar contains `使用手册`.
- Open `/projects/:projectId/help` and confirm the same content renders inside the project shell.
- Confirm the sample cards display `浮生录示例案卷`, `楚汉旧闻`, `资治通鉴`, and `星海边境设定`.
- Confirm timeline, graph, and library sample data no longer contain mojibake.

- [ ] **Step 4: Commit the README repair and validation-complete state**

Run:

```bash
git add README.md
git commit -m "docs: repair readme and usage copy"
```

- [ ] **Step 5: Prepare the implementation handoff**

Run:

```bash
git status
```

Expected:

- Working tree is clean.
- All plan tasks are complete.

## Self-Review Checklist

- Spec coverage:
  - Standalone help page: covered in Task 2.
  - Global and project-scoped routes: covered in Task 2.
  - Projects-page and sidebar entry points: covered in Task 2.
  - Shared UI copy repair: covered in Task 3.
  - Template metadata repair: covered in Task 3.
  - Sample data and checked-in API data repair: covered in Task 4.
  - README repair and validation: covered in Task 5.
- Placeholder scan:
  - No `TBD`, `TODO`, or deferred “implement later” markers remain.
- Type consistency:
  - `NavConfig.help`, `helpSections`, `/help`, and `/projects/:projectId/help` use the same naming across tasks.
