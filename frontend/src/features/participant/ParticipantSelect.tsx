import type { Participant } from '../../types/participant'
import type { ParticipantType } from '../../types/participant'

type ParticipantSelectionUpdate = number[] | ((currentIds: number[]) => number[])

const participantSections: Array<{ label: string; type: ParticipantType }> = [
  { label: '아티스트', type: 'MEMBER' },
  { label: '스태프', type: 'STAFF' },
]

interface Props {
  participants: Participant[]
  selectedIds: number[]
  onChange: (update: ParticipantSelectionUpdate) => void
}

export function ParticipantSelect({ participants, selectedIds, onChange }: Props) {
  return (
    <div className="grid gap-4">
      {participantSections.map((section) => {
        const sectionParticipants = participants.filter((participant) => participant.type === section.type)

        if (sectionParticipants.length === 0) {
          return null
        }

        return (
          <fieldset key={section.type} className="grid gap-2">
            <legend className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{section.label}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {sectionParticipants.map((participant) => {
                const checked = selectedIds.includes(participant.id)
                return (
                  <label
                    key={participant.id}
                    className="dream-card flex cursor-pointer items-center gap-3 px-4 py-3 text-sm"
                  >
                    <input
                      className="h-4 w-4 accent-accent"
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        onChange((currentIds) =>
                          currentIds.includes(participant.id)
                            ? currentIds.filter((id) => id !== participant.id)
                            : [...currentIds, participant.id],
                        )
                      }}
                    />
                    <span className="text-plum">{participant.name}</span>
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
