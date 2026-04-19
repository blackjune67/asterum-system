import type { ScheduleUpdatePayload } from '../types/schedule'
import { createCalendarUiStore } from '../features/calendar/calendarUiStore'

describe('calendarUiStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 19, 9, 30, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('starts with the current month, current date, and closed overlays', () => {
    const store = createCalendarUiStore()
    const state = store.getState()

    expect(state.currentMonth.getFullYear()).toBe(2026)
    expect(state.currentMonth.getMonth()).toBe(3)
    expect(state.currentMonth.getDate()).toBe(1)
    expect(state.selectedDate).toBe('2026-04-19')
    expect(state.detailOpen).toBe(false)
    expect(state.formOpen).toBe(false)
    expect(state.convertOpen).toBe(false)
    expect(state.scopeOpen).toBe(false)
  })

  test('openCreate resets form errors and opens the create modal for the picked date', () => {
    const store = createCalendarUiStore()

    store.getState().setFormError('old error')
    store.getState().openCreate('2026-04-24')

    const state = store.getState()
    expect(state.selectedDate).toBe('2026-04-24')
    expect(state.formMode).toBe('create')
    expect(state.formOpen).toBe(true)
    expect(state.formError).toBeNull()
  })

  test('detail request actions open and reset the selected item flow', () => {
    const store = createCalendarUiStore()

    store.getState().openDetail(14)
    expect(store.getState().selectedItemId).toBe(14)
    expect(store.getState().detailRequested).toBe(true)
    expect(store.getState().detailOpen).toBe(false)

    store.getState().openDetailSuccess()
    expect(store.getState().detailRequested).toBe(false)
    expect(store.getState().detailOpen).toBe(true)

    store.getState().openDetailFailure('failed')
    expect(store.getState().selectedItemId).toBeNull()
    expect(store.getState().detailOpen).toBe(false)
    expect(store.getState().detailError).toBe('failed')
  })

  test('scope actions keep and clear a pending update payload', () => {
    const pendingUpdate: ScheduleUpdatePayload = {
      title: 'Edited shoot',
      date: '2026-04-19',
      startTime: '10:00:00',
      endTime: '12:00:00',
      participantIds: [1],
      teamIds: [2],
      resourceId: 3,
    }
    const store = createCalendarUiStore()

    store.getState().openScope('edit', pendingUpdate)

    expect(store.getState().scopeOpen).toBe(true)
    expect(store.getState().scopeMode).toBe('edit')
    expect(store.getState().pendingUpdate).toEqual(pendingUpdate)

    store.getState().closeScope()

    expect(store.getState().scopeOpen).toBe(false)
    expect(store.getState().pendingUpdate).toBeNull()
  })
})
