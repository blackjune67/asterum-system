import type { Participant } from '../../types/participant'
import type { ParticipantType } from '../../types/participant'

type ParticipantSelectionUpdate = number[] | ((currentIds: number[]) => number[])

const participantCharacterImages: Record<string, string> = {
  노아: '/01_noa.svg',
  은호: '/02_eunho.svg',
  예준: '/03_yeajun.svg',
  밤비: '/04_bambi.svg',
  하민: '/05_hamin.svg',
}

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
        const selectableIds = sectionParticipants.map((participant) => participant.id)
        const allChecked = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id))

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
                      return currentIds.filter((id) => !selectableIds.includes(id))
                    })
                  }}
                />
                <span>전체 선택</span>
              </label>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {sectionParticipants.map((participant) => {
                const checked = selectedIds.includes(participant.id)
                const characterImage = participantCharacterImages[participant.name]
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
                    {characterImage && (
                      <img
                        alt={`${participant.name} 캐릭터`}
                        className={`h-14 w-14 shrink-0 rounded-2xl border border-white/70 bg-white/55 object-cover p-1 transition ${
                          checked ? 'grayscale-0 opacity-100' : 'grayscale opacity-70'
                        }`}
                        src={characterImage}
                      />
                    )}
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
