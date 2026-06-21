import { Outlet } from 'react-router-dom'
import AppHeader from '../components/AppHeader'

export default function RootLayout() {
  return (
    <div className="min-h-dvh text-ink-900">
      <AppHeader />
      <main className="relative z-10">
        <Outlet />
      </main>
      <footer className="relative z-10 mx-auto max-w-7xl px-5 pb-8 pt-12 text-sm text-ink-500 sm:px-8">
        <div className="border-t border-ink-900/10 pt-6">浮生录 · 叙事图谱与创作档案工作台</div>
      </footer>
    </div>
  )
}
