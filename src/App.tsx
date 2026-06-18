import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { DevLogPanel } from './components/DevLogPanel'
import { router } from './routes/router'
import { useFushengluStore } from './store/useFushengluStore'

function App() {
  const theme = useFushengluStore((state) => state.theme)
  const hydrateFromBackend = useFushengluStore((state) => state.hydrateFromBackend)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    void hydrateFromBackend()
  }, [hydrateFromBackend])

  return (
    <>
      <RouterProvider router={router} />
      {import.meta.env.DEV ? <DevLogPanel /> : null}
    </>
  )
}

export default App
