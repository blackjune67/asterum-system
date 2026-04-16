import type { Participant } from '../../types/participant'

type ParticipantSelectionUpdate = number[] | ((currentIds: number[]) => number[])

interface Props {
  participants: Participant[]
  selectedIds: number[]
  onChange: (update: ParticipantSelectionUpdate) => void
}

export function ParticipantSelect({ participants, selectedIds, onChange }: Props) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {participants.map((participant) => {
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
            <span className="text-plum">
              {participant.name} ({participant.type})
            </span>
          </label>
        )
      })}
    </div>
  )
}
