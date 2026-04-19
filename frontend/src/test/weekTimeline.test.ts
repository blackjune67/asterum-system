import { buildTimelineRows, getWeekLabel, getWeekMonthKeys, getWeekRange } from '../features/calendar/weekTimeline'
import type { ScheduleItem } from '../types/schedule'

function createScheduleItem(overrides: Partial<ScheduleItem> = {}): ScheduleItem {
  return {
    id: 1,
    seriesId: null,
    title: '촬영',
    date: '2026-04-15',
    startTime: '10:00:00',
    endTime: '12:00:00',
    isRecurring: false,
    isException: false,
    participantIds: [],
    participants: [],
    teamIds: [],
    teams: [],
    resource: null,
    recurrence: null,
    ...overrides,
  }
}

describe('weekTimeline', () => {
  test('uses Monday as the week start', () => {
    const range = getWeekRange('2026-04-19')

    expect(range.startDate).toBe('2026-04-13')
    expect(range.endDate).toBe('2026-04-19')
    expect(range.days.map((day) => day.dayLabel)).toEqual(['월', '화', '수', '목', '금', '토', '일'])
  })

  test('returns adjacent month keys for a cross-month week', () => {
    expect(getWeekMonthKeys('2026-04-01')).toEqual([
      { year: 2026, month: 3 },
      { year: 2026, month: 4 },
    ])
  })

  test('builds resource rows with overlap lanes and an unassigned row', () => {
    const rows = buildTimelineRows(
      [
        createScheduleItem({
          id: 1,
          title: '스튜디오 A 촬영',
          date: '2026-04-15',
          startTime: '09:00:00',
          endTime: '11:00:00',
          resource: { id: 3, name: '스튜디오 A', category: 'STUDIO' },
        }),
        createScheduleItem({
          id: 2,
          title: '겹치는 리허설',
          date: '2026-04-15',
          startTime: '10:00:00',
          endTime: '11:30:00',
          resource: { id: 3, name: '스튜디오 A', category: 'STUDIO' },
        }),
        createScheduleItem({
          id: 3,
          title: '야간 이동',
          date: '2026-04-15',
          startTime: '05:00:00',
          endTime: '07:00:00',
        }),
      ],
      '2026-04-15',
    )

    expect(rows).toHaveLength(2)
    expect(rows[0].label).toBe('스튜디오 A')
    expect(rows[0].days.find((day) => day.date === '2026-04-15')?.laneCount).toBe(2)
    expect(rows[1].label).toBe('장소 미지정')
    expect(rows[1].days.find((day) => day.date === '2026-04-15')?.blocks[0].clippedStart).toBe(true)
  })

  test('formats a readable week label', () => {
    expect(getWeekLabel('2026-05-01')).toBe('2026년 4월 27일 - 5월 3일')
  })
})
