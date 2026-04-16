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

  test('opens the create modal from a calendar day selection', async () => {
    const user = userEvent.setup()

    fetchMock
      .mockResolvedValueOnce(createJsonResponse([]))
      .mockResolvedValueOnce(
        createJsonResponse([
          { id: 1, name: '하민', type: 'MEMBER' },
          { id: 3, name: '촬영팀', type: 'STAFF' },
        ]),
      )

    render(<CalendarPage />)

    await user.click(await screen.findByRole('button', { name: 'Open day 2026-04-15' }))

    expect(screen.getByRole('heading', { name: '일정 등록' })).toBeInTheDocument()
    expect(screen.getByLabelText('날짜')).toHaveValue('2026-04-15')
  })

  test('asks for a delete scope when removing a recurring schedule', async () => {
    const user = userEvent.setup()

    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse([
          {
            id: 1,
            seriesId: 11,
            title: 'Recurring shoot',
            date: '2026-04-15',
            startTime: '10:00:00',
            endTime: '12:00:00',
            isRecurring: true,
            isException: false,
            participantIds: [1],
            participants: [{ id: 1, name: '하민', type: 'MEMBER' }],
            recurrence: {
              type: 'WEEKLY',
              interval: 1,
              endType: 'COUNT',
              untilDate: null,
              count: 3,
              anchorDate: '2026-04-15',
            },
          },
        ]),
      )
      .mockResolvedValueOnce(createJsonResponse([{ id: 1, name: '하민', type: 'MEMBER' }]))
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 1,
          seriesId: 11,
          title: 'Recurring shoot',
          date: '2026-04-15',
          startTime: '10:00:00',
          endTime: '12:00:00',
          isRecurring: true,
          isException: false,
          participantIds: [1],
          participants: [{ id: 1, name: '하민', type: 'MEMBER' }],
          recurrence: {
            type: 'WEEKLY',
            interval: 1,
            endType: 'COUNT',
            untilDate: null,
            count: 3,
            anchorDate: '2026-04-15',
          },
        }),
      )

    render(<CalendarPage />)

    await user.click(await screen.findByRole('button', { name: 'Recurring shoot' }))
    await user.click(await screen.findByRole('button', { name: '삭제' }))

    expect(await screen.findByRole('heading', { name: '삭제 범위 선택' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '해당 일정만' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이후 모든 일정' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '전체 일정' })).toBeInTheDocument()
  })
})
