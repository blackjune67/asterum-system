import type { Team } from '../../types/team'

type TeamSelectionUpdate = number[] | ((currentIds: number[]) => number[])

interface Props {
  teams: Team[]
  selectedIds: number[]
  onChange: (update: TeamSelectionUpdate) => void
}

export function TeamSelect({ teams, selectedIds, onChange }: Props) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {teams.map((team) => {
        const checked = selectedIds.includes(team.id)
        return (
          <label
            key={team.id}
            className="dream-card flex cursor-pointer items-center gap-3 px-4 py-3 text-sm"
          >
            <input
              className="h-4 w-4 accent-accent"
              type="checkbox"
              checked={checked}
              onChange={() => {
                onChange((currentIds) =>
                  currentIds.includes(team.id)
                    ? currentIds.filter((id) => id !== team.id)
                    : [...currentIds, team.id],
                )
              }}
            />
            <span className="text-plum">
              {team.name} ({team.members.length}명)
            </span>
          </label>
        )
      })}
    </div>
  )
}
