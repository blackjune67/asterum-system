import { useEffect, useRef, useState } from 'react'
import { fetchParticipants } from '../../api/participants'
import { createSchedule, deleteSchedule, fetchSchedule, fetchSchedules, updateSchedule } from '../../api/schedules'
import type { Participant } from '../../types/participant'
import type { ScheduleCreatePayload, ScheduleItem, ScheduleUpdatePayload, ScopeType } from '../../types/schedule'
import { toDateInputValue } from '../schedule/dateUtils'

export function useCalendarState() {
  const monthRequestIdRef = useRef(0)
  const detailRequestIdRef = useRef(0)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()))
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [scopeOpen, setScopeOpen] = useState(false)
  const [scopeMode, setScopeMode] = useState<'edit' | 'delete'>('edit')
  const [pendingUpdate, setPendingUpdate] = useState<ScheduleUpdatePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const currentYear = currentMonth.getFullYear()
  const currentMonthNumber = currentMonth.getMonth() + 1

  async function loadMonth(year: number, month: number) {
    const requestId = ++monthRequestIdRef.current
    setLoading(true)
    setError(null)
    try {
      const [nextItems, nextParticipants] = await Promise.all([
        fetchSchedules(year, month),
        fetchParticipants(),
      ])
      if (requestId !== monthRequestIdRef.current) return
      setItems(nextItems)
      setParticipants(nextParticipants)
    } catch (cause) {
      if (requestId !== monthRequestIdRef.current) return
      setError(cause instanceof Error ? cause.message : 'Failed to load calendar data')
    } finally {
      if (requestId !== monthRequestIdRef.current) return
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMonth(currentYear, currentMonthNumber)
  }, [currentYear, currentMonthNumber])

  function openCreate(date: string) {
    setSelectedDate(date)
    setFormMode('create')
    setFormOpen(true)
  }

  async function openDetail(item: ScheduleItem) {
    const requestId = ++detailRequestIdRef.current
    setDetailLoading(true)
    setDetailError(null)
    try {
      const fresh = await fetchSchedule(item.id)
      if (requestId !== detailRequestIdRef.current) return
      setSelectedItem(fresh)
      setDetailOpen(true)
    } catch {
      if (requestId !== detailRequestIdRef.current) return
      setSelectedItem(null)
      setDetailOpen(false)
      setDetailError('일정 상세 정보를 불러오지 못했습니다.')
    } finally {
      if (requestId !== detailRequestIdRef.current) return
      setDetailLoading(false)
    }
  }

  async function submitCreate(payload: ScheduleCreatePayload | ScheduleUpdatePayload) {
    await createSchedule(payload as ScheduleCreatePayload)
    setFormOpen(false)
    await loadMonth(currentYear, currentMonthNumber)
  }

  async function submitEdit(payload: ScheduleCreatePayload | ScheduleUpdatePayload) {
    if (!selectedItem) return
    const updatePayload = payload as ScheduleUpdatePayload
    if (selectedItem.isRecurring) {
      setPendingUpdate(updatePayload)
      setScopeMode('edit')
      setScopeOpen(true)
      setFormOpen(false)
      return
    }
    await updateSchedule(selectedItem.id, 'THIS', updatePayload)
    setFormOpen(false)
    setDetailOpen(false)
    await loadMonth(currentYear, currentMonthNumber)
  }

  async function handleDelete(scope: ScopeType) {
    if (!selectedItem) return
    if (selectedItem.isRecurring && scope === 'THIS' && !scopeOpen) {
      setScopeMode('delete')
      setScopeOpen(true)
      return
    }
    await deleteSchedule(selectedItem.id, scope)
    setDetailOpen(false)
    setScopeOpen(false)
    setSelectedItem(null)
    await loadMonth(currentYear, currentMonthNumber)
  }

  async function applyScope(scope: ScopeType) {
    if (!selectedItem) return
    if (scopeMode === 'delete') {
      await deleteSchedule(selectedItem.id, scope)
      setDetailOpen(false)
    }
    if (scopeMode === 'edit' && pendingUpdate) {
      await updateSchedule(selectedItem.id, scope, pendingUpdate)
      setPendingUpdate(null)
    }
    setScopeOpen(false)
    await loadMonth(currentYear, currentMonthNumber)
  }

  return {
    currentMonth,
    items,
    participants,
    selectedDate,
    selectedItem,
    detailOpen,
    formOpen,
    formMode,
    scopeOpen,
    scopeMode,
    loading,
    error,
    detailLoading,
    detailError,
    setCurrentMonth,
    openCreate,
    openDetail,
    submitCreate,
    submitEdit,
    handleDelete,
    applyScope,
    closeForm() {
      setFormOpen(false)
    },
    closeDetail() {
      detailRequestIdRef.current += 1
      setDetailLoading(false)
      setDetailError(null)
      setDetailOpen(false)
      setSelectedItem(null)
    },
    goToPreviousMonth() {
      setCurrentMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))
    },
    goToNextMonth() {
      setCurrentMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))
    },
    openCreateForCurrentMonth() {
      openCreate(`${currentYear}-${String(currentMonthNumber).padStart(2, '0')}-01`)
    },
    startEdit() {
      setFormMode('edit')
      setDetailOpen(false)
      setFormOpen(true)
    },
    closeScope() {
      setScopeOpen(false)
      setPendingUpdate(null)
    },
  }
}
