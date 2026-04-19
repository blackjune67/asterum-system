import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StaffTeamManagementModal } from '../features/participant/StaffTeamManagementModal'

test('creates a staff participant with a required team selection', async () => {
  const user = userEvent.setup()
  const onCreateStaff = vi.fn().mockResolvedValue(undefined)

  render(
    <StaffTeamManagementModal
      open={true}
      participants={[]}
      teams={[{ id: 7, name: '영상팀', memberIds: [], members: [] }]}
      onClose={() => {}}
      onCreateStaff={onCreateStaff}
      onUpdateStaff={vi.fn()}
      onDeleteStaff={vi.fn()}
      onCreateTeam={vi.fn()}
      onUpdateTeam={vi.fn()}
      onDeleteTeam={vi.fn()}
    />,
  )

  await user.type(screen.getByLabelText('개인 스태프 이름'), '카메라맨A')
  await user.selectOptions(screen.getByLabelText('소속 팀'), '7')
  await user.click(screen.getByRole('button', { name: '개인 스태프 등록' }))

  expect(onCreateStaff).toHaveBeenCalledWith({
    name: '카메라맨A',
    type: 'STAFF',
    teamId: 7,
  })
})

test('supports editing and deleting teams', async () => {
  const user = userEvent.setup()
  const onUpdateTeam = vi.fn().mockResolvedValue(undefined)
  const onDeleteTeam = vi.fn().mockResolvedValue(undefined)

  render(
    <StaffTeamManagementModal
      open={true}
      participants={[]}
      teams={[{ id: 7, name: '영상팀', memberIds: [], members: [] }]}
      onClose={() => {}}
      onCreateStaff={vi.fn()}
      onUpdateStaff={vi.fn()}
      onDeleteStaff={vi.fn()}
      onCreateTeam={vi.fn()}
      onUpdateTeam={onUpdateTeam}
      onDeleteTeam={onDeleteTeam}
    />,
  )

  await user.click(screen.getByRole('button', { name: '팀 관리' }))
  await user.click(screen.getByRole('button', { name: '영상팀 수정' }))
  await user.clear(screen.getByLabelText('팀 이름'))
  await user.type(screen.getByLabelText('팀 이름'), '메인영상팀')
  await user.click(screen.getByRole('button', { name: '팀 수정' }))
  await user.click(screen.getByRole('button', { name: '영상팀 삭제' }))

  expect(onUpdateTeam).toHaveBeenCalledWith(7, { name: '메인영상팀' })
  expect(onDeleteTeam).toHaveBeenCalledWith(7)
})

test('shows mutation errors inside the modal', async () => {
  const user = userEvent.setup()

  render(
    <StaffTeamManagementModal
      open={true}
      participants={[]}
      teams={[{ id: 7, name: '영상팀', memberIds: [], members: [] }]}
      onClose={() => {}}
      onCreateStaff={vi.fn().mockRejectedValue(new Error('일정에서 사용 중인 팀은 삭제할 수 없습니다'))}
      onUpdateStaff={vi.fn()}
      onDeleteStaff={vi.fn()}
      onCreateTeam={vi.fn()}
      onUpdateTeam={vi.fn()}
      onDeleteTeam={vi.fn()}
    />,
  )

  await user.type(screen.getByLabelText('개인 스태프 이름'), '카메라맨A')
  await user.selectOptions(screen.getByLabelText('소속 팀'), '7')
  await user.click(screen.getByRole('button', { name: '개인 스태프 등록' }))

  expect(await screen.findByText('일정에서 사용 중인 팀은 삭제할 수 없습니다')).toBeInTheDocument()
})
