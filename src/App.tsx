import { lazy, Suspense, useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes/router'
import { useFushengluStore } from './store/useFushengluStore'

let backendHydrationStarted = false

const DevLogPanel = import.meta.env.DEV
  ? lazy(() =>
      import('./components/DevLogPanel').then((module) => ({
        default: module.DevLogPanel,
      })),
    )
  : null

function App() {
  const theme = useFushengluStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    if (backendHydrationStarted) return
    backendHydrationStarted = true

    void useFushengluStore.getState().hydrateFromBackend()
  }, [])

  return (
    <>
      <RouterProvider router={router} />
      {DevLogPanel ? (
        <Suspense fallback={null}>
          <DevLogPanel />
        </Suspense>
      ) : null}
    </>
  )
}

export default App
