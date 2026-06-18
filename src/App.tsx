import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { DevLogPanel } from './components/DevLogPanel'
import { router } from './routes/router'
import { useFushengluStore } from './store/useFushengluStore'

let backendHydrationStarted = false

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
      {import.meta.env.DEV ? <DevLogPanel /> : null}
    </>
  )
}

export default App
