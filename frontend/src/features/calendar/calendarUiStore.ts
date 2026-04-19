import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import type { ScheduleUpdatePayload } from '../../types/schedule'
import { toDateInputValue } from '../schedule/dateUtils'

export type CalendarFormMode = 'create' | 'edit'
export type CalendarScopeMode = 'edit' | 'delete'

export interface CalendarUiState {
  currentMonth: Date
  selectedDate: string
  selectedItemId: number | null
  detailRequested: boolean
  detailOpen: boolean
  formOpen: boolean
  formMode: CalendarFormMode
  convertOpen: boolean
  scopeOpen: boolean
  scopeMode: CalendarScopeMode
  pendingUpdate: ScheduleUpdatePayload | null
  detailError: string | null
  formError: string | null
  convertError: string | null
}

interface CalendarUiActions {
  setCurrentMonth: (next: Date | ((current: Date) => Date)) => void
  setFormError: (message: string | null) => void
  setDetailError: (message: string | null) => void
  setConvertError: (message: string | null) => void
  openCreate: (date: string) => void
  closeForm: () => void
  openDetail: (id: number) => void
  openDetailSuccess: () => void
  openDetailFailure: (message: string) => void
  closeDetail: () => void
  startEdit: () => void
  openConvert: () => void
  closeConvert: () => void
  openScope: (mode: CalendarScopeMode, pendingUpdate?: ScheduleUpdatePayload | null) => void
  closeScope: () => void
}

export type CalendarUiStore = CalendarUiState & CalendarUiActions

function createInitialCalendarUiState(): CalendarUiState {
  const now = new Date()

  return {
    currentMonth: new Date(now.getFullYear(), now.getMonth(), 1),
    selectedDate: toDateInputValue(now),
    selectedItemId: null,
    detailRequested: false,
    detailOpen: false,
    formOpen: false,
    formMode: 'create',
    convertOpen: false,
    scopeOpen: false,
    scopeMode: 'edit',
    pendingUpdate: null,
    detailError: null,
    formError: null,
    convertError: null,
  }
}

export function createCalendarUiStore(initialState: Partial<CalendarUiState> = {}) {
  return createStore<CalendarUiStore>()((set) => ({
    ...createInitialCalendarUiState(),
    ...initialState,
    setCurrentMonth(next) {
      set((state) => ({
        currentMonth: typeof next === 'function' ? next(state.currentMonth) : next,
      }))
    },
    setFormError(message) {
      set({ formError: message })
    },
    setDetailError(message) {
      set({ detailError: message })
    },
    setConvertError(message) {
      set({ convertError: message })
    },
    openCreate(date) {
      set({
        selectedDate: date,
        formMode: 'create',
        formOpen: true,
        formError: null,
      })
    },
    closeForm() {
      set({
        formOpen: false,
        formError: null,
      })
    },
    openDetail(id) {
      set({
        selectedItemId: id,
        detailRequested: true,
        detailOpen: false,
        detailError: null,
      })
    },
    openDetailSuccess() {
      set({
        detailRequested: false,
        detailOpen: true,
        detailError: null,
      })
    },
    openDetailFailure(message) {
      set({
        selectedItemId: null,
        detailRequested: false,
        detailOpen: false,
        detailError: message,
      })
    },
    closeDetail() {
      set({
        selectedItemId: null,
        detailRequested: false,
        detailOpen: false,
        detailError: null,
      })
    },
    startEdit() {
      set({
        detailRequested: false,
        detailOpen: false,
        formMode: 'edit',
        formOpen: true,
      })
    },
    openConvert() {
      set({
        detailRequested: false,
        detailOpen: false,
        convertOpen: true,
        convertError: null,
      })
    },
    closeConvert() {
      set({
        convertOpen: false,
        convertError: null,
      })
    },
    openScope(mode, pendingUpdate = null) {
      set({
        scopeMode: mode,
        scopeOpen: true,
        pendingUpdate,
      })
    },
    closeScope() {
      set({
        scopeOpen: false,
        pendingUpdate: null,
      })
    },
  }))
}

export const calendarUiStore = createCalendarUiStore()

export function useCalendarUiStore<T>(selector: (state: CalendarUiStore) => T) {
  return useStore(calendarUiStore, selector)
}

export function resetCalendarUiStore() {
  calendarUiStore.setState(createInitialCalendarUiState())
}
