import type { ScheduleItem } from '../../types/schedule'
import { normalizeTime } from '../schedule/dateUtils'

interface Props {
  month: Date
  items: ScheduleItem[]
  onSelectDate: (date: string) => void
  onSelectItem: (item: ScheduleItem) => void
}

export function MonthGrid({ month, items, onSelectDate, onSelectItem }: Props) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const firstWeekday = new Date(year, monthIndex, 1).getDay()
  const cells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) => index - firstWeekday + 1)

  return (
    <div className="grid grid-cols-7 gap-3">
      {['일', '월', '화', '수', '목', '금', '토'].map((label) => (
        <div key={label} className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          {label}
        </div>
      ))}

      {cells.map((day, index) => {
        if (day < 1) {
          return <div key={`blank-${index}`} />
        }

        const date = new Date(year, monthIndex, day)
        const isoDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const dayItems = items.filter((item) => item.date === isoDate)

        return (
          <div
            key={isoDate}
            aria-label={`Open day ${isoDate}`}
            className="min-h-36 rounded-[1.6rem] border border-white/70 bg-white/80 p-3 text-left shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-accent"
            onClick={() => onSelectDate(isoDate)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelectDate(isoDate)
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{day}</span>
              {date.toDateString() === new Date().toDateString() && (
                <span className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-white">TODAY</span>
              )}
            </div>
            <div className="mt-3 grid gap-2">
              {dayItems.map((item) => (
                <button
                  key={item.id}
                  className="rounded-2xl bg-slate-900/95 px-3 py-2 text-left text-xs text-white"
                  onClick={(event) => {
                    event.stopPropagation()
                    onSelectItem(item)
                  }}
                  type="button"
                >
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-[11px] text-white/80">
                    {normalizeTime(item.startTime)} - {normalizeTime(item.endTime)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
