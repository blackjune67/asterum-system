import { useEffect, useMemo, useState } from 'react'
import { fetchParticipants } from '../../api/participants'
import { createSchedule, deleteSchedule, fetchSchedule, fetchSchedules, updateSchedule } from '../../api/schedules'
import type { Participant } from '../../types/participant'
import type { ScheduleCreatePayload, ScheduleItem, ScheduleUpdatePayload, ScopeType } from '../../types/schedule'
import { toDateInputValue } from '../schedule/dateUtils'

export function useCalendarState() {
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

  const monthParams = useMemo(
    () => ({
      year: currentMonth.getFullYear(),
      month: currentMonth.getMonth() + 1,
    }),
    [currentMonth],
  )

  async function loadMonth() {
    setLoading(true)
    setError(null)
    try {
      const [nextItems, nextParticipants] = await Promise.all([
        fetchSchedules(monthParams.year, monthParams.month),
        fetchParticipants(),
      ])
      setItems(nextItems)
      setParticipants(nextParticipants)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to load calendar data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMonth()
  }, [monthParams.year, monthParams.month])

  function openCreate(date: string) {
    setSelectedDate(date)
    setFormMode('create')
    setFormOpen(true)
  }

  async function openDetail(item: ScheduleItem) {
    const fresh = await fetchSchedule(item.id)
    setSelectedItem(fresh)
    setDetailOpen(true)
  }

  async function submitCreate(payload: ScheduleCreatePayload | ScheduleUpdatePayload) {
    await createSchedule(payload as ScheduleCreatePayload)
    setFormOpen(false)
    await loadMonth()
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
    await loadMonth()
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
    await loadMonth()
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
    await loadMonth()
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
    setCurrentMonth,
    setDetailOpen,
    setFormOpen,
    openCreate,
    openDetail,
    submitCreate,
    submitEdit,
    handleDelete,
    applyScope,
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
