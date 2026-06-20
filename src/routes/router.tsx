/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, type ReactElement } from 'react'
import { createBrowserRouter, createHashRouter, Navigate } from 'react-router-dom'
import { ArchiveEmptyState } from '../components/archive'
import ProjectLayout from '../layouts/ProjectLayout'
import RootLayout from '../layouts/RootLayout'

const HomePage = lazy(() => import('../pages/HomePage'))
const HelpPage = lazy(() => import('../pages/HelpPage'))
const ProjectsPage = lazy(() => import('../pages/ProjectsPage'))
const TemplateSelectPage = lazy(() => import('../pages/TemplateSelectPage'))
const ProjectDashboard = lazy(() => import('../pages/ProjectDashboard'))
const EntitiesPage = lazy(() => import('../pages/EntitiesPage'))
const EventsPage = lazy(() => import('../pages/EventsPage'))
const TimelinePage = lazy(() => import('../pages/TimelinePage'))
const RelationGraphPage = lazy(() => import('../pages/RelationGraphPage'))
const EventGraphPage = lazy(() => import('../pages/EventGraphPage'))
const LibraryPage = lazy(() => import('../pages/LibraryPage'))
const ProjectSettingsPage = lazy(() => import('../pages/ProjectSettingsPage'))

function page(element: ReactElement) {
  return (
    <Suspense
      fallback={
        <ArchiveEmptyState title="正在展开案卷" description="页面内容正在载入，请稍候。" />
      }
    >
      {element}
    </Suspense>
  )
}

const routes = [
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
  { path: '*', element: <Navigate to="/" replace /> },
]

const createRouter = import.meta.env.VITE_DESKTOP === 'true' ? createHashRouter : createBrowserRouter

export const router = createRouter(routes)
