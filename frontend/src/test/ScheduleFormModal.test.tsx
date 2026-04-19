import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ScheduleFormModal } from '../features/schedule/ScheduleFormModal'
import type { ScheduleItem } from '../types/schedule'
import { within } from '@testing-library/react'

test('shows recurrence fields when recurring is enabled', async () => {
  const user = userEvent.setup()

  render(
    <ScheduleFormModal
      open={true}
      mode="create"
      selectedDate="2026-04-20"
      participants={[]}
      teams={[]}
      resources={[]}
      onClose={() => {}}
      onSubmit={async () => {}}
    />,
  )

  await user.click(screen.getByLabelText('반복 일정'))

  expect(screen.getByText('반복 유형')).toBeInTheDocument()
  expect(screen.getByText('종료 조건')).toBeInTheDocument()
})

test('defaults recurrence type to daily and updates repeat options per type', async () => {
  const user = userEvent.setup()

  render(
    <ScheduleFormModal
      open={true}
      mode="create"
      selectedDate="2026-04-20"
      participants={[]}
      teams={[]}
      resources={[]}
      onClose={() => {}}
      onSubmit={async () => {}}
    />,
  )

  await user.click(screen.getByLabelText('반복 일정'))

  expect(screen.getByLabelText('반복 유형')).toHaveValue('DAILY')
  expect(screen.getByLabelText('반복')).toHaveValue('1')
  expect(screen.getByRole('option', { name: '1일' })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: '99일' })).toBeInTheDocument()

  await user.selectOptions(screen.getByLabelText('반복 유형'), 'WEEKLY')

  expect(screen.getByRole('option', { name: '1주' })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: '99주' })).toBeInTheDocument()
  expect(screen.queryByRole('option', { name: '1일' })).not.toBeInTheDocument()

  await user.selectOptions(screen.getByLabelText('반복 유형'), 'MONTHLY')

  expect(screen.getByRole('option', { name: '1개월' })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: '99개월' })).toBeInTheDocument()
  expect(screen.queryByRole('option', { name: '1주' })).not.toBeInTheDocument()
})

test('caps recurring count at 50', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn().mockResolvedValue(undefined)

  render(
    <ScheduleFormModal
      open={true}
      mode="create"
      selectedDate="2026-04-20"
      participants={[]}
      teams={[]}
      resources={[]}
      onClose={() => {}}
      onSubmit={onSubmit}
    />,
  )

  await user.type(screen.getByLabelText('제목'), '반복 일정 테스트')
  await user.click(screen.getByLabelText('반복 일정'))
  await user.clear(screen.getByLabelText('반복 횟수'))
  await user.type(screen.getByLabelText('반복 횟수'), '99')

  expect(screen.getByLabelText('반복 횟수')).toHaveAttribute('max', '50')
  expect(screen.getByLabelText('반복 횟수')).toHaveValue(50)

  await user.click(screen.getByRole('button', { name: '저장' }))

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      recurrence: expect.objectContaining({
        count: 50,
      }),
    }),
  )
})

test('resets create form fields when reopened with a new selected date', async () => {
  const user = userEvent.setup()
  const { rerender } = render(
    <ScheduleFormModal
      open={true}
      mode="create"
      selectedDate="2026-04-20"
      participants={[]}
      teams={[]}
      resources={[]}
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
      teams={[]}
      resources={[]}
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
      teams={[]}
      resources={[]}
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
    teamIds: [7],
    teams: [{ id: 7, name: '비주얼팀', memberIds: [4, 5], members: [] }],
    resource: { id: 3, name: '회의실 A', category: 'ROOM' },
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
      teams={[]}
      resources={[{ id: 3, name: '회의실 A', category: 'ROOM' }]}
      initialItem={initialItem}
      onClose={() => {}}
      onSubmit={async () => {}}
    />,
  )

  expect(screen.getByLabelText('제목')).toHaveValue('Edit me')
  expect(screen.getByLabelText('날짜')).toHaveValue('2026-04-23')
  expect(screen.getByLabelText('시작 시간')).toHaveValue('09:30')
  expect(screen.getByLabelText('종료 시간')).toHaveValue('11:00')
  expect(screen.getByLabelText('리소스')).toHaveValue('3')
})

test('constrains the modal within the viewport and enables internal scrolling', () => {
  render(
    <ScheduleFormModal
      open={true}
      mode="create"
      selectedDate="2026-04-20"
      participants={[]}
      teams={[]}
      resources={[]}
      onClose={() => {}}
      onSubmit={async () => {}}
    />,
  )

  const modal = screen.getByRole('heading', { name: '일정 등록' }).closest('.dream-modal')

  expect(modal).toHaveClass('max-h-[calc(100dvh-2rem)]')
  expect(modal).toHaveClass('overflow-y-auto')
})

test('separates member and staff participants in the form', () => {
  render(
    <ScheduleFormModal
      open={true}
      mode="create"
      selectedDate="2026-04-20"
      participants={[
        { id: 1, name: '예준', type: 'MEMBER' },
        { id: 2, name: '노아', type: 'MEMBER' },
        { id: 3, name: '카메라맨A', type: 'STAFF', teamId: 7, teamName: '영상팀' },
      ]}
      teams={[]}
      resources={[]}
      onClose={() => {}}
      onSubmit={async () => {}}
    />,
  )

  const memberSection = screen.getByRole('group', { name: '아티스트' })
  const staffSection = screen.getByRole('group', { name: '스태프' })

  expect(within(memberSection).getByLabelText('예준')).toBeInTheDocument()
  expect(within(memberSection).getByLabelText('노아')).toBeInTheDocument()
  expect(within(memberSection).getByLabelText('아티스트 전체 선택')).toBeInTheDocument()
  expect(within(memberSection).queryByLabelText('카메라맨A')).not.toBeInTheDocument()

  expect(within(staffSection).getByLabelText('카메라맨A')).toBeInTheDocument()
  expect(within(staffSection).getByText('영상팀')).toBeInTheDocument()
  expect(within(staffSection).queryByLabelText('예준')).not.toBeInTheDocument()
})

test('shows artist character images in color only when selected', async () => {
  const user = userEvent.setup()

  render(
    <ScheduleFormModal
      open={true}
      mode="create"
      selectedDate="2026-04-20"
      participants={[
        { id: 1, name: '예준', type: 'MEMBER' },
        { id: 2, name: '은호', type: 'MEMBER' },
      ]}
      teams={[]}
      resources={[]}
      onClose={() => {}}
      onSubmit={async () => {}}
    />,
  )

  const memberSection = screen.getByRole('group', { name: '아티스트' })
  const yeajunImage = within(memberSection).getByAltText('예준 캐릭터')

  expect(yeajunImage).toHaveAttribute('src', '/03_yeajun.svg')
  expect(yeajunImage).toHaveClass('grayscale')
  expect(yeajunImage).not.toHaveClass('grayscale-0')

  await user.click(within(memberSection).getByLabelText('예준'))

  expect(yeajunImage).toHaveClass('grayscale-0')
  expect(yeajunImage).toHaveClass('opacity-100')
})

test('toggles all artists with the select-all checkbox without affecting staff', async () => {
  const user = userEvent.setup()

  render(
    <ScheduleFormModal
      open={true}
      mode="create"
      selectedDate="2026-04-20"
      participants={[
        { id: 1, name: '예준', type: 'MEMBER' },
        { id: 2, name: '노아', type: 'MEMBER' },
        { id: 3, name: '카메라맨A', type: 'STAFF', teamId: 7, teamName: '영상팀' },
      ]}
      teams={[]}
      resources={[]}
      onClose={() => {}}
      onSubmit={async () => {}}
    />,
  )

  const memberSection = screen.getByRole('group', { name: '아티스트' })
  const selectAll = within(memberSection).getByLabelText('아티스트 전체 선택')
  const yeajun = within(memberSection).getByLabelText('예준')
  const noa = within(memberSection).getByLabelText('노아')
  const staff = screen.getByRole('group', { name: '스태프' })
  const staffCheckbox = within(staff).getByLabelText('카메라맨A')

  await user.click(selectAll)

  expect(yeajun).toBeChecked()
  expect(noa).toBeChecked()
  expect(staffCheckbox).not.toBeChecked()

  await user.click(selectAll)

  expect(yeajun).not.toBeChecked()
  expect(noa).not.toBeChecked()
  expect(staffCheckbox).not.toBeChecked()
})
