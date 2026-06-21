import {
  Archive,
  ArrowLeftRight,
  BookMarked,
  Crown,
  LayoutDashboard,
  Network,
  ScrollText,
  Settings,
  Sparkles,
  Timer,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import type { EntityType, ProjectCategory, ProjectTemplateId } from '../types'

export type EntityFieldKey =
  | 'name'
  | 'type'
  | 'identity'
  | 'faction'
  | 'motivation'
  | 'birth'
  | 'death'
  | 'dynasty'
  | 'roleArc'
  | 'description'
  | 'tags'

export type EventFieldKey =
  | 'title'
  | 'timeLabel'
  | 'chapter'
  | 'order'
  | 'location'
  | 'eventType'
  | 'description'
  | 'relatedEntityIds'
  | 'tags'

type FieldConfig<Key extends string> = {
  key: Key
  label: string
  placeholder?: string
  wide?: boolean
}

type NavConfig = {
  dashboard: string
  entities: string
  events: string
  timeline: string
  relationGraph: string
  eventGraph: string
  library: string
  help: string
  settings: string
}

export type ProjectTemplate = {
  id: ProjectTemplateId
  name: string
  shortName: string
  category: ProjectCategory
  icon: LucideIcon
  summary: string
  description: string
  accent: string
  defaultTitle: string
  defaultSubtitle: string
  projectKindLabel: string
  nav: NavConfig
  searchPlaceholder: string
  entitySingular: string
  entityPlural: string
  eventSingular: string
  eventPlural: string
  relationLabel: string
  eventLinkLabel: string
  libraryLabel: string
  dashboard: {
    eyebrow: string
    relationPreviewTitle: string
    timelinePreviewTitle: string
  }
  pages: {
    entities: { eyebrow: string; title: string; description: string; addLabel: string; search: string }
    events: { eyebrow: string; title: string; description: string; addLabel: string; search: string }
    timeline: { eyebrow: string; title: string; description: string; detailTitle: string }
    relationGraph: { eyebrow: string; title: string; description: string; composerTitle: string; notesTitle: string }
    eventGraph: { eyebrow: string; title: string; description: string; composerTitle: string; notesTitle: string }
    library: { eyebrow: string; title: string; description: string; addLabel: string }
  }
  entityTypeLabels: Record<EntityType, string>
  entityFields: FieldConfig<EntityFieldKey>[]
  eventFields: FieldConfig<EventFieldKey>[]
  relationTypes: string[]
  eventLinkTypes: string[]
  defaultEntityType: EntityType
  defaultEntityTags: string[]
  defaultEventTags: string[]
}

export const projectTemplates: Record<ProjectTemplateId, ProjectTemplate> = {
  history: {
    id: 'history',
    name: '历史人物事件',
    shortName: '历史模板',
    category: 'history',
    icon: Crown,
    summary: '适合整理真实人物、朝代脉络、战役政变和史料出处。',
    description: '以史实考据为核心，默认突出年代、地点、身份、朝代与史料札记。',
    accent: 'cinnabar',
    defaultTitle: '未命名历史案卷',
    defaultSubtitle: '整理人物生平、历史事件、势力关系与史料线索。',
    projectKindLabel: '历史专题',
    nav: {
      dashboard: '总览',
      entities: '人物志',
      events: '纪事簿',
      timeline: '编年轴',
      relationGraph: '势力图',
      eventGraph: '因果图',
      library: '史料库',
      help: '使用手册',
      settings: '设置',
    },
    searchPlaceholder: '搜索人物、事件、朝代、地点或史料',
    entitySingular: '人物',
    entityPlural: '人物',
    eventSingular: '事件',
    eventPlural: '事件',
    relationLabel: '人物关系',
    eventLinkLabel: '事件因果',
    libraryLabel: '史料',
    dashboard: {
      eyebrow: 'Historical Archive',
      relationPreviewTitle: '人物与势力关系预览',
      timelinePreviewTitle: '历史事件推进',
    },
    pages: {
      entities: {
        eyebrow: 'Historical Figures',
        title: '人物志',
        description: '记录人物身份、时代归属、生卒信息、势力关系和史料备注。',
        addLabel: '新增人物',
        search: '搜索姓名、身份、朝代、势力或标签',
      },
      events: {
        eyebrow: 'Historical Events',
        title: '纪事簿',
        description: '整理年代、地点、事件类型、相关人物与历史影响。',
        addLabel: '新增纪事',
        search: '搜索事件、年代、地点、类型或标签',
      },
      timeline: {
        eyebrow: 'CHRONICLE ARCHIVE',
        title: '编年轴',
        description: '按历史顺序展开事件节点，适合梳理时代更替、战争推进与政治转折。',
        detailTitle: '史案档案',
      },
      relationGraph: {
        eyebrow: 'Power Map',
        title: '势力图',
        description: '查看人物、政权、地点之间的联盟、对立、隶属和影响关系。',
        composerTitle: '新增人物关系',
        notesTitle: '关系札记',
      },
      eventGraph: {
        eyebrow: 'Causality Map',
        title: '因果图',
        description: '串联起起义、战争、政变、盟约与制度变化之间的因果链条。',
        composerTitle: '新增事件因果',
        notesTitle: '因果线索',
      },
      library: {
        eyebrow: 'Sources',
        title: '史料库',
        description: '保存史料出处、摘录、考据备注和待核验线索。',
        addLabel: '新增史料',
      },
    },
    entityTypeLabels: {
      person: '历史人物',
      character: '历史人物',
      organization: '政权 / 组织',
      place: '地点',
      other: '其他',
    },
    entityFields: [
      { key: 'name', label: '姓名', placeholder: '例如：刘邦' },
      { key: 'type', label: '类型' },
      { key: 'identity', label: '身份 / 称号', placeholder: '例如：汉王、西楚霸王' },
      { key: 'dynasty', label: '时代 / 朝代', placeholder: '例如：秦末汉初' },
      { key: 'birth', label: '生年', placeholder: '例如：前256年' },
      { key: 'death', label: '卒年', placeholder: '例如：前195年' },
      { key: 'faction', label: '阵营 / 势力', placeholder: '例如：汉军、楚军' },
      { key: 'motivation', label: '政治目标 / 主要诉求', wide: true },
      { key: 'description', label: '生平与史实备注', wide: true },
      { key: 'tags', label: '标签', wide: true },
    ],
    eventFields: [
      { key: 'title', label: '事件名称' },
      { key: 'timeLabel', label: '年代', placeholder: '例如：前206年' },
      { key: 'order', label: '顺序' },
      { key: 'location', label: '地点' },
      { key: 'eventType', label: '事件类型', placeholder: '战役 / 会盟 / 政变' },
      { key: 'relatedEntityIds', label: '相关人物', wide: true },
      { key: 'description', label: '事件经过与影响', wide: true },
      { key: 'tags', label: '标签', wide: true },
    ],
    relationTypes: ['联盟', '对立', '君臣', '师友', '隶属', '亲族', '政治交易', '军事协作'],
    eventLinkTypes: ['导致', '推动', '转折', '背景', '回应', '削弱', '奠定基础'],
    defaultEntityType: 'person',
    defaultEntityTags: ['待考据'],
    defaultEventTags: ['历史节点'],
  },
  fiction: {
    id: 'fiction',
    name: '小说人物情节',
    shortName: '小说模板',
    category: 'novel',
    icon: Sparkles,
    summary: '适合整理角色、章节、伏笔、冲突、情感线和世界观资料。',
    description: '以创作管理为核心，默认突出角色动机、阵营、人物弧光、章节与伏笔回收。',
    accent: 'jade',
    defaultTitle: '未命名小说案卷',
    defaultSubtitle: '整理角色关系、章节事件、伏笔回收与创作资料。',
    projectKindLabel: '小说作品',
    nav: {
      dashboard: '总览',
      entities: '人物志',
      events: '事件簿',
      timeline: '流年轴',
      relationGraph: '群像图',
      eventGraph: '因果图',
      library: '藏卷',
      help: '使用手册',
      settings: '设置',
    },
    searchPlaceholder: '搜索角色、事件、伏笔、章节或资料',
    entitySingular: '角色',
    entityPlural: '角色',
    eventSingular: '情节',
    eventPlural: '事件',
    relationLabel: '人物关系',
    eventLinkLabel: '情节线索',
    libraryLabel: '藏卷',
    dashboard: {
      eyebrow: 'Story Archive',
      relationPreviewTitle: '人物与阵营关系预览',
      timelinePreviewTitle: '情节推进',
    },
    pages: {
      entities: {
        eyebrow: 'Characters',
        title: '人物志',
        description: '管理角色、组织、地点与关键设定。每张卡片都是一份可继续补充的档案。',
        addLabel: '新增角色',
        search: '搜索姓名、身份、阵营、动机或标签',
      },
      events: {
        eyebrow: 'Plot Events',
        title: '事件簿',
        description: '管理章节情节、伏笔节点、转折与回收节点。事件连接会在因果图中呈现。',
        addLabel: '新增事件',
        search: '搜索标题、章节、时间标签、地点或标签',
      },
      timeline: {
        eyebrow: 'TIMELINE ARCHIVE',
        title: '流年轴',
        description: '以时间推进为主线整理章节、线索与人物行动。每个事件都是可追溯的档案节点。',
        detailTitle: '案前档案',
      },
      relationGraph: {
        eyebrow: 'Relation Map',
        title: '群像图',
        description: '点击节点查看档案，点击连线查看说明；从节点侧边圆点拖向另一个节点，可直接建立关系。',
        composerTitle: '新增人物关系',
        notesTitle: '关系札记',
      },
      eventGraph: {
        eyebrow: 'Causality Map',
        title: '因果图',
        description: '事件节点可拖拽；从节点侧边圆点拖到另一个节点，可直接记录导致、伏笔、回收或转折。',
        composerTitle: '新增事件连接',
        notesTitle: '因果线索',
      },
      library: {
        eyebrow: 'Library',
        title: '藏卷',
        description: '存放资料、引用、备注、灵感片段和原文摘录，作为图谱之外的创作底稿。',
        addLabel: '新增藏卷',
      },
    },
    entityTypeLabels: {
      person: '人物原型',
      character: '小说角色',
      organization: '组织',
      place: '地点',
      other: '其他',
    },
    entityFields: [
      { key: 'name', label: '姓名 / 角色名' },
      { key: 'type', label: '类型' },
      { key: 'identity', label: '身份' },
      { key: 'faction', label: '阵营 / 所属势力' },
      { key: 'motivation', label: '动机 / 目标', wide: true },
      { key: 'roleArc', label: '人物弧光', placeholder: '例如：从逃避真相到主动承担', wide: true },
      { key: 'description', label: '简介', wide: true },
      { key: 'tags', label: '标签', wide: true },
    ],
    eventFields: [
      { key: 'title', label: '事件标题' },
      { key: 'chapter', label: '章节 / 幕次', placeholder: '例如：第一章 / 第二幕' },
      { key: 'timeLabel', label: '时间标签', placeholder: '序章 / 第6章 / 三日后' },
      { key: 'order', label: '顺序' },
      { key: 'location', label: '地点' },
      { key: 'eventType', label: '情节类型', placeholder: '伏笔 / 转折 / 回收' },
      { key: 'relatedEntityIds', label: '相关人物 / 角色', wide: true },
      { key: 'description', label: '事件描述', wide: true },
      { key: 'tags', label: '标签', wide: true },
    ],
    relationTypes: ['信任', '隐瞒', '同盟', '敌对', '师徒', '亲族', '交易', '价值观冲突'],
    eventLinkTypes: ['导致', '影响', '转折', '伏笔', '回收', '对照', '背景'],
    defaultEntityType: 'character',
    defaultEntityTags: ['待完善'],
    defaultEventTags: ['情节节点'],
  },
}

export const templateNavItems = [
  { to: 'dashboard', key: 'dashboard', icon: LayoutDashboard },
  { to: 'entities', key: 'entities', icon: UsersRound },
  { to: 'events', key: 'events', icon: ScrollText },
  { to: 'timeline', key: 'timeline', icon: Timer },
  { to: 'relation-graph', key: 'relationGraph', icon: Network },
  { to: 'event-graph', key: 'eventGraph', icon: ArrowLeftRight },
  { to: 'library', key: 'library', icon: Archive },
  { to: 'help', key: 'help', icon: BookMarked },
  { to: 'settings', key: 'settings', icon: Settings },
] as const

export const inferTemplateId = (
  templateId?: string,
  category?: ProjectCategory,
): ProjectTemplateId => {
  if (templateId === 'history' || templateId === 'fiction') return templateId
  return category === 'history' ? 'history' : 'fiction'
}

export const getProjectTemplate = (
  templateId?: string,
  category?: ProjectCategory,
): ProjectTemplate => projectTemplates[inferTemplateId(templateId, category)]

export const templateOptions = [projectTemplates.history, projectTemplates.fiction]

export const createTemplateBadge = (template: ProjectTemplate) =>
  template.id === 'history' ? BookMarked : Sparkles
