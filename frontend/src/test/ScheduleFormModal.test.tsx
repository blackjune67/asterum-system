import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScheduleFormModal } from '../features/schedule/ScheduleFormModal'

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
