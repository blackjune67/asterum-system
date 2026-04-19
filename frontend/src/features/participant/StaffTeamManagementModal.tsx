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

const modalActionPrimaryClass =
  'inline-flex h-10 items-center justify-center rounded-xl border border-accent/25 bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/30 sm:min-w-[148px]'

const modalActionSecondaryClass =
  'inline-flex h-10 items-center justify-center rounded-xl border border-[#e8d7e4] bg-[#fff8fc] px-4 text-sm font-semibold text-plum transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-w-[104px]'

const compactFieldClass = 'dream-field min-h-[40px] rounded-xl px-3 py-2 text-sm'
const compactEditorFieldClass = 'dream-field h-11 rounded-[1rem] px-3.5 py-2 text-[13px] leading-5'
const compactEditorFieldWrapClass = 'grid gap-1.5 sm:max-w-[22rem]'

const modalTabBaseClass =
  'inline-flex min-h-[40px] w-full items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2'

const modalTabActiveClass = `${modalTabBaseClass} border-accent/25 bg-accent text-white shadow-[0_10px_24px_rgba(231,124,188,0.22)] focus:ring-accent/30`

const modalTabInactiveClass = `${modalTabBaseClass} border-white/70 bg-white/78 text-plum focus:ring-accent/20`

const modalListActionClass =
  'inline-flex min-h-8 items-center justify-center rounded-md border border-[#e8d7e4] bg-[#fff8fc] px-3 py-1.5 text-xs font-semibold text-plum transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-accent/20'

const modalListDangerActionClass = `${modalListActionClass} text-rose-700`

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
  const isStaffTab = activeTab === 'staff'

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
      <div className="dream-modal max-h-[calc(100dvh-2rem)] max-w-4xl overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Roster Notes</p>
            <h3 className="mt-1.5 text-2xl font-semibold text-ink">참가자/팀 관리</h3>
            <p className="mt-1.5 text-sm text-plum">현장 운영에 필요한 개인 스태프와 팀 구성을 한 곳에서 정리합니다.</p>
          </div>
          <button
            className="dream-button-secondary inline-flex min-w-[72px] shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-sm"
            onClick={onClose}
            type="button"
          >
            닫기
          </button>
        </div>

        <div className="dream-card mt-4 grid gap-2 p-2.5 sm:grid-cols-2">
          <button
            className={isStaffTab ? modalTabActiveClass : modalTabInactiveClass}
            onClick={() => {
              setActiveTab('staff')
              setError(null)
            }}
            type="button"
          >
            개인 스태프 관리
          </button>
          <button
            className={isStaffTab ? modalTabInactiveClass : modalTabActiveClass}
            onClick={() => {
              setActiveTab('team')
              setError(null)
            }}
            type="button"
          >
            팀 관리
          </button>
        </div>

        {error && <p className="dream-card mt-4 px-4 py-3 text-sm text-rose-700">{error}</p>}

        {isStaffTab ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <form className="dream-card grid gap-3 p-4" onSubmit={handleStaffSubmit}>
              <div className="grid gap-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Editor</p>
                <h4 className="text-base font-semibold text-ink">개인 스태프 편집</h4>
                <p className="text-xs text-plum">이름과 소속 팀을 정리해 일정 등록 화면에서 바로 선택할 수 있게 합니다.</p>
              </div>

              <label className={compactEditorFieldWrapClass}>
                <span className="text-sm font-medium text-plum">개인 스태프 이름</span>
                <input
                  className={compactEditorFieldClass}
                  required
                  value={staffForm.name}
                  onChange={(event) => setStaffForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>

              <label className={compactEditorFieldWrapClass}>
                <span className="text-sm font-medium text-plum">소속 팀</span>
                <select
                  aria-label="소속 팀"
                  className={compactEditorFieldClass}
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

              <div className="flex flex-wrap gap-2 pt-1 sm:justify-start">
                <button className={modalActionPrimaryClass} type="submit">
                  {staffForm.editingId === null ? '개인 스태프 등록' : '개인 스태프 수정'}
                </button>
                {staffForm.editingId !== null && (
                  <button
                    className={modalActionSecondaryClass}
                    onClick={() => setStaffForm(createEmptyStaffForm())}
                    type="button"
                  >
                    취소
                  </button>
                )}
              </div>
            </form>

            <div className="dream-card grid gap-2.5 p-4">
              <div className="grid gap-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Roster</p>
                <h4 className="text-base font-semibold text-ink">등록된 개인 스태프</h4>
                <p className="text-xs text-plum">수정 또는 삭제할 대상을 선택해 현재 로스터를 빠르게 정리합니다.</p>
              </div>
              {staffParticipants.length === 0 ? (
                <div className={`${compactFieldClass} flex min-h-[44px] items-center`}>등록된 개인 스태프가 없습니다</div>
              ) : (
                staffParticipants.map((participant) => (
                  <div key={participant.id} className={`${compactFieldClass} grid gap-2 px-3.5 py-3`}>
                    <div className="grid gap-1">
                      <span className="font-medium text-ink">{participant.name}</span>
                      <span className="text-xs text-plum">{participant.teamName ?? '소속 팀 없음'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        className={modalListActionClass}
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
                        className={modalListDangerActionClass}
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
          <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <form className="dream-card grid gap-3 p-4" onSubmit={handleTeamSubmit}>
              <div className="grid gap-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Editor</p>
                <h4 className="text-base font-semibold text-ink">팀 편집</h4>
                <p className="text-xs text-plum">현장 성격에 맞는 팀 구성을 만들고, 스태프 배정 기준을 깔끔하게 유지합니다.</p>
              </div>

              <label className={compactEditorFieldWrapClass}>
                <span className="text-sm font-medium text-plum">팀 이름</span>
                <input
                  aria-label="팀 이름"
                  className={compactEditorFieldClass}
                  required
                  value={teamForm.name}
                  onChange={(event) => setTeamForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>

              <div className="flex flex-wrap gap-2 pt-1 sm:justify-start">
                <button className={modalActionPrimaryClass} type="submit">
                  {teamForm.editingId === null ? '팀 등록' : '팀 수정'}
                </button>
                {teamForm.editingId !== null && (
                  <button
                    className={modalActionSecondaryClass}
                    onClick={() => setTeamForm(createEmptyTeamForm())}
                    type="button"
                  >
                    취소
                  </button>
                )}
              </div>
            </form>

            <div className="dream-card grid gap-2.5 p-4">
              <div className="grid gap-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Roster</p>
                <h4 className="text-base font-semibold text-ink">등록된 팀</h4>
                <p className="text-xs text-plum">현재 운영 중인 팀을 확인하고 바로 수정하거나 삭제할 수 있습니다.</p>
              </div>
              {teams.length === 0 ? (
                <div className={`${compactFieldClass} flex min-h-[44px] items-center`}>등록된 팀이 없습니다</div>
              ) : (
                teams.map((team) => (
                  <div key={team.id} className={`${compactFieldClass} grid gap-2 px-3.5 py-3`}>
                    <div className="grid gap-1">
                      <span className="font-medium text-ink">{team.name}</span>
                      <span className="text-xs text-plum">{team.members.length}명 소속</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        className={modalListActionClass}
                        onClick={() => setTeamForm({ editingId: team.id, name: team.name })}
                        type="button"
                      >
                        {team.name} 수정
                      </button>
                      <button
                        className={modalListDangerActionClass}
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
