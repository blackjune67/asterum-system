import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendarPage } from '../features/calendar/CalendarPage'
import { renderWithQueryClient } from './queryClient'

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

function createScheduleItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
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
    teamIds: [],
    teams: [],
    resource: null,
    recurrence: null,
    ...overrides,
  }
}

function createParticipant(id: number, name: string, type: 'MEMBER' | 'STAFF') {
  return { id, name, type }
}

function createTeam(id: number, name: string, members = [createParticipant(1, '하민', 'MEMBER')]) {
  return {
    id,
    name,
    memberIds: members.map((member) => member.id),
    members,
  }
}

function createResource(id: number, name: string, category: string) {
  return { id, name, category }
}

function mockInitialLookups() {
  fetchMock
    .mockResolvedValueOnce(createJsonResponse([createParticipant(1, '하민', 'MEMBER')]))
    .mockResolvedValueOnce(createJsonResponse([createTeam(7, '비주얼팀')]))
    .mockResolvedValueOnce(createJsonResponse([createResource(3, '회의실 A', 'ROOM')]))
}

describe('CalendarPage', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('renders current month heading and create button', async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse([]))
    mockInitialLookups()

    renderWithQueryClient(<CalendarPage />)

    expect(screen.getByRole('button', { name: '일정 등록' })).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4))
  })

  test('keeps the latest month data when an earlier request resolves late', async () => {
    const today = new Date()
    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 2)
    const deferredCurrentMonthSchedules = createDeferredResponse()

    fetchMock.mockImplementationOnce(() => deferredCurrentMonthSchedules.promise)
    mockInitialLookups()
    fetchMock.mockResolvedValueOnce(
      createJsonResponse([
        createScheduleItem({
          id: 2,
          title: 'Next month shoot',
          date: `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-02`,
        }),
      ]),
    )

    renderWithQueryClient(<CalendarPage />)

    await act(async () => {
      screen.getByRole('button', { name: '다음 달' }).click()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(await screen.findByText('Next month shoot')).toBeInTheDocument()

    await act(async () => {
      deferredCurrentMonthSchedules.resolve(
        createJsonResponse([
          createScheduleItem({
            id: 9,
            title: 'Current month shoot',
          }),
        ]),
      )
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(screen.getByText('Next month shoot')).toBeInTheDocument()
    expect(screen.queryByText('Current month shoot')).not.toBeInTheDocument()
  })

  test('shows a detail error when loading the selected item fails', async () => {
    const user = userEvent.setup()

    fetchMock.mockResolvedValueOnce(createJsonResponse([createScheduleItem()]))
    mockInitialLookups()
    fetchMock.mockResolvedValueOnce(createJsonResponse({}, false, 500))

    renderWithQueryClient(<CalendarPage />)

    await user.click(await screen.findByRole('button', { name: /Shoot/ }))

    expect(await screen.findByText('일정 상세 정보를 불러오지 못했습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Shoot' })).not.toBeInTheDocument()
  })

  test('opens the create modal from a calendar day selection', async () => {
    const user = userEvent.setup()

    fetchMock.mockResolvedValueOnce(createJsonResponse([]))
    mockInitialLookups()

    renderWithQueryClient(<CalendarPage />)

    await user.click(await screen.findByRole('button', { name: 'Open day 2026-04-15' }))

    expect(screen.getByRole('heading', { name: '일정 등록' })).toBeInTheDocument()
    expect(screen.getByLabelText('날짜')).toHaveValue('2026-04-15')
    expect(screen.getByLabelText('리소스')).toHaveValue('')
  })

  test('asks for a delete scope when removing a recurring schedule', async () => {
    const user = userEvent.setup()

    const recurringItem = createScheduleItem({
      seriesId: 11,
      title: 'Recurring shoot',
      isRecurring: true,
      participantIds: [1],
      participants: [createParticipant(1, '하민', 'MEMBER')],
      recurrence: {
        type: 'WEEKLY',
        interval: 1,
        endType: 'COUNT',
        untilDate: null,
        count: 3,
        anchorDate: '2026-04-15',
      },
    })

    fetchMock.mockResolvedValueOnce(createJsonResponse([recurringItem]))
    mockInitialLookups()
    fetchMock.mockResolvedValueOnce(createJsonResponse(recurringItem))

    renderWithQueryClient(<CalendarPage />)

    await user.click(await screen.findByRole('button', { name: /Recurring shoot/ }))
    await user.click(await screen.findByRole('button', { name: '삭제' }))

    expect(await screen.findByRole('heading', { name: '삭제 범위 선택' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '해당 일정만' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이후 모든 일정' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '전체 일정' })).toBeInTheDocument()
  })

  test('converts a one-time schedule into a recurring series from the detail modal', async () => {
    const user = userEvent.setup()

    const oneTimeItem = createScheduleItem({
      title: 'One-time shoot',
      participantIds: [1],
      participants: [createParticipant(1, '하민', 'MEMBER')],
      teamIds: [7],
      teams: [createTeam(7, '비주얼팀')],
      resource: createResource(3, '회의실 A', 'ROOM'),
    })
    const convertedItem = createScheduleItem({
      id: 2,
      seriesId: 42,
      title: 'One-time shoot',
      isRecurring: true,
      participantIds: [1],
      participants: [createParticipant(1, '하민', 'MEMBER')],
      teamIds: [7],
      teams: [createTeam(7, '비주얼팀')],
      resource: createResource(3, '회의실 A', 'ROOM'),
      recurrence: {
        type: 'MONTHLY',
        interval: 1,
        endType: 'COUNT',
        untilDate: null,
        count: 4,
        anchorDate: '2026-04-15',
      },
    })

    fetchMock.mockResolvedValueOnce(createJsonResponse([oneTimeItem]))
    mockInitialLookups()
    fetchMock.mockResolvedValueOnce(createJsonResponse(oneTimeItem))
    fetchMock.mockResolvedValueOnce(createJsonResponse(convertedItem))
    fetchMock.mockResolvedValueOnce(createJsonResponse([convertedItem]))

    renderWithQueryClient(<CalendarPage />)

    await user.click(await screen.findByRole('button', { name: /One-time shoot/ }))
    await user.click(await screen.findByRole('button', { name: '반복 일정으로 전환' }))

    expect(await screen.findByRole('heading', { name: '반복 일정 전환' })).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('반복 유형'), 'MONTHLY')
    await user.clear(screen.getByLabelText('반복 횟수'))
    await user.type(screen.getByLabelText('반복 횟수'), '4')
    await user.click(screen.getByRole('button', { name: '전환하기' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/schedules/1/convert-to-series',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            enabled: true,
            type: 'MONTHLY',
            interval: 1,
            endType: 'COUNT',
            untilDate: null,
            count: 4,
          }),
        }),
      )
    })

    expect(await screen.findByText('Recurring Schedule')).toBeInTheDocument()
    expect(screen.getByText('리소스: 회의실 A')).toBeInTheDocument()
    expect(screen.getByText('비주얼팀 (1명)')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '반복 일정 전환' })).not.toBeInTheDocument()
  })
})
