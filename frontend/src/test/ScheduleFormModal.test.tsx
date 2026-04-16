import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScheduleFormModal } from '../features/schedule/ScheduleFormModal'
import type { ScheduleItem } from '../types/schedule'

test('shows recurrence fields when recurring is enabled', async () => {
  const user = userEvent.setup()

  render(
    <ScheduleFormModal
      open={true}
      mode="create"
      selectedDate="2026-04-20"
      participants={[]}
      onClose={() => {}}
      onSubmit={async () => {}}
    />,
  )

  await user.click(screen.getByLabelText('반복 일정'))

  expect(screen.getByText('반복 유형')).toBeInTheDocument()
  expect(screen.getByText('종료 조건')).toBeInTheDocument()
})

test('resets create form fields when reopened with a new selected date', async () => {
  const user = userEvent.setup()
  const { rerender } = render(
    <ScheduleFormModal
      open={true}
      mode="create"
      selectedDate="2026-04-20"
      participants={[]}
      onClose={() => {}}
      onSubmit={async () => {}}
    />,
  )

  await user.type(screen.getByLabelText('제목'), 'Temporary title')

  rerender(
    <ScheduleFormModal
      open={false}
      mode="create"
      selectedDate="2026-04-20"
      participants={[]}
      onClose={() => {}}
      onSubmit={async () => {}}
    />,
  )

  rerender(
    <ScheduleFormModal
      open={true}
      mode="create"
      selectedDate="2026-04-25"
      participants={[]}
      onClose={() => {}}
      onSubmit={async () => {}}
    />,
  )

  expect(screen.getByLabelText('제목')).toHaveValue('')
  expect(screen.getByLabelText('날짜')).toHaveValue('2026-04-25')
})

test('loads edit mode values from the selected item', () => {
  const initialItem: ScheduleItem = {
    id: 1,
    seriesId: 11,
    title: 'Edit me',
    date: '2026-04-23',
    startTime: '09:30:00',
    endTime: '11:00:00',
    isRecurring: true,
    isException: false,
    participantIds: [2],
    participants: [],
    recurrence: {
      type: 'WEEKLY',
      interval: 2,
      endType: 'COUNT',
      untilDate: null,
      count: 8,
      anchorDate: '2026-04-23',
    },
  }

  render(
    <ScheduleFormModal
      open={true}
      mode="edit"
      selectedDate="2026-04-20"
      participants={[]}
      initialItem={initialItem}
      onClose={() => {}}
      onSubmit={async () => {}}
    />,
  )

  expect(screen.getByLabelText('제목')).toHaveValue('Edit me')
  expect(screen.getByLabelText('날짜')).toHaveValue('2026-04-23')
  expect(screen.getByLabelText('시작 시간')).toHaveValue('09:30')
  expect(screen.getByLabelText('종료 시간')).toHaveValue('11:00')
})
