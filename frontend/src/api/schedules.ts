import { apiGet, apiGetCached, apiSend, invalidateApiGetCache } from './client'
import type {
  ScheduleConvertPayload,
  ScheduleCreatePayload,
  ScheduleItem,
  ScheduleUpdatePayload,
  ScopeType,
} from '../types/schedule'

export function fetchSchedules(year: number, month: number) {
  return apiGetCached<ScheduleItem[]>(`/schedules?year=${year}&month=${month}`)
}

export function fetchSchedule(id: number) {
  return apiGet<ScheduleItem>(`/schedules/${id}`)
}

export function createSchedule(payload: ScheduleCreatePayload) {
  invalidateScheduleMonthCache()
  return apiSend<ScheduleItem>('/schedules', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateSchedule(id: number, scope: ScopeType, payload: ScheduleUpdatePayload) {
  invalidateScheduleMonthCache()
  return apiSend<ScheduleItem>(`/schedules/${id}?scope=${scope}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteSchedule(id: number, scope: ScopeType) {
  invalidateScheduleMonthCache()
  return apiSend<void>(`/schedules/${id}?scope=${scope}`, {
    method: 'DELETE',
  })
}

export function convertScheduleToSeries(id: number, payload: ScheduleConvertPayload) {
  invalidateScheduleMonthCache()
  return apiSend<ScheduleItem>(`/schedules/${id}/convert-to-series`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

function invalidateScheduleMonthCache() {
  invalidateApiGetCache('/schedules?')
}
