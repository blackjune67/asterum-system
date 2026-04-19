import { useEffect, useState } from 'react'
import type { ScheduleConvertPayload, ScheduleItem, RecurrenceType, SeriesEndType } from '../../types/schedule'

interface Props {
  open: boolean
  item: ScheduleItem | null
  error?: string | null
  onClose: () => void
  onSubmit: (payload: ScheduleConvertPayload) => Promise<void>
}

interface FormState {
  recurrenceType: RecurrenceType
  interval: number
  endType: SeriesEndType
  untilDate: string
  count: number
}

const REPEAT_LABELS: Record<RecurrenceType, string> = {
  DAILY: '일',
  WEEKLY: '주',
  MONTHLY: '개월',
}

function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(Math.max(value, min), max)
}

function getRepeatOptions(type: RecurrenceType) {
  const unit = REPEAT_LABELS[type]
  return Array.from({ length: 99 }, (_, index) => {
    const value = index + 1
    return {
      value,
      label: `${value}${unit}`,
    }
  })
}

function getCountOptions() {
  return Array.from({ length: 10 }, (_, index) => {
    const value = index + 1
    return {
      value,
      label: `${value}회`,
    }
  })
}

function buildInitialFormState(item: ScheduleItem | null): FormState {
  return {
    recurrenceType: item?.recurrence?.type ?? 'DAILY',
    interval: clampNumber(item?.recurrence?.interval ?? 1, 1, 99),
    endType: item?.recurrence?.endType ?? 'COUNT',
    untilDate: item?.recurrence?.untilDate ?? item?.date ?? '',
    count: clampNumber(item?.recurrence?.count ?? 8, 1, 10),
  }
}

export function ScheduleConvertModal({ open, item, error, onClose, onSubmit }: Props) {
  const [form, setForm] = useState(() => buildInitialFormState(item))
  const repeatOptions = getRepeatOptions(form.recurrenceType)
  const countOptions = getCountOptions()

  useEffect(() => {
    if (!open) return
    setForm(buildInitialFormState(item))
  }, [open, item])

  if (!open || !item) return null

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit({
      enabled: true,
      type: form.recurrenceType,
      interval: form.interval,
      endType: form.endType,
      untilDate: form.endType === 'UNTIL_DATE' ? form.untilDate : null,
      count: form.endType === 'COUNT' ? form.count : null,
    })
  }

  return (
    <div className="dream-overlay fixed inset-0 z-30 flex items-center justify-center px-4">
      <div className="dream-modal max-w-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Series Builder</p>
            <h3 className="mt-2 text-2xl font-semibold text-ink">반복 일정 전환</h3>
            <p className="mt-2 text-sm text-plum">
              `{item.title}` 일정을 기준으로 새 반복 시리즈를 생성합니다.
            </p>
          </div>
          <button
            className="dream-button-secondary inline-flex min-w-[72px] shrink-0 items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-sm"
            onClick={onClose}
            type="button"
          >
            닫기
          </button>
        </div>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          {error && <p className="dream-card px-4 py-3 text-sm text-rose-700">{error}</p>}

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
            <span className="text-sm font-medium text-plum">반복</span>
            <select
              className="dream-field"
              value={String(form.interval)}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  interval: Number(event.target.value),
                }))
              }
            >
              {repeatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
              <select
                className="dream-field"
                value={String(form.count)}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    count: Number(event.target.value),
                  }))
                }
              >
                {countOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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

          <button className="dream-button-primary" type="submit">
            전환하기
          </button>
        </form>
      </div>
    </div>
  )
}
