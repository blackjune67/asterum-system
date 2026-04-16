import { render } from '@testing-library/react'
import { MonthGrid } from '../features/calendar/MonthGrid'
import type { ScheduleItem } from '../types/schedule'

const items: ScheduleItem[] = [
  {
    id: 1,
    seriesId: null,
    title: 'Shoot',
    date: '2026-04-15',
    startTime: '10:00:00',
    endTime: '12:00:00',
    isRecurring: false,
    isException: false,
    participantIds: [],
    participants: [],
    recurrence: null,
  },
]

test('does not render nested buttons for calendar cells and schedule items', () => {
  const { container } = render(
    <MonthGrid
      month={new Date(2026, 3, 1)}
      items={items}
      onSelectDate={() => {}}
      onSelectItem={() => {}}
    />,
  )

  expect(container.querySelector('button button')).toBeNull()
})
