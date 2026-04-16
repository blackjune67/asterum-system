import { render, screen, waitFor } from '@testing-library/react'
import { CalendarPage } from '../features/calendar/CalendarPage'

const fetchMock = vi.fn()

vi.stubGlobal('fetch', fetchMock)

describe('CalendarPage', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
  })

  test('renders current month heading and create button', async () => {
    render(<CalendarPage />)

    expect(screen.getByRole('button', { name: '일정 등록' })).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  })
})
