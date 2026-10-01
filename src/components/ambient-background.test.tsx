import { render, screen } from '@testing-library/react'

import { AmbientBackground } from './ambient-background'

describe('AmbientBackground', () => {
  it('рендерится как декоративный слой (aria-hidden)', () => {
    const { container } = render(<AmbientBackground />)
    const layer = container.querySelector('.ambient')

    expect(layer).not.toBeNull()
    expect(layer).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
