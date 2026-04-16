import type { ScheduleItem, ScopeType } from '../../types/schedule'
import { normalizeTime } from './dateUtils'

interface Props {
  item: ScheduleItem | null
  onClose: () => void
  onEdit: () => void
  onDelete: (scope: ScopeType) => Promise<void>
}

export function ScheduleDetailModal({ item, onClose, onEdit, onDelete }: Props) {
  if (!item) return null

  return (
    <div className="dream-overlay fixed inset-0 z-30 flex items-center justify-center px-4">
      <div className="dream-modal max-w-lg">
        <div className="flex items-start justify-between gap-4">
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

        <div className="dream-card mt-5 grid gap-3 p-4 text-sm text-plum">
          <p>날짜: {item.date}</p>
          <p>
            시간: {normalizeTime(item.startTime)} - {normalizeTime(item.endTime)}
          </p>
          {item.recurrence && (
            <p>
              반복: {item.recurrence.type} / {item.recurrence.endType}
            </p>
          )}
          <div>
            <p className="font-medium">참여자</p>
            <ul className="mt-2 grid gap-1">
              {item.participants.map((participant) => (
                <li key={participant.id}>
                  {participant.name} ({participant.type})
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button className="dream-button-primary" onClick={onEdit}>
            수정
          </button>
          <button
            className="dream-button-secondary text-rose-700"
            onClick={() => onDelete(item.isRecurring ? 'THIS' : 'THIS')}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}
