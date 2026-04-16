import type { Participant } from '../../types/participant'

interface Props {
  participants: Participant[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
}

export function ParticipantSelect({ participants, selectedIds, onChange }: Props) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {participants.map((participant) => {
        const checked = selectedIds.includes(participant.id)
        return (
          <label
            key={participant.id}
            className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() =>
                onChange(
                  checked
                    ? selectedIds.filter((id) => id !== participant.id)
                    : [...selectedIds, participant.id],
                )
              }
            />
            <span>
              {participant.name} ({participant.type})
            </span>
          </label>
        )
      })}
    </div>
  )
}
