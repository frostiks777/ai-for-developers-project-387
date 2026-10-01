import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TimeZoneSelect } from './timezone-select'

const onChange = vi.fn()

describe('TimeZoneSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('показывает текущее значение и список поясов при фокусе', async () => {
    const user = userEvent.setup()
    render(<TimeZoneSelect value="UTC" onChange={onChange} />)

    const input = screen.getByLabelText('Часовой пояс')
    expect(input).toHaveValue('UTC')

    await user.click(input)
    expect(screen.getByRole('option', { name: /Europe\/Moscow/ })).toBeInTheDocument()
  })

  it('фильтрует пояса по введённому запросу', async () => {
    const user = userEvent.setup()
    render(<TimeZoneSelect value="UTC" onChange={onChange} />)

    await user.type(screen.getByLabelText('Часовой пояс'), 'berlin')

    expect(screen.getByRole('option', { name: /Europe\/Berlin/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Europe\/Moscow/ })).toBeNull()
  })

  it('вызывает onChange при выборе другого пояса', async () => {
    const user = userEvent.setup()
    render(<TimeZoneSelect value="UTC" onChange={onChange} />)

    await user.click(screen.getByLabelText('Часовой пояс'))
    await user.click(screen.getByRole('option', { name: /Europe\/Berlin/ }))

    expect(onChange).toHaveBeenCalledWith('Europe/Berlin')
  })
})
