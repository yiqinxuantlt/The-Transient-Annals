import { useOutletContext } from 'react-router-dom'
import type { FushengProject } from '../types'

export function useProject() {
  return useOutletContext<FushengProject>()
}
