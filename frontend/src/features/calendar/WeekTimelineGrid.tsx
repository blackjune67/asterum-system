import type { ScheduleItem } from '../../types/schedule'
import { normalizeTime } from '../schedule/dateUtils'
import {
  buildTimelineRows,
  getWeekRange,
  WEEK_TIMELINE_DAY_WIDTH,
  WEEK_TIMELINE_END_HOUR,
  WEEK_TIMELINE_HOUR_WIDTH,
  WEEK_TIMELINE_START_HOUR,
} from './weekTimeline'

const ROW_LABEL_WIDTH = 168
const BLOCK_HEIGHT = 38
const BLOCK_GAP = 6

interface Props {
  anchorDate: string
  items: ScheduleItem[]
  onSelectDate: (date: string) => void
  onSelectItem: (item: ScheduleItem) => void
}

function buildHourLabels() {
  return Array.from({ length: WEEK_TIMELINE_END_HOUR - WEEK_TIMELINE_START_HOUR + 1 }, (_, index) => WEEK_TIMELINE_START_HOUR + index)
}

export function WeekTimelineGrid({ anchorDate, items, onSelectDate, onSelectItem }: Props) {
  const weekRange = getWeekRange(anchorDate)
  const rows = buildTimelineRows(items, anchorDate)
  const hourLabels = buildHourLabels()

  return (
    <div className="overflow-x-auto pb-2" data-testid="week-timeline-scroll">
      <div className="min-w-max">
        <div
          className="grid gap-y-3"
          style={{
            gridTemplateColumns: `${ROW_LABEL_WIDTH}px repeat(7, ${WEEK_TIMELINE_DAY_WIDTH}px)`,
          }}
        >
          <div className="sticky left-0 z-20 rounded-[1.4rem] bg-white/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-plum shadow-sm">
            Resource
          </div>
          {weekRange.days.map((day) => (
            <button
              key={day.date}
              className="rounded-[1.4rem] border border-white/70 bg-white/70 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5"
              onClick={() => onSelectDate(day.date)}
              type="button"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">{day.dayLabel}</p>
              <p className="mt-1 text-lg font-semibold text-ink">{day.dateLabel}</p>
              <div className="mt-3 flex justify-between text-[10px] font-medium text-plum/80">
                {hourLabels.map((hour) => (
                  <span key={`${day.date}-${hour}`}>{String(hour).padStart(2, '0')}</span>
                ))}
              </div>
            </button>
          ))}

          {rows.length === 0 && (
            <>
              <div className="sticky left-0 z-10 rounded-[1.4rem] bg-white/78 px-4 py-5 text-sm text-plum shadow-sm">
                일정 없음
              </div>
              <div className="col-span-7 rounded-[1.6rem] border border-dashed border-white/70 bg-white/55 px-5 py-12 text-sm text-plum">
                선택한 주간에 표시할 일정이 없습니다.
              </div>
            </>
          )}

          {rows.map((row) => (
            <Row
              key={row.key}
              label={row.label}
              description={row.description}
              days={row.days}
              onSelectItem={onSelectItem}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface RowProps {
  label: string
  description: string
  days: ReturnType<typeof buildTimelineRows>[number]['days']
  onSelectItem: (item: ScheduleItem) => void
}

function Row({ label, description, days, onSelectItem }: RowProps) {
  return (
    <>
      <div className="sticky left-0 z-10 flex min-h-[84px] flex-col justify-center rounded-[1.4rem] bg-white/82 px-4 py-4 shadow-sm">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <span className="mt-1 text-xs text-plum">{description}</span>
      </div>
      {days.map((day) => {
        const laneCount = Math.max(day.laneCount, 1)
        const rowHeight = laneCount * BLOCK_HEIGHT + (laneCount - 1) * BLOCK_GAP + 18

        return (
          <div
            key={`${label}-${day.date}`}
            className="relative rounded-[1.5rem] border border-white/70 bg-white/58 shadow-sm"
            style={{
              height: `${rowHeight}px`,
              backgroundImage: `repeating-linear-gradient(to right, rgba(124, 87, 123, 0.08), rgba(124, 87, 123, 0.08) 1px, transparent 1px, transparent ${WEEK_TIMELINE_HOUR_WIDTH}px)`,
            }}
          >
            {day.blocks.map((block) => (
              <button
                key={block.item.id}
                aria-label={`${block.item.title} ${day.date}`}
                className="absolute overflow-hidden rounded-[1.1rem] bg-gradient-to-r from-[#f7a4cf] to-[#a8c7ff] px-3 py-2 text-left text-white shadow-md transition hover:brightness-105"
                onClick={() => onSelectItem(block.item)}
                style={{
                  left: `${block.left}px`,
                  top: `${8 + block.lane * (BLOCK_HEIGHT + BLOCK_GAP)}px`,
                  width: `${block.width}px`,
                  height: `${BLOCK_HEIGHT}px`,
                }}
                title={`${block.item.title} ${normalizeTime(block.item.startTime)}-${normalizeTime(block.item.endTime)}`}
                type="button"
              >
                <p className="truncate text-xs font-semibold tracking-[0.02em]">
                  {block.clippedStart && <span className="mr-1">{'<'}</span>}
                  {block.item.title}
                  {block.clippedEnd && <span className="ml-1">{'>'}</span>}
                </p>
                <p className="mt-1 truncate text-[11px] text-white/90">
                  {normalizeTime(block.item.startTime)} - {normalizeTime(block.item.endTime)}
                </p>
              </button>
            ))}
          </div>
        )
      })}
    </>
  )
}
