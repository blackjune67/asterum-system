import type { Participant } from './participant'

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
  recurrence: RecurrenceSummary | null
}

export interface ScheduleCreatePayload {
  title: string
  date: string
  startTime: string
  endTime: string
  participantIds: number[]
  recurrence: {
    enabled: boolean
    type: RecurrenceType
    interval: number
    endType: SeriesEndType
    untilDate?: string | null
    count?: number | null
  } | null
}

export interface ScheduleUpdatePayload {
  title: string
  date: string
  startTime: string
  endTime: string
  participantIds: number[]
}
