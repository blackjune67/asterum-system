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

interface FormState {
  title: string
  date: string
  startTime: string
  endTime: string
  participantIds: number[]
  recurring: boolean
  recurrenceType: RecurrenceType
  interval: number
  endType: SeriesEndType
  untilDate: string
  count: number
}

function buildInitialFormState(mode: Props['mode'], selectedDate: string, initialItem?: ScheduleItem | null): FormState {
  if (mode === 'edit' && initialItem) {
    return {
      title: initialItem.title,
      date: initialItem.date,
      startTime: normalizeTime(initialItem.startTime),
      endTime: normalizeTime(initialItem.endTime),
      participantIds: initialItem.participantIds,
      recurring: initialItem.isRecurring,
      recurrenceType: initialItem.recurrence?.type ?? 'WEEKLY',
      interval: initialItem.recurrence?.interval ?? 1,
      endType: initialItem.recurrence?.endType ?? 'COUNT',
      untilDate: initialItem.recurrence?.untilDate ?? initialItem.date,
      count: initialItem.recurrence?.count ?? 8,
    }
  }

  return {
    title: '',
    date: selectedDate,
    startTime: '10:00',
    endTime: '12:00',
    participantIds: [],
    recurring: false,
    recurrenceType: 'WEEKLY',
    interval: 1,
    endType: 'COUNT',
    untilDate: selectedDate,
    count: 8,
  }
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
  const [form, setForm] = useState(() => buildInitialFormState(mode, selectedDate, initialItem))

  useEffect(() => {
    if (!open) return
    setForm(buildInitialFormState(mode, selectedDate, initialItem))
  }, [open, mode, initialItem, selectedDate])

  if (!open) return null

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (mode === 'create') {
      const payload: ScheduleCreatePayload = {
        title: form.title,
        date: form.date,
        startTime: toApiTime(form.startTime),
        endTime: toApiTime(form.endTime),
        participantIds: form.participantIds,
        recurrence: form.recurring
          ? {
              enabled: true,
              type: form.recurrenceType,
              interval: form.interval,
              endType: form.endType,
              untilDate: form.endType === 'UNTIL_DATE' ? form.untilDate : null,
              count: form.endType === 'COUNT' ? form.count : null,
            }
          : null,
      }
      await onSubmit(payload)
      return
    }

    const payload: ScheduleUpdatePayload = {
      title: form.title,
      date: form.date,
      startTime: toApiTime(form.startTime),
      endTime: toApiTime(form.endTime),
      participantIds: form.participantIds,
    }

    await onSubmit(payload)
  }

  return (
    <div className="dream-overlay fixed inset-0 z-30 flex items-center justify-center px-4">
      <div className="dream-modal max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Liner Notes</p>
            <h3 className="mt-2 text-2xl font-semibold text-ink">{mode === 'create' ? '일정 등록' : '일정 수정'}</h3>
          </div>
          <button className="dream-button-secondary px-4 py-2 text-sm" onClick={onClose}>
            닫기
          </button>
        </div>

        <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-plum">제목</span>
            <input
              className="dream-field"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-plum">날짜</span>
              <input
                className="dream-field"
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-plum">시작 시간</span>
              <input
                className="dream-field"
                type="time"
                value={form.startTime}
                onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-plum">종료 시간</span>
              <input
                className="dream-field"
                type="time"
                value={form.endTime}
                onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
              />
            </label>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-medium text-plum">참여자</span>
            <ParticipantSelect
              participants={participants}
              selectedIds={form.participantIds}
              onChange={(participantIds) =>
                setForm((current) => ({
                  ...current,
                  participantIds:
                    typeof participantIds === 'function' ? participantIds(current.participantIds) : participantIds,
                }))
              }
            />
          </div>

          {mode === 'create' && (
            <div className="dream-card grid gap-4 p-4">
              <label className="flex items-center gap-3 text-sm font-medium">
                <input
                  aria-label="반복 일정"
                  className="h-4 w-4 accent-accent"
                  type="checkbox"
                  checked={form.recurring}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      recurring: event.target.checked,
                    }))
                  }
                />
                반복 일정
              </label>

              {form.recurring && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-plum">반복 유형</span>
                    <select
                      className="dream-field"
                      value={form.recurrenceType}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          recurrenceType: event.target.value as RecurrenceType,
                        }))
                      }
                    >
                      <option value="DAILY">매일</option>
                      <option value="WEEKLY">매주</option>
                      <option value="MONTHLY">매월</option>
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-plum">간격</span>
                    <input
                      className="dream-field"
                      min={1}
                      type="number"
                      value={form.interval}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          interval: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-plum">종료 조건</span>
                    <select
                      className="dream-field"
                      value={form.endType}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          endType: event.target.value as SeriesEndType,
                        }))
                      }
                    >
                      <option value="COUNT">횟수</option>
                      <option value="UNTIL_DATE">날짜</option>
                      <option value="NEVER">무기한</option>
                    </select>
                  </label>
                  {form.endType === 'COUNT' && (
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-plum">반복 횟수</span>
                      <input
                        className="dream-field"
                        min={1}
                        type="number"
                        value={form.count}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            count: Number(event.target.value),
                          }))
                        }
                      />
                    </label>
                  )}
                  {form.endType === 'UNTIL_DATE' && (
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-plum">종료 날짜</span>
                      <input
                        className="dream-field"
                        type="date"
                        value={form.untilDate}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            untilDate: event.target.value,
                          }))
                        }
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          )}

          <button className="dream-button-primary" type="submit">
            {mode === 'create' ? '저장' : '수정하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
