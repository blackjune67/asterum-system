import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendarPage } from '../features/calendar/CalendarPage'
import { calendarUiStore } from '../features/calendar/calendarUiStore'
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

function createParticipant(
  id: number,
  name: string,
  type: 'MEMBER' | 'STAFF',
  team: { id: number; name: string } | null = null,
) {
  return { id, name, type, teamId: team?.id ?? null, teamName: team?.name ?? null }
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

  test('renders Korean summary labels and month badges in the header', async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse([
        createScheduleItem(),
        createScheduleItem({
          id: 2,
          title: 'Recurring shoot',
          date: '2026-04-22',
          isRecurring: true,
          recurrence: {
            type: 'WEEKLY',
            interval: 1,
            endType: 'COUNT',
            untilDate: null,
            count: 3,
            anchorDate: '2026-04-22',
          },
        }),
      ]),
    )
    mockInitialLookups()

    renderWithQueryClient(<CalendarPage />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4))

    expect(screen.queryByText('Tracks')).not.toBeInTheDocument()
    expect(screen.queryByText('Series')).not.toBeInTheDocument()
    expect(screen.queryByText('Single')).not.toBeInTheDocument()

    expect(screen.getAllByText('전체 일정')).toHaveLength(1)
    expect(screen.getAllByText('반복 일정')).toHaveLength(1)
    expect(screen.getAllByText('단일 일정')).toHaveLength(1)
    expect(screen.queryByText('이번달 전체 일정')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.dream-stat')).toHaveLength(0)
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
    expect(screen.getByLabelText('장소')).toHaveValue('')
  })

  test('does not open the create modal when clicking empty space on a day with schedules', async () => {
    const user = userEvent.setup()

    fetchMock.mockResolvedValueOnce(createJsonResponse([createScheduleItem()]))
    mockInitialLookups()

    renderWithQueryClient(<CalendarPage />)

    const occupiedDayCell = (await screen.findByText('15')).closest('.dream-card')

    expect(occupiedDayCell).not.toBeNull()

    await user.click(occupiedDayCell!)

    expect(screen.queryByRole('heading', { name: '일정 등록' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Shoot' })).not.toBeInTheDocument()
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
    expect(screen.getByText('회의실 A (ROOM)')).toBeInTheDocument()
    expect(screen.getByText('비주얼팀')).toBeInTheDocument()
    expect(screen.getByText('1명 참여')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '반복 일정 전환' })).not.toBeInTheDocument()
  })

  test('refreshes participants after staff creation so the schedule form shows the new staff member', async () => {
    const user = userEvent.setup()

    fetchMock.mockResolvedValueOnce(createJsonResponse([]))
    fetchMock.mockResolvedValueOnce(createJsonResponse([createParticipant(1, '예준', 'MEMBER')]))
    fetchMock.mockResolvedValueOnce(createJsonResponse([createTeam(7, '영상팀', [])]))
    fetchMock.mockResolvedValueOnce(createJsonResponse([createResource(3, '회의실 A', 'ROOM')]))
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(createParticipant(6, '카메라맨A', 'STAFF', { id: 7, name: '영상팀' }), true, 201),
    )
    fetchMock.mockResolvedValueOnce(
      createJsonResponse([
        createParticipant(1, '예준', 'MEMBER'),
        createParticipant(6, '카메라맨A', 'STAFF', { id: 7, name: '영상팀' }),
      ]),
    )
    fetchMock.mockResolvedValueOnce(createJsonResponse([createTeam(7, '영상팀', [])]))

    renderWithQueryClient(<CalendarPage />)

    await user.click(await screen.findByRole('button', { name: '참가자/팀 관리' }))
    await user.type(screen.getByLabelText('개인 스태프 이름'), '카메라맨A')
    await user.selectOptions(screen.getByLabelText('소속 팀'), '7')
    await user.click(screen.getByRole('button', { name: '개인 스태프 등록' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/participants',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: '카메라맨A',
            type: 'STAFF',
            teamId: 7,
          }),
        }),
      )
    })

    await user.click(screen.getByRole('button', { name: '닫기' }))
    await user.click(screen.getByRole('button', { name: '일정 등록' }))

    const staffSection = screen.getByRole('group', { name: '스태프' })
    expect(await within(staffSection).findByLabelText('카메라맨A')).toBeInTheDocument()
    expect(within(staffSection).getByText('영상팀')).toBeInTheDocument()
  })

  test('switches to the weekly timeline view and opens detail from a timeline block', async () => {
    const user = userEvent.setup()

    const item = createScheduleItem({
      title: 'Studio shoot',
      date: '2026-04-15',
      resource: createResource(3, '스튜디오 A', 'STUDIO'),
    })

    calendarUiStore.setState({
      currentMonth: new Date(2026, 3, 1),
      selectedDate: '2026-04-15',
    })

    fetchMock.mockResolvedValueOnce(createJsonResponse([item]))
    mockInitialLookups()
    fetchMock.mockResolvedValueOnce(createJsonResponse(item))

    renderWithQueryClient(<CalendarPage />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4))
    await user.click(screen.getByRole('button', { name: '주간' }))

    expect(await screen.findByText('스튜디오 A')).toBeInTheDocument()
    expect(screen.getByTestId('week-timeline-scroll')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Studio shoot 2026-04-15/ }))

    expect(await screen.findByRole('heading', { name: 'Studio shoot' })).toBeInTheDocument()
  })

  test('fetches an adjacent month when the weekly range crosses a month boundary', async () => {
    const user = userEvent.setup()

    calendarUiStore.setState({
      currentMonth: new Date(2026, 3, 1),
      selectedDate: '2026-04-01',
    })

    fetchMock.mockResolvedValueOnce(createJsonResponse([createScheduleItem({ date: '2026-04-01' })]))
    mockInitialLookups()
    fetchMock.mockResolvedValueOnce(
      createJsonResponse([
        createScheduleItem({
          id: 8,
          title: 'March carry-over',
          date: '2026-03-30',
          startTime: '08:00:00',
          endTime: '09:00:00',
          resource: createResource(4, '스튜디오 B', 'STUDIO'),
        }),
      ]),
    )

    renderWithQueryClient(<CalendarPage />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4))
    await user.click(screen.getByRole('button', { name: '주간' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/schedules?year=2026&month=3')
    })
    expect(await screen.findByText('스튜디오 B')).toBeInTheDocument()
    expect(screen.getByText('March carry-over')).toBeInTheDocument()
  })
})
