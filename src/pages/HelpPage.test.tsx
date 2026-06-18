import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import HelpPage from './HelpPage'

describe('HelpPage', () => {
  it('renders the manual heading and required sections', () => {
    render(
      <MemoryRouter>
        <HelpPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '使用手册' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '产品概览' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '开发说明与常见问题' })).toBeInTheDocument()
  })
})
