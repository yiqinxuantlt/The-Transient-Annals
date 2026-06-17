import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes/router'
import { useFushengluStore } from './store/useFushengluStore'

function App() {
  const theme = useFushengluStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return <RouterProvider router={router} />
}

export default App
