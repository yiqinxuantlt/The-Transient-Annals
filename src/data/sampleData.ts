import type { FushengProject, ProjectCategory } from '../types'

const now = () => new Date().toISOString()

const baseEntities = [
  {
    id: 'entity-main',
    name: '主角',
    type: 'character',
    identity: '失落家族的继承者',
    faction: '故乡旧族',
    motivation: '查明身世与故乡覆灭的真相',
    description: '故事的观察者与行动者，因一封神秘信件被迫离开熟悉的生活。',
    tags: ['核心视角', '身份谜团'],
  },
  {
    id: 'entity-friend',
    name: '旧友',
    type: 'character',
    identity: '主角的童年伙伴',
    faction: '边境商队',
    motivation: '保护主角，同时掩盖过去的承诺',
    description: '温和而谨慎，知道部分真相，却在关键节点选择沉默。',
    tags: ['隐瞒', '情感线'],
  },
  {
    id: 'entity-mentor',
    name: '导师',
    type: 'person',
    identity: '古籍守卷人',
    faction: '藏书院',
    motivation: '让主角具备面对真相的能力',
    description: '以训练和谜语推动主角成长，但始终保留最危险的信息。',
    tags: ['引导者', '保留信息'],
  },
  {
    id: 'entity-rival',
    name: '宿敌',
    type: 'character',
    identity: '反派组织的执行者',
    faction: '反派组织',
    motivation: '用秩序压制混乱，以牺牲个人换取稳定',
    description: '与主角拥有相似的伤口，却选择了完全相反的道路。',
    tags: ['价值观冲突', '镜像角色'],
  },
  {
    id: 'entity-order',
    name: '反派组织',
    type: 'organization',
    identity: '暗中控制边境的秘密结社',
    faction: '黑檀会',
    motivation: '收拢旧王朝遗产，重建绝对秩序',
    description: '以档案、誓约与债务编织控制网络，是多条事件线背后的推手。',
    tags: ['组织', '幕后'],
  },
  {
    id: 'entity-place',
    name: '关键地点',
    type: 'place',
    identity: '故乡北侧的废弃驿站',
    faction: '无',
    motivation: '承载旧案证据与最终对峙的空间记忆',
    description: '第一封信件与最终证据都指向此处，是时间线的回环点。',
    tags: ['场景', '回环'],
  },
] satisfies FushengProject['entities']

const baseEvents = [
  {
    id: 'event-letter',
    title: '神秘信件出现',
    timeLabel: '序章',
    order: 1,
    location: '故乡旧宅',
    description: '一封没有署名的信件指出主角的身份并非表面所见。',
    relatedEntityIds: ['entity-main', 'entity-place'],
    tags: ['开端', '伏笔'],
  },
  {
    id: 'event-secret',
    title: '旧友第一次隐瞒真相',
    timeLabel: '第2章',
    order: 2,
    location: '渡口',
    description: '旧友认出了信件上的印记，却声称从未见过。',
    relatedEntityIds: ['entity-main', 'entity-friend'],
    tags: ['隐瞒', '裂痕'],
  },
  {
    id: 'event-leave',
    title: '主角离开故乡',
    timeLabel: '第3章',
    order: 3,
    location: '北门古道',
    description: '主角带着信件离开故乡，开始追索藏书院与旧案之间的联系。',
    relatedEntityIds: ['entity-main', 'entity-mentor', 'entity-place'],
    tags: ['转折', '旅程'],
  },
  {
    id: 'event-reveal',
    title: '身份揭露',
    timeLabel: '第8章',
    order: 4,
    location: '藏书院密阁',
    description: '导师揭开主角身世，旧友的沉默被证明是一次保护也是一次背叛。',
    relatedEntityIds: ['entity-main', 'entity-friend', 'entity-mentor'],
    tags: ['回收', '真相'],
  },
  {
    id: 'event-final',
    title: '最终对峙',
    timeLabel: '终章',
    order: 5,
    location: '废弃驿站',
    description: '主角与宿敌在最初线索的源头相遇，完成价值观与命运选择的对照。',
    relatedEntityIds: ['entity-main', 'entity-rival', 'entity-order', 'entity-place'],
    tags: ['高潮', '对照'],
  },
] satisfies FushengProject['events']

const baseRelations = [
  {
    id: 'relation-main-friend',
    sourceId: 'entity-main',
    targetId: 'entity-friend',
    type: '信任 / 隐瞒',
    description: '情感基础很深，但旧友掌握的信息不断侵蚀两人的信任。',
    style: { lineStyle: 'dashed', tone: 'cinnabar', animated: true },
  },
  {
    id: 'relation-main-mentor',
    sourceId: 'entity-main',
    targetId: 'entity-mentor',
    type: '指导 / 保留信息',
    description: '导师负责引导主角成长，却为了保护主角延迟揭示真相。',
    style: { lineStyle: 'solid', tone: 'goldline' },
  },
  {
    id: 'relation-main-rival',
    sourceId: 'entity-main',
    targetId: 'entity-rival',
    type: '价值观冲突',
    description: '两人都受旧案影响，却对秩序、自由与牺牲有相反理解。',
    style: { lineStyle: 'dashed', tone: 'cinnabar', animated: true },
  },
  {
    id: 'relation-rival-order',
    sourceId: 'entity-rival',
    targetId: 'entity-order',
    type: '所属',
    description: '宿敌是组织在边境线的执行者，也是组织理念的人格化投影。',
    style: { lineStyle: 'solid', tone: 'ink' },
  },
] satisfies FushengProject['entityRelations']

const baseEventLinks = [
  {
    id: 'eventlink-letter-reveal',
    sourceEventId: 'event-letter',
    targetEventId: 'event-reveal',
    type: '伏笔 / 回收',
    description: '信件上的印记在身份揭露时得到解释。',
    style: { lineStyle: 'dashed', tone: 'goldline', animated: true },
  },
  {
    id: 'eventlink-secret-reveal',
    sourceEventId: 'event-secret',
    targetEventId: 'event-reveal',
    type: '导致',
    description: '旧友的隐瞒让主角更晚知道真相，也加深了揭露时的情感冲击。',
    style: { lineStyle: 'solid', tone: 'cinnabar' },
  },
  {
    id: 'eventlink-reveal-final',
    sourceEventId: 'event-reveal',
    targetEventId: 'event-final',
    type: '推动',
    description: '身份真相迫使主角主动面对反派组织和宿敌。',
    style: { lineStyle: 'solid', tone: 'jade', animated: true },
  },
] satisfies FushengProject['eventLinks']

const entityNodePositions = {
  'entity-main': { x: 40, y: 135 },
  'entity-friend': { x: 350, y: 45 },
  'entity-mentor': { x: 345, y: 305 },
  'entity-rival': { x: 705, y: 145 },
  'entity-order': { x: 1020, y: 100 },
  'entity-place': { x: 720, y: 340 },
} satisfies FushengProject['entityNodePositions']

const eventNodePositions = {
  'event-letter': { x: 30, y: 165 },
  'event-secret': { x: 335, y: 55 },
  'event-leave': { x: 335, y: 315 },
  'event-reveal': { x: 670, y: 170 },
  'event-final': { x: 1010, y: 170 },
} satisfies FushengProject['eventNodePositions']

const baseLibraryItems = [
  {
    id: 'library-origin',
    title: '主题札记：身份与选择',
    kind: 'note',
    content: '这组示例适合用来观察“真相延迟揭露”如何同时改变人物关系与事件因果。',
    tags: ['主题', '结构'],
    createdAt: now(),
  },
  {
    id: 'library-quote',
    title: '原文摘录：信件开头',
    kind: 'quote',
    content: '“当北门的铜铃再次响起，你会知道自己该去哪里。”',
    tags: ['信件', '伏笔'],
    createdAt: now(),
  },
] satisfies FushengProject['libraryItems']

export const createSampleProject = (
  id = 'project-fushenglu-demo',
  title = '浮生录示例案卷',
  category: ProjectCategory = 'novel',
  subtitle = '用一条身份谜团线串起人物、事件、关系与伏笔回收。',
): FushengProject => ({
  schemaVersion: 2,
  id,
  title,
  subtitle,
  category,
  updatedAt: now(),
  entities: baseEntities.map((item) => ({ ...item, tags: [...item.tags] })),
  events: baseEvents.map((item) => ({
    ...item,
    relatedEntityIds: [...item.relatedEntityIds],
    tags: [...item.tags],
  })),
  entityRelations: baseRelations.map((item) => ({ ...item })),
  eventLinks: baseEventLinks.map((item) => ({ ...item })),
  libraryItems: baseLibraryItems.map((item) => ({ ...item, tags: [...item.tags] })),
  entityNodePositions: { ...entityNodePositions },
  eventNodePositions: { ...eventNodePositions },
})

export const sampleProjects: FushengProject[] = [
  createSampleProject(),
  createSampleProject(
    'project-chuhan',
    '楚汉旧闻',
    'history',
    '以秦末楚汉为背景，整理人物联盟、战役节点与政治转折。',
  ),
  createSampleProject(
    'project-starshore',
    '星海边境设定',
    'worldbuilding',
    '用于组织游戏世界观中的势力、地点、主线事件与悬念回收。',
  ),
]
