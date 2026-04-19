import { useEffect, useState } from 'react'
import type { StaffMutationPayload, Participant } from '../../types/participant'
import type { Team, TeamMutationPayload } from '../../types/team'

type ManagementTab = 'staff' | 'team'

interface Props {
  open: boolean
  participants: Participant[]
  teams: Team[]
  onClose: () => void
  onCreateStaff: (payload: StaffMutationPayload) => Promise<void>
  onUpdateStaff: (id: number, payload: StaffMutationPayload) => Promise<void>
  onDeleteStaff: (id: number) => Promise<void>
  onCreateTeam: (payload: TeamMutationPayload) => Promise<void>
  onUpdateTeam: (id: number, payload: TeamMutationPayload) => Promise<void>
  onDeleteTeam: (id: number) => Promise<void>
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function createEmptyStaffForm() {
  return {
    editingId: null as number | null,
    name: '',
    teamId: '',
  }
}

function createEmptyTeamForm() {
  return {
    editingId: null as number | null,
    name: '',
  }
}

export function StaffTeamManagementModal({
  open,
  participants,
  teams,
  onClose,
  onCreateStaff,
  onUpdateStaff,
  onDeleteStaff,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
}: Props) {
  const [activeTab, setActiveTab] = useState<ManagementTab>('staff')
  const [staffForm, setStaffForm] = useState(createEmptyStaffForm)
  const [teamForm, setTeamForm] = useState(createEmptyTeamForm)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setActiveTab('staff')
    setStaffForm(createEmptyStaffForm())
    setTeamForm(createEmptyTeamForm())
    setError(null)
  }, [open])

  if (!open) return null

  const staffParticipants = participants.filter((participant) => participant.type === 'STAFF')

  async function handleStaffSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const payload: StaffMutationPayload = {
      name: staffForm.name.trim(),
      type: 'STAFF',
      teamId: Number(staffForm.teamId),
    }

    try {
      if (staffForm.editingId === null) {
        await onCreateStaff(payload)
      } else {
        await onUpdateStaff(staffForm.editingId, payload)
      }
      setStaffForm(createEmptyStaffForm())
      setError(null)
    } catch (error) {
      setError(toErrorMessage(error, '개인 스태프를 저장하지 못했습니다.'))
    }
  }

  async function handleTeamSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const payload: TeamMutationPayload = {
      name: teamForm.name.trim(),
    }

    try {
      if (teamForm.editingId === null) {
        await onCreateTeam(payload)
      } else {
        await onUpdateTeam(teamForm.editingId, payload)
      }
      setTeamForm(createEmptyTeamForm())
      setError(null)
    } catch (error) {
      setError(toErrorMessage(error, '팀을 저장하지 못했습니다.'))
    }
  }

  async function handleStaffDelete(id: number) {
    try {
      await onDeleteStaff(id)
      if (staffForm.editingId === id) {
        setStaffForm(createEmptyStaffForm())
      }
      setError(null)
    } catch (error) {
      setError(toErrorMessage(error, '개인 스태프를 삭제하지 못했습니다.'))
    }
  }

  async function handleTeamDelete(id: number) {
    try {
      await onDeleteTeam(id)
      if (teamForm.editingId === id) {
        setTeamForm(createEmptyTeamForm())
      }
      setError(null)
    } catch (error) {
      setError(toErrorMessage(error, '팀을 삭제하지 못했습니다.'))
    }
  }

  return (
    <div className="dream-overlay fixed inset-0 z-30 flex items-center justify-center px-4">
      <div className="dream-modal max-h-[calc(100dvh-2rem)] max-w-3xl overflow-y-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Roster Control</p>
            <h3 className="mt-2 text-2xl font-semibold text-ink">참가자/팀 관리</h3>
          </div>
          <button className="dream-button-secondary px-4 py-2 text-sm" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            className={activeTab === 'staff' ? 'dream-button-primary' : 'dream-button-secondary'}
            onClick={() => {
              setActiveTab('staff')
              setError(null)
            }}
            type="button"
          >
            개인 스태프 관리
          </button>
          <button
            className={activeTab === 'team' ? 'dream-button-primary' : 'dream-button-secondary'}
            onClick={() => {
              setActiveTab('team')
              setError(null)
            }}
            type="button"
          >
            팀 관리
          </button>
        </div>

        {error && <p className="dream-card mt-5 px-4 py-3 text-sm text-rose-700">{error}</p>}

        {activeTab === 'staff' ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <form className="grid gap-4" onSubmit={handleStaffSubmit}>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-plum">개인 스태프 이름</span>
                <input
                  className="dream-field"
                  required
                  value={staffForm.name}
                  onChange={(event) => setStaffForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-plum">소속 팀</span>
                <select
                  aria-label="소속 팀"
                  className="dream-field"
                  required
                  value={staffForm.teamId}
                  onChange={(event) => setStaffForm((current) => ({ ...current, teamId: event.target.value }))}
                >
                  <option value="">팀 선택</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap gap-2">
                <button className="dream-button-primary" type="submit">
                  {staffForm.editingId === null ? '개인 스태프 등록' : '개인 스태프 수정'}
                </button>
                {staffForm.editingId !== null && (
                  <button
                    className="dream-button-secondary"
                    onClick={() => setStaffForm(createEmptyStaffForm())}
                    type="button"
                  >
                    취소
                  </button>
                )}
              </div>
            </form>

            <div className="grid gap-3">
              {staffParticipants.length === 0 ? (
                <div className="dream-field flex min-h-[52px] items-center">등록된 개인 스태프가 없습니다</div>
              ) : (
                staffParticipants.map((participant) => (
                  <div key={participant.id} className="dream-card grid gap-3 px-4 py-3">
                    <div className="grid gap-1">
                      <span className="font-medium text-ink">{participant.name}</span>
                      <span className="text-xs text-plum">{participant.teamName ?? '소속 팀 없음'}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="dream-button-secondary px-4 py-2 text-sm"
                        onClick={() =>
                          setStaffForm({
                            editingId: participant.id,
                            name: participant.name,
                            teamId: participant.teamId ? String(participant.teamId) : '',
                          })
                        }
                        type="button"
                      >
                        {participant.name} 수정
                      </button>
                      <button
                        className="dream-button-secondary px-4 py-2 text-sm text-rose-700"
                        onClick={() => void handleStaffDelete(participant.id)}
                        type="button"
                      >
                        {participant.name} 삭제
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <form className="grid gap-4" onSubmit={handleTeamSubmit}>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-plum">팀 이름</span>
                <input
                  aria-label="팀 이름"
                  className="dream-field"
                  required
                  value={teamForm.name}
                  onChange={(event) => setTeamForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button className="dream-button-primary" type="submit">
                  {teamForm.editingId === null ? '팀 등록' : '팀 수정'}
                </button>
                {teamForm.editingId !== null && (
                  <button
                    className="dream-button-secondary"
                    onClick={() => setTeamForm(createEmptyTeamForm())}
                    type="button"
                  >
                    취소
                  </button>
                )}
              </div>
            </form>

            <div className="grid gap-3">
              {teams.length === 0 ? (
                <div className="dream-field flex min-h-[52px] items-center">등록된 팀이 없습니다</div>
              ) : (
                teams.map((team) => (
                  <div key={team.id} className="dream-card grid gap-3 px-4 py-3">
                    <div className="grid gap-1">
                      <span className="font-medium text-ink">{team.name}</span>
                      <span className="text-xs text-plum">{team.members.length}명 소속</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="dream-button-secondary px-4 py-2 text-sm"
                        onClick={() => setTeamForm({ editingId: team.id, name: team.name })}
                        type="button"
                      >
                        {team.name} 수정
                      </button>
                      <button
                        className="dream-button-secondary px-4 py-2 text-sm text-rose-700"
                        onClick={() => void handleTeamDelete(team.id)}
                        type="button"
                      >
                        {team.name} 삭제
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
