import { useEffect, useMemo } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { createParticipant, deleteParticipant, fetchParticipants, updateParticipant } from '../../api/participants'
import { fetchResources } from '../../api/resources'
import {
  convertScheduleToSeries,
  createSchedule,
  deleteSchedule,
  fetchSchedule,
  fetchSchedules,
  updateSchedule,
} from '../../api/schedules'
import { createTeam, deleteTeam, fetchTeams, updateTeam } from '../../api/teams'
import type { Participant, StaffMutationPayload } from '../../types/participant'
import type { ResourceItem } from '../../types/resource'
import type {
  ScheduleConvertPayload,
  ScheduleCreatePayload,
  ScheduleUpdatePayload,
  ScopeType,
} from '../../types/schedule'
import type { Team, TeamMutationPayload } from '../../types/team'
import { calendarUiStore, useCalendarUiStore } from './calendarUiStore'
import { calendarQueryKeys } from './queryKeys'
import { getWeekMonthKeys } from './weekTimeline'

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function useCalendarState() {
  const queryClient = useQueryClient()
  const currentMonth = useCalendarUiStore((state) => state.currentMonth)
  const selectedDate = useCalendarUiStore((state) => state.selectedDate)
  const calendarView = useCalendarUiStore((state) => state.calendarView)
  const selectedItemId = useCalendarUiStore((state) => state.selectedItemId)
  const detailRequested = useCalendarUiStore((state) => state.detailRequested)
  const detailOpen = useCalendarUiStore((state) => state.detailOpen)
  const pendingUpdate = useCalendarUiStore((state) => state.pendingUpdate)
  const scopeMode = useCalendarUiStore((state) => state.scopeMode)
  const scopeOpen = useCalendarUiStore((state) => state.scopeOpen)
  const setFormError = useCalendarUiStore((state) => state.setFormError)
  const setDetailError = useCalendarUiStore((state) => state.setDetailError)
  const setConvertError = useCalendarUiStore((state) => state.setConvertError)
  const openDetailSuccess = useCalendarUiStore((state) => state.openDetailSuccess)
  const openDetailFailure = useCalendarUiStore((state) => state.openDetailFailure)
  const openScope = useCalendarUiStore((state) => state.openScope)
  const currentYear = currentMonth.getFullYear()
  const currentMonthNumber = currentMonth.getMonth() + 1

  const monthQuery = useQuery({
    queryKey: calendarQueryKeys.month(currentYear, currentMonthNumber),
    queryFn: () => fetchSchedules(currentYear, currentMonthNumber),
  })
  const weekMonthKeys = useMemo(
    () =>
      getWeekMonthKeys(selectedDate).filter(
        ({ year, month }) => year !== currentYear || month !== currentMonthNumber,
      ),
    [currentMonthNumber, currentYear, selectedDate],
  )
  const weekMonthQueries = useQueries({
    queries: weekMonthKeys.map(({ year, month }) => ({
      queryKey: calendarQueryKeys.month(year, month),
      queryFn: () => fetchSchedules(year, month),
      enabled: calendarView === 'week',
    })),
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
      openDetailSuccess()
      return
    }

    if (detailQuery.isError) {
      openDetailFailure('일정 상세 정보를 불러오지 못했습니다.')
    }
  }, [detailOpen, detailQuery.isError, detailQuery.isSuccess, detailRequested, openDetailFailure, openDetailSuccess, selectedItemId])

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
  const createParticipantMutation = useMutation({
    mutationFn: (payload: StaffMutationPayload) => createParticipant(payload),
  })
  const updateParticipantMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: StaffMutationPayload }) => updateParticipant(id, payload),
  })
  const deleteParticipantMutation = useMutation({
    mutationFn: (id: number) => deleteParticipant(id),
  })
  const createTeamMutation = useMutation({
    mutationFn: (payload: TeamMutationPayload) => createTeam(payload),
  })
  const updateTeamMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TeamMutationPayload }) => updateTeam(id, payload),
  })
  const deleteTeamMutation = useMutation({
    mutationFn: (id: number) => deleteTeam(id),
  })

  const items = monthQuery.data ?? []
  const weekItems = useMemo(() => {
    const merged = new Map<string, (typeof items)[number]>()
    const appendItems = (source: typeof items) => {
      for (const item of source) {
        merged.set(`${item.id}-${item.date}-${item.startTime}-${item.endTime}`, item)
      }
    }

    appendItems(items)
    for (const query of weekMonthQueries) {
      appendItems(query.data ?? [])
    }

    return [...merged.values()]
  }, [items, weekMonthQueries])
  const participants: Participant[] = participantsQuery.data ?? []
  const teams: Team[] = teamsQuery.data ?? []
  const resources: ResourceItem[] = resourcesQuery.data ?? []
  const selectedItem = detailQuery.data ?? null
  const lookupError = participantsQuery.error ?? teamsQuery.error ?? resourcesQuery.error
  const weekError = weekMonthQueries.find((query) => query.error)?.error ?? null
  const error = monthQuery.error
    ? toErrorMessage(monthQuery.error, 'Failed to load calendar data')
    : weekError
      ? toErrorMessage(weekError, 'Failed to load calendar data')
    : lookupError
      ? toErrorMessage(lookupError, 'Failed to load calendar lookups')
      : null
  const loading = calendarView === 'week' ? monthQuery.isPending || weekMonthQueries.some((query) => query.isPending) : monthQuery.isPending
  const detailLoading = selectedItemId !== null && detailQuery.isPending

  async function invalidateMonthQueries() {
    await queryClient.invalidateQueries({
      queryKey: calendarQueryKeys.months(),
    })
  }

  async function invalidateLookupQueries() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.participants() }),
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.teams() }),
    ])
  }

  async function submitCreate(payload: ScheduleCreatePayload | ScheduleUpdatePayload) {
    try {
      await createMutation.mutateAsync(payload as ScheduleCreatePayload)
      calendarUiStore.setState({
        formError: null,
        formOpen: false,
      })
      await invalidateMonthQueries()
    } catch (error) {
      setFormError(toErrorMessage(error, '일정을 저장하지 못했습니다.'))
    }
  }

  async function submitEdit(payload: ScheduleCreatePayload | ScheduleUpdatePayload) {
    if (!selectedItem) return

    const updatePayload = payload as ScheduleUpdatePayload
    if (selectedItem.isRecurring) {
      openScope('edit', updatePayload)
      calendarUiStore.setState({
        formOpen: false,
      })
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: selectedItem.id,
        scope: 'THIS',
        payload: updatePayload,
      })
      calendarUiStore.setState({
        formError: null,
        formOpen: false,
        detailOpen: false,
        selectedItemId: null,
        pendingUpdate: null,
      })
      await invalidateMonthQueries()
    } catch (error) {
      setFormError(toErrorMessage(error, '일정을 수정하지 못했습니다.'))
    }
  }

  async function handleDelete(scope: ScopeType) {
    if (!selectedItem) return

    if (selectedItem.isRecurring && scope === 'THIS' && !scopeOpen) {
      openScope('delete')
      return
    }

    try {
      await deleteMutation.mutateAsync({
        id: selectedItem.id,
        scope,
      })
      calendarUiStore.setState({
        detailError: null,
        detailOpen: false,
        scopeOpen: false,
        selectedItemId: null,
        pendingUpdate: null,
      })
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
        calendarUiStore.setState({
          detailOpen: false,
          selectedItemId: null,
        })
      }

      if (scopeMode === 'edit' && pendingUpdate) {
        await updateMutation.mutateAsync({
          id: selectedItem.id,
          scope,
          payload: pendingUpdate,
        })
        calendarUiStore.setState({
          selectedItemId: null,
          pendingUpdate: null,
        })
      }

      calendarUiStore.setState({
        formError: null,
        detailError: null,
        scopeOpen: false,
        pendingUpdate: null,
      })
      await invalidateMonthQueries()
    } catch (error) {
      const message = scopeMode === 'delete' ? '일정을 삭제하지 못했습니다.' : '일정을 수정하지 못했습니다.'
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
      calendarUiStore.setState({
        convertError: null,
        convertOpen: false,
        detailError: null,
        detailRequested: false,
        selectedItemId: converted.id,
        detailOpen: true,
      })
      await invalidateMonthQueries()
    } catch (error) {
      setConvertError(toErrorMessage(error, '반복 일정으로 전환하지 못했습니다.'))
    }
  }

  async function createStaff(payload: StaffMutationPayload) {
    try {
      await createParticipantMutation.mutateAsync(payload)
      await invalidateLookupQueries()
    } catch (error) {
      throw new Error(toErrorMessage(error, '개인 스태프를 등록하지 못했습니다.'))
    }
  }

  async function updateStaff(id: number, payload: StaffMutationPayload) {
    try {
      await updateParticipantMutation.mutateAsync({ id, payload })
      await invalidateLookupQueries()
    } catch (error) {
      throw new Error(toErrorMessage(error, '개인 스태프를 수정하지 못했습니다.'))
    }
  }

  async function deleteStaff(id: number) {
    try {
      await deleteParticipantMutation.mutateAsync(id)
      await invalidateLookupQueries()
    } catch (error) {
      throw new Error(toErrorMessage(error, '개인 스태프를 삭제하지 못했습니다.'))
    }
  }

  async function createTeamItem(payload: TeamMutationPayload) {
    try {
      await createTeamMutation.mutateAsync(payload)
      await invalidateLookupQueries()
    } catch (error) {
      throw new Error(toErrorMessage(error, '팀을 등록하지 못했습니다.'))
    }
  }

  async function updateTeamItem(id: number, payload: TeamMutationPayload) {
    try {
      await updateTeamMutation.mutateAsync({ id, payload })
      await invalidateLookupQueries()
    } catch (error) {
      throw new Error(toErrorMessage(error, '팀을 수정하지 못했습니다.'))
    }
  }

  async function deleteTeamItem(id: number) {
    try {
      await deleteTeamMutation.mutateAsync(id)
      await invalidateLookupQueries()
    } catch (error) {
      throw new Error(toErrorMessage(error, '팀을 삭제하지 못했습니다.'))
    }
  }

  return {
    items,
    weekItems,
    participants,
    teams,
    resources,
    selectedItem,
    loading,
    error,
    detailLoading,
    submitCreate,
    submitEdit,
    handleDelete,
    applyScope,
    submitConvert,
    createStaff,
    updateStaff,
    deleteStaff,
    createTeamItem,
    updateTeamItem,
    deleteTeamItem,
  }
}
