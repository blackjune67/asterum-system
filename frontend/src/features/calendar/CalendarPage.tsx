import { MonthGrid } from './MonthGrid'
import { useCalendarState } from './useCalendarState'
import { monthLabel } from '../schedule/dateUtils'
import { ScheduleDetailModal } from '../schedule/ScheduleDetailModal'
import { ScheduleFormModal } from '../schedule/ScheduleFormModal'
import { ScopePickerModal } from '../schedule/ScopePickerModal'

export function CalendarPage() {
  const state = useCalendarState()

  return (
    <>
      <section className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-panel backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Monthly Calendar</p>
            <h2 className="mt-2 text-3xl font-semibold">{monthLabel(state.currentMonth)}</h2>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-2xl border border-line px-4 py-3 text-sm"
              onClick={() => state.setCurrentMonth(new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1))}
            >
              이전 달
            </button>
            <button
              className="rounded-2xl border border-line px-4 py-3 text-sm"
              onClick={() => state.setCurrentMonth(new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1))}
            >
              다음 달
            </button>
            <button
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white"
              onClick={() => state.openCreate(`${state.currentMonth.getFullYear()}-${String(state.currentMonth.getMonth() + 1).padStart(2, '0')}-01`)}
            >
              일정 등록
            </button>
          </div>
        </div>

        {state.error && <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>}
        {state.loading ? (
          <p className="mt-8 text-sm text-slate-500">일정을 불러오는 중...</p>
        ) : (
          <div className="mt-6">
            <MonthGrid
              month={state.currentMonth}
              items={state.items}
              onSelectDate={state.openCreate}
              onSelectItem={(item) => void state.openDetail(item)}
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
        onClose={() => state.setFormOpen(false)}
        onSubmit={state.formMode === 'create' ? state.submitCreate : state.submitEdit}
      />

      <ScheduleDetailModal
        item={state.detailOpen ? state.selectedItem : null}
        onClose={() => state.setDetailOpen(false)}
        onEdit={state.startEdit}
        onDelete={state.handleDelete}
      />

      <ScopePickerModal
        open={state.scopeOpen}
        mode={state.scopeMode}
        onPick={(scope) => void state.applyScope(scope)}
        onClose={state.closeScope}
      />
    </>
  )
}
