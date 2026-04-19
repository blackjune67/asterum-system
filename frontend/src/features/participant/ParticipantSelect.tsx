import type { Participant } from '../../types/participant'
import type { ParticipantType } from '../../types/participant'
import { getParticipantCharacterImage } from './participantVisuals'

type ParticipantSelectionUpdate = number[] | ((currentIds: number[]) => number[])

const participantSections: Array<{ label: string; type: ParticipantType }> = [
  { label: '아티스트', type: 'MEMBER' },
  { label: '스태프', type: 'STAFF' },
]

interface Props {
  participants: Participant[]
  selectedIds: number[]
  lockedIds?: number[]
  onChange: (update: ParticipantSelectionUpdate) => void
}

export function ParticipantSelect({ participants, selectedIds, lockedIds = [], onChange }: Props) {
  const effectiveSelectedIds = Array.from(new Set([...selectedIds, ...lockedIds]))

  return (
    <div className="grid gap-4">
      {participantSections.map((section) => {
        const sectionParticipants = participants.filter((participant) => participant.type === section.type)
        const selectableIds = sectionParticipants.map((participant) => participant.id)
        const allChecked = selectableIds.length > 0 && selectableIds.every((id) => effectiveSelectedIds.includes(id))

        if (sectionParticipants.length === 0) {
          return null
        }

        return (
          <fieldset key={section.type} className="grid gap-2">
            <legend className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{section.label}</legend>
            {section.type === 'MEMBER' && (
              <label className="inline-flex cursor-pointer items-center gap-2 justify-self-start text-xs font-semibold text-plum">
                <input
                  aria-label="아티스트 전체 선택"
                  className="h-4 w-4 accent-accent"
                  type="checkbox"
                  checked={allChecked}
                  onChange={(event) => {
                    const nextChecked = event.target.checked
                    onChange((currentIds) => {
                      if (nextChecked) {
                        return Array.from(new Set([...currentIds, ...selectableIds]))
                      }
                      return currentIds.filter((id) => !selectableIds.includes(id) || lockedIds.includes(id))
                    })
                  }}
                />
                <span>전체 선택</span>
              </label>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {sectionParticipants.map((participant) => {
                const checked = effectiveSelectedIds.includes(participant.id)
                const locked = lockedIds.includes(participant.id)
                const characterImage = getParticipantCharacterImage(participant.name)
                return (
                  <label
                    key={participant.id}
                    className={`dream-card flex items-center gap-3 px-4 py-3 text-sm ${locked ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <input
                      aria-label={participant.name}
                      className="h-4 w-4 accent-accent"
                      type="checkbox"
                      checked={checked}
                      disabled={locked}
                      onChange={() => {
                        onChange((currentIds) =>
                          currentIds.includes(participant.id)
                            ? currentIds.filter((id) => id !== participant.id)
                            : [...currentIds, participant.id],
                        )
                      }}
                    />
                    {characterImage && (
                      <img
                        alt={`${participant.name} 캐릭터`}
                        className={`h-14 w-14 shrink-0 rounded-2xl border border-white/70 bg-white/55 object-cover p-1 transition ${
                          checked ? 'grayscale-0 opacity-100' : 'grayscale opacity-70'
                        }`}
                        src={characterImage}
                      />
                    )}
                    <div className="grid gap-1">
                      <span className="text-plum">{participant.name}</span>
                      {participant.type === 'STAFF' && participant.teamName && (
                        <span className="text-xs text-plum/70">{participant.teamName}</span>
                      )}
                      {locked && (
                        <span className="text-[11px] font-medium text-accent/80">팀 선택으로 포함됨</span>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          </fieldset>
        )
      })}
    </div>
  )
}
