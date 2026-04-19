import type { ScheduleItem } from '../../types/schedule'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export const WEEK_TIMELINE_START_HOUR = 6
export const WEEK_TIMELINE_END_HOUR = 24
export const WEEK_TIMELINE_HOUR_WIDTH = 32
export const WEEK_TIMELINE_DAY_WIDTH = (WEEK_TIMELINE_END_HOUR - WEEK_TIMELINE_START_HOUR) * WEEK_TIMELINE_HOUR_WIDTH

export interface WeekDayItem {
  date: string
  dayLabel: string
  dateLabel: string
}

export interface WeekRange {
  startDate: string
  endDate: string
  days: WeekDayItem[]
}

export interface TimelineMonthKey {
  year: number
  month: number
}

export interface TimelineBlock {
  item: ScheduleItem
  left: number
  width: number
  lane: number
  clippedStart: boolean
  clippedEnd: boolean
}

export interface TimelineDay {
  date: string
  blocks: TimelineBlock[]
  laneCount: number
}

export interface TimelineRow {
  key: string
  label: string
  description: string
  days: TimelineDay[]
}

interface VisibleBlock {
  item: ScheduleItem
  date: string
  visibleStartMinutes: number
  visibleEndMinutes: number
  clippedStart: boolean
  clippedEnd: boolean
}

interface DayBucket {
  date: string
  visibleBlocks: VisibleBlock[]
}

function parseDateInputValue(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function getWeekRange(anchorDate: string): WeekRange {
  const anchor = parseDateInputValue(anchorDate)
  const weekday = anchor.getDay()
  const distanceToMonday = weekday === 0 ? 6 : weekday - 1
  const start = addDays(anchor, -distanceToMonday)
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(start, index)
    return {
      date: toDateInputValue(day),
      dayLabel: WEEKDAY_LABELS[day.getDay()],
      dateLabel: `${day.getMonth() + 1}.${String(day.getDate()).padStart(2, '0')}`,
    }
  })

  return {
    startDate: days[0].date,
    endDate: days[days.length - 1].date,
    days,
  }
}

export function getWeekLabel(anchorDate: string) {
  const range = getWeekRange(anchorDate)
  const start = parseDateInputValue(range.startDate)
  const end = parseDateInputValue(range.endDate)

  if (start.getFullYear() === end.getFullYear()) {
    if (start.getMonth() === end.getMonth()) {
      return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getDate()}일`
    }
    return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getMonth() + 1}월 ${end.getDate()}일`
  }

  return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getFullYear()}년 ${end.getMonth() + 1}월 ${end.getDate()}일`
}

export function getWeekMonthKeys(anchorDate: string): TimelineMonthKey[] {
  const uniqueMonths = new Map<string, TimelineMonthKey>()

  for (const day of getWeekRange(anchorDate).days) {
    const date = parseDateInputValue(day.date)
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`
    if (!uniqueMonths.has(key)) {
      uniqueMonths.set(key, {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      })
    }
  }

  return [...uniqueMonths.values()]
}

export function toTimelineMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function toVisibleBlock(item: ScheduleItem): VisibleBlock | null {
  const visibleStartBoundary = WEEK_TIMELINE_START_HOUR * 60
  const visibleEndBoundary = WEEK_TIMELINE_END_HOUR * 60
  const startMinutes = toTimelineMinutes(item.startTime)
  const endMinutes = toTimelineMinutes(item.endTime)
  const visibleStartMinutes = Math.max(startMinutes, visibleStartBoundary)
  const visibleEndMinutes = Math.min(endMinutes, visibleEndBoundary)

  if (visibleEndMinutes <= visibleStartBoundary || visibleStartMinutes >= visibleEndBoundary) {
    return null
  }

  return {
    item,
    date: item.date,
    visibleStartMinutes,
    visibleEndMinutes,
    clippedStart: startMinutes < visibleStartBoundary,
    clippedEnd: endMinutes > visibleEndBoundary,
  }
}

function toRowKey(item: ScheduleItem) {
  return item.resource ? `resource-${item.resource.id}` : 'resource-unassigned'
}

function toRowLabel(item: ScheduleItem) {
  return item.resource ? item.resource.name : '장소 미지정'
}

function toRowDescription(item: ScheduleItem) {
  return item.resource ? item.resource.category : '미지정 장소'
}

function compareVisibleBlocks(a: VisibleBlock, b: VisibleBlock) {
  if (a.visibleStartMinutes !== b.visibleStartMinutes) {
    return a.visibleStartMinutes - b.visibleStartMinutes
  }

  return a.visibleEndMinutes - b.visibleEndMinutes
}

function assignLanes(blocks: VisibleBlock[]) {
  const laneEndMinutes: number[] = []

  return blocks.map((block) => {
    let lane = laneEndMinutes.findIndex((value) => value <= block.visibleStartMinutes)
    if (lane === -1) {
      lane = laneEndMinutes.length
      laneEndMinutes.push(block.visibleEndMinutes)
    } else {
      laneEndMinutes[lane] = block.visibleEndMinutes
    }

    return {
      lane,
      laneCount: laneEndMinutes.length,
      block,
    }
  })
}

export function buildTimelineRows(items: ScheduleItem[], anchorDate: string): TimelineRow[] {
  const weekRange = getWeekRange(anchorDate)
  const dayLookup = new Set(weekRange.days.map((day) => day.date))
  const rows = new Map<
    string,
    {
      key: string
      label: string
      description: string
      days: DayBucket[]
    }
  >()

  for (const item of items) {
    if (!dayLookup.has(item.date)) continue

    const visibleBlock = toVisibleBlock(item)
    if (!visibleBlock) continue

    const rowKey = toRowKey(item)
    if (!rows.has(rowKey)) {
      rows.set(rowKey, {
        key: rowKey,
        label: toRowLabel(item),
        description: toRowDescription(item),
        days: weekRange.days.map((day) => ({
          date: day.date,
          visibleBlocks: [],
        })),
      })
    }

    const row = rows.get(rowKey)
    const day = row?.days.find((entry) => entry.date === item.date)
    if (day) {
      day.visibleBlocks.push(visibleBlock)
    }
  }

  const orderedRows = [...rows.values()].sort((a, b) => {
    if (a.key === 'resource-unassigned') return 1
    if (b.key === 'resource-unassigned') return -1
    return 0
  })

  return orderedRows.map((row) => ({
    key: row.key,
    label: row.label,
    description: row.description,
    days: row.days.map((day) => {
      const visibleBlocks = [...day.visibleBlocks].sort(compareVisibleBlocks)
      const assignedBlocks = assignLanes(visibleBlocks)

      return {
        date: day.date,
        blocks: assignedBlocks.map(({ block, lane }) => ({
          item: block.item,
          lane,
          left: ((block.visibleStartMinutes - WEEK_TIMELINE_START_HOUR * 60) / 60) * WEEK_TIMELINE_HOUR_WIDTH,
          width: Math.max(((block.visibleEndMinutes - block.visibleStartMinutes) / 60) * WEEK_TIMELINE_HOUR_WIDTH, 28),
          clippedStart: block.clippedStart,
          clippedEnd: block.clippedEnd,
        })),
        laneCount: assignedBlocks.reduce((max, entry) => Math.max(max, entry.laneCount), 1),
      }
    }),
  }))
}
