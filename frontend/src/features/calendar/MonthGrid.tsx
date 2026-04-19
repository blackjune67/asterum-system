import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { ScheduleItem } from '../../types/schedule'
import { normalizeTime } from '../schedule/dateUtils'
import { measureMonthGridTitleLayout } from './monthGridTextLayout'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const MULTILINE_CLAMP_STYLE: CSSProperties = {
  display: '-webkit-box',
  overflow: 'hidden',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
}

interface Props {
  month: Date
  itemsByDate: ReadonlyMap<string, ScheduleItem[]>
  onSelectDate: (date: string) => void
  onSelectItem: (item: ScheduleItem) => void
}

export function MonthGrid({ month, itemsByDate, onSelectDate, onSelectItem }: Props) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const firstWeekday = new Date(year, monthIndex, 1).getDay()
  const cells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) => index - firstWeekday + 1)
  const todayLabel = new Date().toDateString()
  const itemToneClasses = [
    'from-[#f7a4cf] to-[#dfa4ff]',
    'from-[#a8c7ff] to-[#d4b5ff]',
    'from-[#ffd9a8] to-[#ffb8d0]',
  ]

  return (
    <div className="grid grid-cols-7 gap-2 md:gap-3">
      {WEEKDAY_LABELS.map((label) => (
        <div key={label} className="px-2 pb-1 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-plum/80">
          {label}
        </div>
      ))}

      {cells.map((day, index) => {
        if (day < 1) {
          return <div key={`blank-${index}`} />
        }

        const date = new Date(year, monthIndex, day)
        const isoDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const dayItems = itemsByDate.get(isoDate) ?? []

        return (
          <div
            key={isoDate}
            aria-label={`Open day ${isoDate}`}
            className="dream-card min-h-36 p-3 text-left transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-accent/40"
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
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-sm font-bold text-ink shadow-sm">
                {day}
              </span>
              {date.toDateString() === todayLabel && (
                <span className="rounded-full bg-butter px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-plum shadow-sm">
                  Today
                </span>
              )}
            </div>
            <div className="mt-3 grid gap-2">
              {dayItems.map((item, index) => (
                <MonthGridScheduleChip
                  key={item.id}
                  item={item}
                  toneClass={itemToneClasses[index % itemToneClasses.length]}
                  onSelectItem={onSelectItem}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface MonthGridScheduleChipProps {
  item: ScheduleItem
  toneClass: string
  onSelectItem: (item: ScheduleItem) => void
}

function MonthGridScheduleChip({ item, toneClass, onSelectItem }: MonthGridScheduleChipProps) {
  const titleRef = useRef<HTMLParagraphElement | null>(null)
  const [titleWidth, setTitleWidth] = useState(0)

  useLayoutEffect(() => {
    const node = titleRef.current
    if (!node) return

    const updateWidth = (nextWidth?: number) => {
      const measuredWidth = nextWidth ?? node.getBoundingClientRect().width
      setTitleWidth((current) => {
        const normalizedWidth = Math.max(Math.floor(measuredWidth), 0)
        return current === normalizedWidth ? current : normalizedWidth
      })
    }

    updateWidth()

    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver((entries) => {
      updateWidth(entries[0]?.contentRect.width)
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const titleLayout = useMemo(() => measureMonthGridTitleLayout(item.title, titleWidth), [item.title, titleWidth])

  return (
    <button
      className={`rounded-[1.2rem] bg-gradient-to-r ${toneClass} px-3 py-2 text-left text-xs text-white shadow-md transition hover:brightness-105`}
      onClick={(event) => {
        event.stopPropagation()
        onSelectItem(item)
      }}
      title={titleLayout.truncated ? item.title : undefined}
      type="button"
    >
      <p
        ref={titleRef}
        className="w-full text-xs font-semibold leading-[18px] tracking-[0.02em]"
        data-title-lines={titleLayout.visibleLineCount}
        style={{
          ...MULTILINE_CLAMP_STYLE,
          minHeight: `${titleLayout.titleHeight}px`,
        }}
      >
        {item.title}
      </p>
      <p className="mt-1 text-[11px] text-white/85">
        {normalizeTime(item.startTime)} - {normalizeTime(item.endTime)}
      </p>
    </button>
  )
}
