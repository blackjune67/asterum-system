import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendarPage } from '../features/calendar/CalendarPage'

const fetchMock = vi.fn()

vi.stubGlobal('fetch', fetchMock)

function createJsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
  }
}

function createDeferredResponse() {
  let resolve!: (value: ReturnType<typeof createJsonResponse>) => void
  const promise = new Promise<ReturnType<typeof createJsonResponse>>((nextResolve) => {
    resolve = nextResolve
  })
  return { promise, resolve }
}

describe('CalendarPage', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('renders current month heading and create button', async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse([]))
      .mockResolvedValueOnce(createJsonResponse([]))

    render(<CalendarPage />)

    expect(screen.getByRole('button', { name: '일정 등록' })).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  test('keeps the latest month data when an earlier request resolves late', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T09:00:00'))
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const aprilSchedules = createDeferredResponse()

    fetchMock
      .mockImplementationOnce(() => aprilSchedules.promise)
      .mockResolvedValueOnce(createJsonResponse([]))
      .mockResolvedValueOnce(
        createJsonResponse([
          {
            id: 2,
            seriesId: null,
            title: 'May shoot',
            date: '2026-05-02',
            startTime: '10:00:00',
            endTime: '12:00:00',
            isRecurring: false,
            isException: false,
            participantIds: [],
            participants: [],
            recurrence: null,
          },
        ]),
      )
      .mockResolvedValueOnce(createJsonResponse([]))

    render(<CalendarPage />)

    await user.click(screen.getByRole('button', { name: '다음 달' }))

    expect(await screen.findByText('May shoot')).toBeInTheDocument()

    aprilSchedules.resolve(
      createJsonResponse([
        {
          id: 1,
          seriesId: null,
          title: 'April shoot',
          date: '2026-04-15',
          startTime: '09:00:00',
          endTime: '10:00:00',
          isRecurring: false,
          isException: false,
          participantIds: [],
          participants: [],
          recurrence: null,
        },
      ]),
    )

    await Promise.resolve()

    await waitFor(() => {
      expect(screen.getByText('May shoot')).toBeInTheDocument()
      expect(screen.queryByText('April shoot')).not.toBeInTheDocument()
    })
  })

  test('shows a detail error when loading the selected item fails', async () => {
    const user = userEvent.setup()

    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse([
          {
            id: 1,
            seriesId: null,
            title: 'Shoot',
            date: '2026-04-15',
            startTime: '10:00:00',
            endTime: '12:00:00',
            isRecurring: false,
            isException: false,
            participantIds: [],
            participants: [],
            recurrence: null,
          },
        ]),
      )
      .mockResolvedValueOnce(createJsonResponse([]))
      .mockResolvedValueOnce(createJsonResponse({}, false, 500))

    render(<CalendarPage />)

    await user.click(await screen.findByRole('button', { name: 'Shoot' }))

    expect(await screen.findByText('일정 상세 정보를 불러오지 못했습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Shoot' })).not.toBeInTheDocument()
  })
})
