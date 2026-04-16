import { useMemo } from 'react'
import { MonthGrid } from './MonthGrid'
import { useCalendarState } from './useCalendarState'
import { monthLabel } from '../schedule/dateUtils'
import { ScheduleDetailModal } from '../schedule/ScheduleDetailModal'
import { ScheduleFormModal } from '../schedule/ScheduleFormModal'
import { ScopePickerModal } from '../schedule/ScopePickerModal'

export function CalendarPage() {
  const state = useCalendarState()
  const itemsByDate = useMemo(() => {
    const groupedItems = new Map<string, typeof state.items>()
    for (const item of state.items) {
      const itemsForDate = groupedItems.get(item.date)
      if (itemsForDate) {
        itemsForDate.push(item)
        continue
      }
      groupedItems.set(item.date, [item])
    }
    return groupedItems
  }, [state.items])

  return (
    <>
      <section className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-panel backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Monthly Calendar</p>
            <h2 className="mt-2 text-3xl font-semibold">{monthLabel(state.currentMonth)}</h2>
          </div>
          <div className="flex gap-2">
            <button className="rounded-2xl border border-line px-4 py-3 text-sm" onClick={state.goToPreviousMonth}>
              이전 달
            </button>
            <button className="rounded-2xl border border-line px-4 py-3 text-sm" onClick={state.goToNextMonth}>
              다음 달
            </button>
            <button className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white" onClick={state.openCreateForCurrentMonth}>
              일정 등록
            </button>
          </div>
        </div>

        {state.error && <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>}
        {state.detailError && <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.detailError}</p>}
        {state.detailLoading && !state.detailOpen && (
          <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">상세 일정을 불러오는 중...</p>
        )}
        {state.loading ? (
          <p className="mt-8 text-sm text-slate-500">일정을 불러오는 중...</p>
        ) : (
          <div className="mt-6">
            <MonthGrid
              month={state.currentMonth}
              itemsByDate={itemsByDate}
              onSelectDate={state.openCreate}
              onSelectItem={state.openDetail}
            />
          </div>
        )}
      </section>

      <ScheduleFormModal
        open={state.formOpen}
        mode={state.formMode}
        selectedDate={state.selectedDate}
        participants={state.participants}
        initialItem={state.selectedItem}
        onClose={state.closeForm}
        onSubmit={state.formMode === 'create' ? state.submitCreate : state.submitEdit}
      />

      <ScheduleDetailModal
        item={state.detailOpen ? state.selectedItem : null}
        onClose={state.closeDetail}
        onEdit={state.startEdit}
        onDelete={state.handleDelete}
      />

      <ScopePickerModal
        open={state.scopeOpen}
        mode={state.scopeMode}
        onPick={state.applyScope}
        onClose={state.closeScope}
      />
    </>
  )
}
