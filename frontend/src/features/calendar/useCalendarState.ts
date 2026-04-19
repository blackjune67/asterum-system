import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { calendarQueryKeys } from './queryKeys'

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function useCalendarState() {
  const queryClient = useQueryClient()
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()))
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [detailRequested, setDetailRequested] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [convertOpen, setConvertOpen] = useState(false)
  const [scopeOpen, setScopeOpen] = useState(false)
  const [scopeMode, setScopeMode] = useState<'edit' | 'delete'>('edit')
  const [pendingUpdate, setPendingUpdate] = useState<ScheduleUpdatePayload | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [convertError, setConvertError] = useState<string | null>(null)
  const currentYear = currentMonth.getFullYear()
  const currentMonthNumber = currentMonth.getMonth() + 1

  const monthQuery = useQuery({
    queryKey: calendarQueryKeys.month(currentYear, currentMonthNumber),
    queryFn: () => fetchSchedules(currentYear, currentMonthNumber),
  })
  const participantsQuery = useQuery({
    queryKey: calendarQueryKeys.participants(),
    queryFn: fetchParticipants,
    staleTime: 1000 * 60 * 5,
  })
  const teamsQuery = useQuery({
    queryKey: calendarQueryKeys.teams(),
    queryFn: fetchTeams,
    staleTime: 1000 * 60 * 5,
  })
  const resourcesQuery = useQuery({
    queryKey: calendarQueryKeys.resources(),
    queryFn: fetchResources,
    staleTime: 1000 * 60 * 5,
  })
  const detailQuery = useQuery({
    queryKey: selectedItemId === null ? calendarQueryKeys.schedules() : calendarQueryKeys.detail(selectedItemId),
    queryFn: () => fetchSchedule(selectedItemId as number),
    enabled: selectedItemId !== null,
    retry: false,
    staleTime: 1000 * 30,
  })

  useEffect(() => {
    if (selectedItemId === null || !detailRequested) return

    if (detailQuery.isSuccess && !detailOpen) {
      setDetailRequested(false)
      setDetailError(null)
      setDetailOpen(true)
      return
    }

    if (detailQuery.isError) {
      setDetailRequested(false)
      setSelectedItemId(null)
      setDetailOpen(false)
      setDetailError('일정 상세 정보를 불러오지 못했습니다.')
    }
  }, [detailOpen, detailQuery.isError, detailQuery.isSuccess, detailRequested, selectedItemId])

  const createMutation = useMutation({
    mutationFn: (payload: ScheduleCreatePayload) => createSchedule(payload),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, scope, payload }: { id: number; scope: ScopeType; payload: ScheduleUpdatePayload }) =>
      updateSchedule(id, scope, payload),
  })
  const deleteMutation = useMutation({
    mutationFn: ({ id, scope }: { id: number; scope: ScopeType }) => deleteSchedule(id, scope),
  })
  const convertMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ScheduleConvertPayload }) =>
      convertScheduleToSeries(id, payload),
  })

  const items = monthQuery.data ?? []
  const participants: Participant[] = participantsQuery.data ?? []
  const teams: Team[] = teamsQuery.data ?? []
  const resources: ResourceItem[] = resourcesQuery.data ?? []
  const selectedItem = detailQuery.data ?? null
  const lookupError =
    participantsQuery.error ?? teamsQuery.error ?? resourcesQuery.error
  const error = monthQuery.error
    ? toErrorMessage(monthQuery.error, 'Failed to load calendar data')
    : lookupError
      ? toErrorMessage(lookupError, 'Failed to load calendar lookups')
      : null
  const loading = monthQuery.isPending
  const detailLoading = selectedItemId !== null && detailQuery.isPending

  async function invalidateMonthQueries() {
    await queryClient.invalidateQueries({
      queryKey: calendarQueryKeys.months(),
    })
  }

  function openCreate(date: string) {
    setFormError(null)
    setSelectedDate(date)
    setFormMode('create')
    setFormOpen(true)
  }

  function openDetail(item: ScheduleItem) {
    setDetailRequested(true)
    setDetailError(null)
    setDetailOpen(false)
    setSelectedItemId(item.id)
  }

  async function submitCreate(payload: ScheduleCreatePayload | ScheduleUpdatePayload) {
    try {
      await createMutation.mutateAsync(payload as ScheduleCreatePayload)
      setFormError(null)
      setFormOpen(false)
      await invalidateMonthQueries()
    } catch (error) {
      setFormError(toErrorMessage(error, '일정을 저장하지 못했습니다.'))
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
      await updateMutation.mutateAsync({
        id: selectedItem.id,
        scope: 'THIS',
        payload: updatePayload,
      })
      setFormError(null)
      setFormOpen(false)
      setDetailOpen(false)
      setSelectedItemId(null)
      await invalidateMonthQueries()
    } catch (error) {
      setFormError(toErrorMessage(error, '일정을 수정하지 못했습니다.'))
    }
  }

  async function handleDelete(scope: ScopeType) {
    if (!selectedItem) return

    if (selectedItem.isRecurring && scope === 'THIS' && !scopeOpen) {
      setScopeMode('delete')
      setScopeOpen(true)
      return
    }

    try {
      await deleteMutation.mutateAsync({
        id: selectedItem.id,
        scope,
      })
      setDetailError(null)
      setDetailOpen(false)
      setScopeOpen(false)
      setSelectedItemId(null)
      await invalidateMonthQueries()
    } catch (error) {
      setDetailError(toErrorMessage(error, '일정을 삭제하지 못했습니다.'))
    }
  }

  async function applyScope(scope: ScopeType) {
    if (!selectedItem) return

    try {
      if (scopeMode === 'delete') {
        await deleteMutation.mutateAsync({
          id: selectedItem.id,
          scope,
        })
        setDetailOpen(false)
        setSelectedItemId(null)
      }

      if (scopeMode === 'edit' && pendingUpdate) {
        await updateMutation.mutateAsync({
          id: selectedItem.id,
          scope,
          payload: pendingUpdate,
        })
        setPendingUpdate(null)
        setSelectedItemId(null)
      }

      setFormError(null)
      setDetailError(null)
      setScopeOpen(false)
      await invalidateMonthQueries()
    } catch (error) {
      const message =
        scopeMode === 'delete' ? '일정을 삭제하지 못했습니다.' : '일정을 수정하지 못했습니다.'
      setDetailError(toErrorMessage(error, message))
    }
  }

  async function submitConvert(payload: ScheduleConvertPayload) {
    if (!selectedItem) return

    try {
      const converted = await convertMutation.mutateAsync({
        id: selectedItem.id,
        payload,
      })
      queryClient.setQueryData(calendarQueryKeys.detail(converted.id), converted)
      setConvertError(null)
      setConvertOpen(false)
      setDetailError(null)
      setDetailRequested(false)
      setSelectedItemId(converted.id)
      setDetailOpen(true)
      await invalidateMonthQueries()
    } catch (error) {
      setConvertError(toErrorMessage(error, '반복 일정으로 전환하지 못했습니다.'))
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
      setDetailRequested(false)
      setDetailError(null)
      setDetailOpen(false)
      setSelectedItemId(null)
    },
    openConvert() {
      if (!selectedItem || selectedItem.isRecurring) return
      setDetailRequested(false)
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
      setDetailRequested(false)
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
