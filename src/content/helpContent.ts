export type HelpSectionId =
  | 'overview'
  | 'quick-start'
  | 'workspace-guide'
  | 'common-actions'
  | 'data-and-storage'
  | 'development-and-troubleshooting'

export type HelpSection = {
  id: HelpSectionId
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
    description:
      '浮生录用于整理历史、小说、剧本与世界观设定中的人物、事件、关系和资料，帮助你把分散线索归拢成一份可持续维护的图谱案卷。',
    bullets: [
      '历史模板偏重史实考据，适合记录人物生平、势力更替、战争节点与史料出处。',
      '小说模板偏重创作推进，适合整理角色动机、情节转折、伏笔回收与设定资料。',
      '同一套项目结构同时覆盖列表、时间线、关系图和资料库，方便从不同角度交叉核对。',
    ],
  },
  {
    id: 'quick-start',
    eyebrow: 'Quick Start',
    title: '快速开始',
    description:
      '先创建项目，再选择模板，最后进入工作区补充实体、事件和关联线索。模板会决定导航命名、表单字段和示例内容。',
    bullets: [
      '在项目页点击“新建图谱”，选择历史模板或小说模板。',
      '填写项目名称和简介后进入工作区，从概览页确认当前项目结构。',
      '优先补齐关键人物与核心事件，再回到关系图和时间线做串联检查。',
    ],
  },
  {
    id: 'workspace-guide',
    eyebrow: 'Workspace',
    title: '工作区页面说明',
    description:
      '每个项目都拆分为多个工作页，避免把所有信息挤在同一个界面，便于逐步整理和回看。',
    bullets: [
      '概览：查看项目摘要、关键数量和图谱预览。',
      '人物页或角色页：维护实体档案，补充身份、阵营、目标和标签。',
      '事件页与时间线：记录事件节点，并按顺序梳理推进过程。',
      '关系图与因果图：可视化人物关系、事件影响和线索连接。',
      '资料库与设置：沉淀参考资料，并管理项目基础信息。',
    ],
  },
  {
    id: 'common-actions',
    eyebrow: 'Actions',
    title: '常用操作',
    description:
      '日常使用以增删改查和图谱整理为主，核心目标是让信息维护足够轻量，不打断你的研究或创作节奏。',
    bullets: [
      '新增、编辑和删除人物、事件、关系与资料条目。',
      '拖拽关系图或因果图节点，调整布局后继续补充连接说明。',
      '结合搜索框快速定位人物、事件、地点、标签或资料关键词。',
    ],
  },
  {
    id: 'data-and-storage',
    eyebrow: 'Storage',
    title: '数据与保存',
    description:
      '浮生录优先读取本地 API；如果后端不可用，会回退到浏览器本地存储，保证基础编辑不会中断。',
    bullets: [
      '本地 API 数据默认保存到 `server/data/fushenglu-db.json`。',
      '浏览器模式下会通过 `localStorage` 保留项目内容和界面状态。',
      '切换环境或恢复示例数据前，建议先确认当前项目是否已经备份。',
    ],
  },
  {
    id: 'development-and-troubleshooting',
    eyebrow: 'Development',
    title: '开发说明与常见问题',
    description:
      '这里汇总最常用的开发命令和排查思路，便于在本地调试页面、路由和数据保存流程。',
    bullets: [
      '首次启动先执行 `npm install`，开发时使用 `npm run dev` 同时启动前后端。',
      '提交前至少运行 `npm run test`；需要完整检查时再补充 `npm run lint` 和 `npm run build`。',
      '如果页面没有数据，先确认本地 API 是否启动，再检查浏览器缓存是否保留了旧项目内容。',
    ],
  },
]
