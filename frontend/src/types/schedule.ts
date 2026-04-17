import type { Participant } from './participant'
import type { ResourceItem } from './resource'
import type { Team } from './team'

export type RecurrenceType = 'DAILY' | 'WEEKLY' | 'MONTHLY'
export type SeriesEndType = 'UNTIL_DATE' | 'COUNT' | 'NEVER'
export type ScopeType = 'THIS' | 'FOLLOWING' | 'ALL'

export interface RecurrenceSummary {
  type: RecurrenceType
  interval: number
  endType: SeriesEndType
  untilDate: string | null
  count: number | null
  anchorDate: string
}

export interface ScheduleItem {
  id: number
  seriesId: number | null
  title: string
  date: string
  startTime: string
  endTime: string
  isRecurring: boolean
  isException: boolean
  participantIds: number[]
  participants: Participant[]
  teamIds: number[]
  teams: Team[]
  resource: ResourceItem | null
  recurrence: RecurrenceSummary | null
}

export interface RecurrencePayload {
  enabled: boolean
  type: RecurrenceType
  interval: number
  endType: SeriesEndType
  untilDate?: string | null
  count?: number | null
}

export interface ScheduleCreatePayload {
  title: string
  date: string
  startTime: string
  endTime: string
  participantIds: number[]
  teamIds: number[]
  resourceId: number | null
  recurrence: RecurrencePayload | null
}

export interface ScheduleUpdatePayload {
  title: string
  date: string
  startTime: string
  endTime: string
  participantIds: number[]
  teamIds: number[]
  resourceId: number | null
}

export type ScheduleConvertPayload = RecurrencePayload
