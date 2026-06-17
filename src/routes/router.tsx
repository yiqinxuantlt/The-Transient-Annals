import { createBrowserRouter, Navigate } from 'react-router-dom'
import RootLayout from '../layouts/RootLayout'
import ProjectLayout from '../layouts/ProjectLayout'
import HomePage from '../pages/HomePage'
import ProjectsPage from '../pages/ProjectsPage'
import ProjectDashboard from '../pages/ProjectDashboard'
import EntitiesPage from '../pages/EntitiesPage'
import EventsPage from '../pages/EventsPage'
import TimelinePage from '../pages/TimelinePage'
import RelationGraphPage from '../pages/RelationGraphPage'
import EventGraphPage from '../pages/EventGraphPage'
import LibraryPage from '../pages/LibraryPage'
import ProjectSettingsPage from '../pages/ProjectSettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'projects', element: <ProjectsPage /> },
    ],
  },
  {
    path: '/projects/:projectId',
    element: <ProjectLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <ProjectDashboard /> },
      { path: 'entities', element: <EntitiesPage /> },
      { path: 'events', element: <EventsPage /> },
      { path: 'timeline', element: <TimelinePage /> },
      { path: 'relation-graph', element: <RelationGraphPage /> },
      { path: 'event-graph', element: <EventGraphPage /> },
      { path: 'library', element: <LibraryPage /> },
      { path: 'settings', element: <ProjectSettingsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
