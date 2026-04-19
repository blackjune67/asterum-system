import type { Participant, ParticipantType } from '../../types/participant'
import type { ScheduleItem, ScopeType } from '../../types/schedule'
import type { Team } from '../../types/team'
import { getParticipantCharacterImage } from '../participant/participantVisuals'
import { normalizeTime } from './dateUtils'

interface Props {
  item: ScheduleItem | null
  onClose: () => void
  onEdit: () => void
  onConvert: () => void
  onDelete: (scope: ScopeType) => Promise<void>
}

const participantSections: Array<{ label: string; type: ParticipantType }> = [
  { label: '아티스트', type: 'MEMBER' },
  { label: '스태프', type: 'STAFF' },
]

function formatRecurrence(recurrence: ScheduleItem['recurrence']) {
  if (!recurrence) {
    return '반복 없음'
  }

  const typeLabel =
    recurrence.type === 'DAILY' ? '매일' : recurrence.type === 'WEEKLY' ? '매주' : '매월'

  const endLabel =
    recurrence.endType === 'UNTIL_DATE'
      ? `종료 날짜 ${recurrence.untilDate ?? '-'}`
      : recurrence.endType === 'COUNT'
        ? `${recurrence.count ?? '-'}회 반복`
        : '무기한'

  return `${typeLabel} · ${recurrence.interval}회 간격 · ${endLabel}`
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-plum">{label}</span>
      <div className="dream-field flex min-h-[52px] items-center">{value}</div>
    </label>
  )
}

function ParticipantCards({ participants }: { participants: Participant[] }) {
  if (participants.length === 0) {
    return <div className="dream-field flex min-h-[52px] items-center">선택된 참여자 없음</div>
  }

  return (
    <div className="grid gap-4">
      {participantSections.map((section) => {
        const sectionParticipants = participants.filter((participant) => participant.type === section.type)

        if (sectionParticipants.length === 0) {
          return null
        }

        return (
          <div key={section.type} className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{section.label}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {sectionParticipants.map((participant) => {
                const characterImage = getParticipantCharacterImage(participant.name)

                return (
                  <div
                    key={participant.id}
                    className="dream-card flex items-center gap-3 px-4 py-3 text-sm text-plum"
                  >
                    {characterImage && (
                      <img
                        alt={`${participant.name} 캐릭터`}
                        className="h-14 w-14 shrink-0 rounded-2xl border border-white/70 bg-white/55 object-cover p-1"
                        src={characterImage}
                      />
                    )}
                    <div className="grid gap-1">
                      <span className="font-medium text-ink">{participant.name}</span>
                      <span className="text-xs uppercase tracking-[0.18em] text-accent">
                        {section.type === 'MEMBER' ? 'ARTIST' : 'STAFF'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TeamCards({ teams }: { teams: Team[] }) {
  if (teams.length === 0) {
    return <div className="dream-field flex min-h-[52px] items-center">선택된 팀 없음</div>
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {teams.map((team) => (
        <div key={team.id} className="dream-card flex items-center gap-3 px-4 py-3 text-sm text-plum">
          <div className="grid gap-1">
            <span className="font-medium text-ink">{team.name}</span>
            <span className="text-xs text-plum">{team.members.length}명 참여</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ScheduleDetailModal({ item, onClose, onEdit, onConvert, onDelete }: Props) {
  if (!item) return null

  return (
    <div className="dream-overlay fixed inset-0 z-30 flex items-center justify-center px-4">
      <div className="dream-modal max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
              {item.isRecurring ? 'Recurring Schedule' : 'One-time Schedule'}
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-ink">{item.title}</h3>
          </div>
          <button className="dream-button-secondary px-4 py-2 text-sm" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="mt-6 grid gap-5">
          <ReadonlyField label="제목" value={item.title} />

          <div className="grid gap-4 sm:grid-cols-3">
            <ReadonlyField label="날짜" value={item.date} />
            <ReadonlyField label="시작 시간" value={normalizeTime(item.startTime)} />
            <ReadonlyField label="종료 시간" value={normalizeTime(item.endTime)} />
          </div>

          <ReadonlyField label="장소" value={item.resource ? `${item.resource.name} (${item.resource.category})` : '선택 안 함'} />

          <ReadonlyField label="반복 일정" value={formatRecurrence(item.recurrence)} />

          <div className="grid gap-2">
            <span className="text-sm font-medium text-plum">참여자</span>
            <ParticipantCards participants={item.participants} />
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-medium text-plum">팀</span>
            <TeamCards teams={item.teams} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="dream-button-primary" onClick={onEdit}>
            수정
          </button>
          {!item.isRecurring && (
            <button className="dream-button-secondary" onClick={onConvert}>
              반복 일정으로 전환
            </button>
          )}
          <button
            className="dream-button-secondary text-rose-700"
            onClick={() => onDelete('THIS')}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}
