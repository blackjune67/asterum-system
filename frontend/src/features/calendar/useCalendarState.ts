import { useEffect, useRef, useState } from 'react'
import { fetchParticipants } from '../../api/participants'
import { fetchResources } from '../../api/resources'
import {
  convertScheduleToSeries,
  createSchedule,
  deleteSchedule,
  fetchSchedule,
  fetchSchedules,
  updateSchedule,
} from '../../api/schedules'
import { fetchTeams } from '../../api/teams'
import type { Participant } from '../../types/participant'
import type { ResourceItem } from '../../types/resource'
import type {
  ScheduleConvertPayload,
  ScheduleCreatePayload,
  ScheduleItem,
  ScheduleUpdatePayload,
  ScopeType,
} from '../../types/schedule'
import type { Team } from '../../types/team'
import { toDateInputValue } from '../schedule/dateUtils'

export function useCalendarState() {
  const monthRequestIdRef = useRef(0)
  const detailRequestIdRef = useRef(0)
  const lookupRequestIdRef = useRef(0)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()))
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [convertOpen, setConvertOpen] = useState(false)
  const [scopeOpen, setScopeOpen] = useState(false)
  const [scopeMode, setScopeMode] = useState<'edit' | 'delete'>('edit')
  const [pendingUpdate, setPendingUpdate] = useState<ScheduleUpdatePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [convertError, setConvertError] = useState<string | null>(null)
  const currentYear = currentMonth.getFullYear()
  const currentMonthNumber = currentMonth.getMonth() + 1

  async function loadMonth(year: number, month: number) {
    const requestId = ++monthRequestIdRef.current
    setLoading(true)
    setError(null)
    try {
      const nextItems = await fetchSchedules(year, month)
      if (requestId !== monthRequestIdRef.current) return
      setItems(nextItems)
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

  useEffect(() => {
    const requestId = ++lookupRequestIdRef.current
    void (async () => {
      try {
        const [nextParticipants, nextTeams, nextResources] = await Promise.all([
          fetchParticipants(),
          fetchTeams(),
          fetchResources(),
        ])
        if (requestId !== lookupRequestIdRef.current) return
        setParticipants(nextParticipants)
        setTeams(nextTeams)
        setResources(nextResources)
      } catch (cause) {
        if (requestId !== lookupRequestIdRef.current) return
        setError(cause instanceof Error ? cause.message : 'Failed to load calendar lookups')
      }
    })()
  }, [])

  function openCreate(date: string) {
    setFormError(null)
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
    try {
      await createSchedule(payload as ScheduleCreatePayload)
      setFormError(null)
      setFormOpen(false)
      await loadMonth(currentYear, currentMonthNumber)
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : '일정을 저장하지 못했습니다.')
    }
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
    try {
      await updateSchedule(selectedItem.id, 'THIS', updatePayload)
      setFormError(null)
      setFormOpen(false)
      setDetailOpen(false)
      await loadMonth(currentYear, currentMonthNumber)
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : '일정을 수정하지 못했습니다.')
    }
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

  async function submitConvert(payload: ScheduleConvertPayload) {
    if (!selectedItem) return
    try {
      const converted = await convertScheduleToSeries(selectedItem.id, payload)
      setConvertError(null)
      setConvertOpen(false)
      setSelectedItem(converted)
      setDetailOpen(true)
      await loadMonth(currentYear, currentMonthNumber)
    } catch (cause) {
      setConvertError(cause instanceof Error ? cause.message : '반복 일정으로 전환하지 못했습니다.')
    }
  }

  return {
    currentMonth,
    items,
    participants,
    teams,
    resources,
    selectedDate,
    selectedItem,
    detailOpen,
    formOpen,
    formMode,
    convertOpen,
    scopeOpen,
    scopeMode,
    loading,
    error,
    detailLoading,
    detailError,
    formError,
    convertError,
    setCurrentMonth,
    openCreate,
    openDetail,
    submitCreate,
    submitEdit,
    handleDelete,
    applyScope,
    submitConvert,
    closeForm() {
      setFormError(null)
      setFormOpen(false)
    },
    closeDetail() {
      detailRequestIdRef.current += 1
      setDetailLoading(false)
      setDetailError(null)
      setDetailOpen(false)
      setSelectedItem(null)
    },
    openConvert() {
      if (!selectedItem || selectedItem.isRecurring) return
      setConvertError(null)
      setDetailOpen(false)
      setConvertOpen(true)
    },
    closeConvert() {
      setConvertError(null)
      setConvertOpen(false)
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
