# 全站中国风系统升级设计

## 背景

浮生录是一个用于整理历史、小说、剧本与世界观设定的本地优先工作台。当前项目已经有 React、TypeScript、Vite、React Router、Zustand、Express、React Flow 和 Tailwind 基础，并且已经具备项目列表、模板选择、项目工作区、人物志、事件簿、时间线、关系图、因果图、藏卷、帮助和设置等页面。

当前界面已有米纸、墨色、朱砂、玉色、金线等基础色彩变量，也有 `archive-card`、`paper-grain`、`seal-mark`、时间轴和图谱工作台相关样式。问题在于这些元素分散使用，页面之间的设计语言不够统一；同时多个可见源码文件中存在中文乱码，尤其影响模板文案、人物志、详情面板、项目布局和卡片操作文案。

用户最初请求增强人物志显示效果，并增加更多中国风元素。经过视觉方向确认后，用户选择将范围扩大为“全站中国风系统升级”。

当前工作区注意事项：

- `server/data/fushenglu-db.json` 存在未提交的运行时数据变化，主要是图谱节点位置和更新时间。实现与提交时不得把这类用户数据变化混入 UI 升级提交。
- `.superpowers/brainstorm/` 是被忽略的视觉讨论产物，不参与提交。
- 当前远端为 SSH GitHub remote，`main` 与 `origin/main` 已同步。

## 目标

把浮生录从“若干页面使用相近纸张色彩”升级为一个统一的中国风案卷系统。

成功状态：

- 全站可见中文文案恢复正常，不再出现乱码、破碎标点或编码残片。
- 全站视觉语言统一为“纸本案卷 + 谱牒长卷”。
- 人物志落地为“工具型谱牒卷轴”，同时保留搜索、编辑、删除、详情查看和关系速记效率。
- 事件簿、时间线、图谱、藏卷、帮助、设置和全局壳层使用一致的卡片、标题、工具栏、空状态、详情和表单语言。
- 桌面和窄屏布局不重叠、不横向溢出，主操作仍然清晰。
- 现有数据模型、路由和核心状态流保持稳定。

## 非目标

- 不新增后端数据模型。
- 不引入新的设计框架或重型 UI 库。
- 不把全站重写成纯展示型落地页。
- 不修改用户运行时项目数据，除非某条数据是源码内明确的种子内容且已确认属于乱码修复。
- 不在本次实现中新增复杂动画系统、图片生成资产或主题编辑器。
- 不替换 React Flow 或重做图谱核心交互。

## 推荐方案

采用“设计系统先行，逐页迁移”的全站升级。

先统一 tokens、CSS utilities、文案和通用组件，再按可见路由迁移页面。这样能降低大范围 UI 改造的风险，也能避免每个页面各自堆叠不同的中国风装饰。

设计核心不是增加大量装饰，而是建立可复用的视觉语汇：

- 纸：米纸底、轻纸纹、细格纹、卷册表面。
- 墨：正文、标题、导航层级和主要信息。
- 朱：印章、选中态、主按钮、删除/警示。
- 玉：辅助状态、关联线索、成功/在线状态、图谱节点辅助。
- 金线：边框、分割线、时间轴、卷轴边、卡片内框。

交互核心仍然是工具效率：

- 操作按钮清晰。
- 搜索和筛选可见。
- 表单字段明确。
- 详情面板可扫读。
- 卡片和列表在信息密度与美术感之间保持平衡。

## 设计方向

### 1. 全局壳层

全局和项目内部布局统一为“案卷书房”结构：

- 侧栏像书脊或卷册目录，但仍保留现代导航可读性。
- 顶栏像当前案卷封签，显示项目名称、搜索、后端状态、统计和主题切换。
- 主内容区使用宽松但有组织的纸本工作台背景。
- 所有固定/粘性元素必须保留足够对比度和可读性。

需要修复的可见壳层文案包括：

- Suspense fallback。
- 项目当前案卷标签。
- 后端连接状态。
- 事件/线索统计。
- 搜索 placeholder。

### 2. 基础视觉系统

保留现有 Tailwind token 思路，增强 CSS utilities：

- `archive-card`：标准纸面卡片。
- `paper-grain`：轻纹理，不干扰阅读。
- `seal-mark`：朱砂印章。
- `scroll-ribbon` 或同等 utility：竖向签条。
- `archive-toolbar`：搜索、筛选、动作按钮容器。
- `archive-field`：详情字段块。
- `archive-empty`：空状态。
- `archive-tag`：标签与朱批签条。

避免：

- 大面积单一棕色/米色导致页面发闷。
- 装饰性过强的背景遮挡内容。
- 大圆角卡片堆叠卡片。
- 紫蓝渐变、发光圆球、纯氛围装饰。
- 文本放在会截断或溢出的固定小容器里。

### 3. 人物志

人物志作为本次视觉升级的基准页，采用“工具型谱牒卷轴”。

页面结构：

- 顶部谱牒 header：竖向签条、英文/中文 eyebrow、说明、朱砂印章、主操作。
- 工具栏：搜索、类型/标签/阵营轻量筛选，保留新增入口。
- 人物卡：像一张入谱小传，头像/首字徽章、类型、姓名、身份、阵营、标签、简介、编辑/删除操作。
- 选中态：朱砂内框和轻阴影，不能造成布局跳动。
- 右侧详情：人物小传案卷，字段分组为身份、生卒/时代、势力、动机、人物弧光、简介、关联关系。
- 关系速记：改为线索签条列表，来源/目标/类型更清楚。
- 编辑弹窗：头像上传、字段、标签输入文案全部修复，表单更像“补录入谱”。

### 4. 事件簿与时间线

事件簿采用“编年札记”语言：

- 事件卡像简短纪事札。
- 事件类型、地点、章节、相关人物作为题签。
- 编辑弹窗字段文案修复，字段分组更清楚。

时间线保留当前中轴时间线优势，但统一细节：

- 中轴和节点使用金线/朱砂/玉色语义。
- 时间标签更像年号或章回题签。
- 事件详情继续复用案卷详情组件。
- 窄屏继续折叠为左轨，不允许横向滚动。

### 5. 图谱工作台

关系图和因果图继续使用现有 GraphWorkbench 和 React Flow 结构，不替换图谱引擎。

视觉升级方向：

- 图谱工具栏使用案卷工具条样式。
- 筛选面板像“检索签条”。
- 证据链和分析笔记像“校注/朱批”。
- 节点卡和边标签统一到纸本地图语言。
- 图谱空状态、说明、按钮文案修复。

交互不变：

- 拖拽节点。
- 连线创建。
- 批量布局。
- 筛选和聚焦。
- 分析笔记增删。

### 6. Dashboard、藏卷、帮助、设置

Dashboard：

- 总览卡片变为案卷摘要。
- 最近事件/关系预览使用统一纸本卡片。
- 统计不做花哨图表，以清晰数字和签条为主。

藏卷：

- 条目像藏书签或资料札记。
- 资料类型文案修复。
- 新增/编辑弹窗统一表单样式。

帮助：

- 文档内容采用书页阅读样式。
- 分节标题、步骤和术语修复中文。
- 不做营销式 hero。

设置：

- 导出、项目信息、危险操作分区清晰。
- 删除/重置等危险操作使用朱砂但不抢占正常操作。

## 架构与组件

### 源码边界

预计主要触及：

- `src/index.css`
- `tailwind.config.js`
- `src/templates/projectTemplates.ts`
- `src/layouts/RootLayout.tsx`
- `src/layouts/ProjectLayout.tsx`
- `src/components/AppHeader.tsx`
- `src/components/ProjectSidebar.tsx`
- `src/components/EntityCard.tsx`
- `src/components/AvatarBadge.tsx`
- `src/components/DetailPanel.tsx`
- `src/pages/EntitiesPage.tsx`
- `src/pages/EventsPage.tsx`
- `src/pages/TimelinePage.tsx`
- `src/pages/ProjectDashboard.tsx`
- `src/pages/LibraryPage.tsx`
- `src/pages/HelpPage.tsx`
- `src/pages/ProjectSettingsPage.tsx`
- `src/components/GraphWorkbench.tsx`
- `src/components/GraphToolbar.tsx`
- `src/components/GraphFilterPanel.tsx`
- `src/components/GraphEvidencePanel.tsx`
- `src/components/GraphInspectorPanel.tsx`
- tests covering templates, visible strings, and key UI rendering.

Add small reusable components only where they reduce repeated markup:

- `ArchivePageHeader`
- `ArchiveToolbar`
- `ArchiveField`
- `ArchiveTag`
- `SealBadge`
- `ScrollRibbon`
- `ArchiveEmptyState`

If an existing component already owns the behavior, prefer enhancing it over creating a parallel replacement.

### Data Flow

No data model change.

- Templates still come from `getProjectTemplate`.
- Project state still comes from `useFushengluStore`.
- Project page context still comes from `Outlet`.
- Graph state and node positions still flow through existing graph/store actions.
- Modal forms still create/update the same `EntityDraft`, `StoryEvent` drafts, library items, relations, and event links.

The main data-flow change is presentational:

- Page components pass existing data into smaller display components.
- Shared components render fields, tags, empty states, and buttons with consistent visual rules.

### Error Handling

Repair and standardize user-facing messages:

- Avatar upload requires image files.
- Avatar size warning uses clear Chinese.
- Delete confirmations include target name and effect.
- Empty search results explain whether to clear filters or create a record.
- Missing relation endpoints show “未知” but do not crash.
- Backend offline/checking/online states remain visible and readable.

No new async backend error flow is required unless existing code already has one for the page.

## Accessibility and Responsive Rules

- Interactive targets should remain at least 44px high where practical.
- Icon-only buttons must keep accessible labels.
- Text must wrap instead of clipping, especially Chinese labels and long project names.
- Focus states must remain visible.
- Selected state cannot rely on color alone; use border/ring/shape changes.
- `prefers-reduced-motion` should be respected for any new transitions.
- Narrow screens collapse multi-column layouts to single-column or stacked panels.
- No page should introduce horizontal scrolling at 375px width.

## Testing and Verification

Implementation should finish with:

- `npm test`
- `npm run build`
- Browser visual check on desktop width.
- Browser visual check near 375px width.
- Quick scan for mojibake patterns in touched source files.

Recommended tests:

- Template tests assert core history/fiction labels are correct Chinese.
- Visible-string smoke test checks source strings do not include common mojibake markers introduced by prior encoding corruption.
- Existing store/graph tests remain passing.
- UI tests for at least one key page after component extraction where practical, especially 人物志.

## Implementation Phases

### Phase 1: Text and Token Foundation

- Repair visible mojibake in source files and template config.
- Expand CSS utilities and tokens.
- Ensure base light/dark surfaces still meet readability.
- Add or update tests for template labels and mojibake prevention.

### Phase 2: Global Shell

- Upgrade root/project layouts, top bars, sidebars, status badges, search, and Suspense fallback.
- Keep route structure unchanged.

### Phase 3: People and Events

- Upgrade人物志 as the reference implementation.
- Upgrade事件簿 and event modal using the same field/card language.
- Refactor only where it reduces real duplication.

### Phase 4: Graphs and Timeline

- Restyle GraphWorkbench panels, toolbar, filters, evidence, inspector, nodes where needed.
- Restyle timeline with the same design tokens.

### Phase 5: Secondary Pages

- Upgrade Dashboard, Library, Help, Project Settings, Projects, Template Select, and Home if they contain visible inconsistency or乱码.
- Keep the first screen of app pages functional, not marketing-heavy.

### Phase 6: QA and Cleanup

- Run tests and build.
- Perform desktop/mobile visual QA.
- Review diffs to ensure user runtime data is not staged.
- Commit implementation separately from this design spec.

## Risks

- Scope is broad. Mitigation: implement in phases and validate after each phase.
- Mojibake may exist in many files. Mitigation: repair source-visible strings first and add regression checks.
- Existing data file may change during local app use. Mitigation: stage explicit paths and do not use broad staging when committing.
- Visual upgrades can reduce density. Mitigation: keep the “工具型卷轴” principle: Chinese style supports editing, it does not replace editing.
- Dark mode may regress if only light mode is polished. Mitigation: update tokens and inspect both themes where affected.

## Open Decisions

- Whether to include global Home/Projects/Template Select in the first implementation batch or leave them for the secondary page phase.
- Whether to add lightweight type/tag filters to人物志 during the visual upgrade, or keep behavior exactly as today and only improve search/card/detail presentation.
- Whether to repair persisted demo JSON strings if any are found corrupted, or limit the first pass to TypeScript source strings only.

Default decisions unless changed during implementation planning:

- Include global Home/Projects/Template Select in the full scope, but migrate them after project-internal pages.
- Add only low-risk filters that use existing entity fields; do not add persisted user preferences.
- Repair source strings and shipped seed data only when corruption is clearly part of bundled sample content, not user-edited runtime data.
