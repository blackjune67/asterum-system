import { useEffect, useState } from 'react'
import { ParticipantSelect } from '../participant/ParticipantSelect'
import type { Participant } from '../../types/participant'
import type { RecurrenceType, ScheduleCreatePayload, ScheduleItem, ScheduleUpdatePayload, SeriesEndType } from '../../types/schedule'
import { normalizeTime, toApiTime } from './dateUtils'

interface Props {
  open: boolean
  mode: 'create' | 'edit'
  selectedDate: string
  participants: Participant[]
  initialItem?: ScheduleItem | null
  onClose: () => void
  onSubmit: (payload: ScheduleCreatePayload | ScheduleUpdatePayload) => Promise<void>
}

export function ScheduleFormModal({
  open,
  mode,
  selectedDate,
  participants,
  initialItem,
  onClose,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(selectedDate)
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('12:00')
  const [participantIds, setParticipantIds] = useState<number[]>([])
  const [recurring, setRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('WEEKLY')
  const [interval, setInterval] = useState(1)
  const [endType, setEndType] = useState<SeriesEndType>('COUNT')
  const [untilDate, setUntilDate] = useState(selectedDate)
  const [count, setCount] = useState(8)

  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && initialItem) {
      setTitle(initialItem.title)
      setDate(initialItem.date)
      setStartTime(normalizeTime(initialItem.startTime))
      setEndTime(normalizeTime(initialItem.endTime))
      setParticipantIds(initialItem.participantIds)
      setRecurring(initialItem.isRecurring)
      setRecurrenceType(initialItem.recurrence?.type ?? 'WEEKLY')
      setInterval(initialItem.recurrence?.interval ?? 1)
      setEndType(initialItem.recurrence?.endType ?? 'COUNT')
      setUntilDate(initialItem.recurrence?.untilDate ?? initialItem.date)
      setCount(initialItem.recurrence?.count ?? 8)
      return
    }

    setTitle('')
    setDate(selectedDate)
    setStartTime('10:00')
    setEndTime('12:00')
    setParticipantIds([])
    setRecurring(false)
    setRecurrenceType('WEEKLY')
    setInterval(1)
    setEndType('COUNT')
    setUntilDate(selectedDate)
    setCount(8)
  }, [open, mode, initialItem, selectedDate])

  if (!open) return null

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (mode === 'create') {
      const payload: ScheduleCreatePayload = {
        title,
        date,
        startTime: toApiTime(startTime),
        endTime: toApiTime(endTime),
        participantIds,
        recurrence: recurring
          ? {
              enabled: true,
              type: recurrenceType,
              interval,
              endType,
              untilDate: endType === 'UNTIL_DATE' ? untilDate : null,
              count: endType === 'COUNT' ? count : null,
            }
          : null,
      }
      await onSubmit(payload)
      return
    }

    const payload: ScheduleUpdatePayload = {
      title,
      date,
      startTime: toApiTime(startTime),
      endTime: toApiTime(endTime),
      participantIds,
    }

    await onSubmit(payload)
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-panel">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold">{mode === 'create' ? '일정 등록' : '일정 수정'}</h3>
          <button className="text-sm text-slate-500" onClick={onClose}>
            닫기
          </button>
        </div>

        <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-medium">제목</span>
            <input
              className="rounded-2xl border border-line px-4 py-3"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-medium">날짜</span>
              <input
                className="rounded-2xl border border-line px-4 py-3"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">시작 시간</span>
              <input
                className="rounded-2xl border border-line px-4 py-3"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">종료 시간</span>
              <input
                className="rounded-2xl border border-line px-4 py-3"
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-medium">참여자</span>
            <ParticipantSelect participants={participants} selectedIds={participantIds} onChange={setParticipantIds} />
          </div>

          {mode === 'create' && (
            <div className="grid gap-4 rounded-3xl border border-line bg-mist p-4">
              <label className="flex items-center gap-3 text-sm font-medium">
                <input
                  aria-label="반복 일정"
                  type="checkbox"
                  checked={recurring}
                  onChange={(event) => setRecurring(event.target.checked)}
                />
                반복 일정
              </label>

              {recurring && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">반복 유형</span>
                    <select
                      className="rounded-2xl border border-line px-4 py-3"
                      value={recurrenceType}
                      onChange={(event) => setRecurrenceType(event.target.value as RecurrenceType)}
                    >
                      <option value="DAILY">매일</option>
                      <option value="WEEKLY">매주</option>
                      <option value="MONTHLY">매월</option>
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">간격</span>
                    <input
                      className="rounded-2xl border border-line px-4 py-3"
                      min={1}
                      type="number"
                      value={interval}
                      onChange={(event) => setInterval(Number(event.target.value))}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">종료 조건</span>
                    <select
                      className="rounded-2xl border border-line px-4 py-3"
                      value={endType}
                      onChange={(event) => setEndType(event.target.value as SeriesEndType)}
                    >
                      <option value="COUNT">횟수</option>
                      <option value="UNTIL_DATE">날짜</option>
                      <option value="NEVER">무기한</option>
                    </select>
                  </label>
                  {endType === 'COUNT' && (
                    <label className="grid gap-2">
                      <span className="text-sm font-medium">반복 횟수</span>
                      <input
                        className="rounded-2xl border border-line px-4 py-3"
                        min={1}
                        type="number"
                        value={count}
                        onChange={(event) => setCount(Number(event.target.value))}
                      />
                    </label>
                  )}
                  {endType === 'UNTIL_DATE' && (
                    <label className="grid gap-2">
                      <span className="text-sm font-medium">종료 날짜</span>
                      <input
                        className="rounded-2xl border border-line px-4 py-3"
                        type="date"
                        value={untilDate}
                        onChange={(event) => setUntilDate(event.target.value)}
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          )}

          <button className="rounded-2xl bg-slate-900 px-4 py-3 text-white" type="submit">
            {mode === 'create' ? '저장' : '수정하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
