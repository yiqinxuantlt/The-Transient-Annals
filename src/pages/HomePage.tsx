import { ArrowRight, BookOpen, GitBranch, Network, ScrollText, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ReactFlowProvider } from 'reactflow'
import GraphCanvas from '../components/GraphCanvas'
import EventTimeline from '../components/EventTimeline'
import { useFushengluStore } from '../store/useFushengluStore'

export default function HomePage() {
  const firstProject = useFushengluStore((state) => state.projects[0])

  return (
    <div className="mx-auto max-w-7xl px-5 pb-10 pt-8 sm:px-8">
      <section className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div className="py-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-goldline/30 bg-paper-50/70 px-4 py-2 text-sm text-ink-700 shadow-sm">
            <Sparkles size={16} className="text-cinnabar" />
            叙事图谱 · 创作档案 · 研究工作台
          </p>
          <h1 className="mt-8 font-calligraphy text-6xl leading-tight text-ink-900 sm:text-7xl tracking-wide">
            浮生录
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-700">
            以人物为线，以事件为轴，记录历史、小说、剧本与世界观中的关系脉络。
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/projects"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink-900 px-5 text-paper-50 shadow-soft transition hover:bg-ink-700"
            >
              进入图谱项目
              <ArrowRight size={18} />
            </Link>
            {firstProject ? (
              <Link
                to={`/projects/${firstProject.id}/dashboard`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ink-900/10 bg-paper-50/80 px-5 text-ink-800 transition hover:bg-paper-50"
              >
                查看示例案卷
              </Link>
            ) : null}
          </div>
        </div>

        {firstProject ? (
          <div className="archive-card paper-grain rounded-lg border border-goldline/25 bg-paper-50/75 p-4 shadow-archive">
            <div className="relative z-10 mb-4 flex items-center justify-between px-2">
              <div>
                <p className="text-xs text-ink-500">关系图预览</p>
                <h2 className="font-serif text-2xl font-semibold">一张安静展开的叙事地图</h2>
              </div>
              <Network className="text-jade" size={24} />
            </div>
            <div className="relative z-10 h-[420px]">
              <ReactFlowProvider>
                <GraphCanvas project={firstProject} mode="entities" compact />
              </ReactFlowProvider>
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-14 grid gap-5 md:grid-cols-3">
        {[
          {
            title: '人物关系',
            text: '记录信任、对立、师承、所属与隐瞒，让人物群像不再散落在笔记里。',
            icon: BookOpen,
          },
          {
            title: '事件因果',
            text: '把伏笔、回收、转折、背景和推动关系连成可拖拽的叙事图。',
            icon: GitBranch,
          },
          {
            title: '时间脉络',
            text: '按年代、章节或幕次组织事件，适合历史梳理，也适合创作推演。',
            icon: ScrollText,
          },
        ].map((item) => {
          const Icon = item.icon
          return (
            <article
              key={item.title}
              className="archive-card paper-grain rounded-lg border border-goldline/25 bg-paper-50/75 p-6 shadow-soft"
            >
              <div className="relative z-10">
                <Icon className="text-cinnabar" size={24} />
                <h2 className="mt-5 font-serif text-2xl font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-ink-700">{item.text}</p>
              </div>
            </article>
          )
        })}
      </section>

      {firstProject ? (
        <section className="mt-14 grid gap-6 lg:grid-cols-[1fr_0.82fr]">
          <div className="archive-card paper-grain rounded-lg border border-goldline/25 bg-paper-50/75 p-6 shadow-soft">
            <div className="relative z-10">
              <p className="text-xs text-ink-500">示例时间线</p>
              <h2 className="mt-1 font-serif text-2xl font-semibold">从信件到对峙</h2>
            </div>
            <div className="relative z-10 mt-6">
              <EventTimeline
                events={firstProject.events.slice(0, 4)}
                entities={firstProject.entities}
                compact
                onSelect={() => undefined}
              />
            </div>
          </div>
          <div className="archive-card paper-grain rounded-lg border border-goldline/25 bg-paper-50/75 p-6 shadow-archive">
            <div className="relative z-10">
              <p className="text-sm text-cinnabar">适用场景</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-ink-900">历史专题、小说、剧本、游戏世界观，都可以成为一份案卷。</h2>
              <p className="mt-5 text-sm leading-7 text-ink-700">
                首页只负责进入项目；真正的工作台在项目内部展开。人物志、事件簿、群像图、因果图、藏卷和设置彼此分层，不把复杂功能挤在同一屏。
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
