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
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {item.isRecurring ? 'Recurring Schedule' : 'One-time Schedule'}
            </p>
            <h3 className="mt-2 text-2xl font-semibold">{item.title}</h3>
          </div>
          <button className="text-sm text-slate-500" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="mt-5 grid gap-3 rounded-3xl bg-mist p-4 text-sm">
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
          <button className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white" onClick={onEdit}>
            수정
          </button>
          <button
            className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
            onClick={() => onDelete(item.isRecurring ? 'THIS' : 'THIS')}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}
