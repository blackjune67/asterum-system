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
  const recurringCount = state.items.filter((item) => item.isRecurring).length
  const singleCount = state.items.length - recurringCount

  return (
    <>
      <section className="dream-panel px-5 py-5 sm:px-6 sm:py-6">
        <div className="relative z-10">
          <div className="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-start">
            <div className="grid gap-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-accent">Comeback Board</p>
                  <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">{monthLabel(state.currentMonth)}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-plum sm:text-base">
                    월간 스케줄을 포토북처럼 펼쳐 보고, 일회성 일정과 반복 시리즈를 같은 보드에서 정리합니다.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="dream-stat min-w-[132px]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">Tracks</p>
                    <p className="mt-2 text-2xl font-bold">{state.items.length}</p>
                    <p className="text-xs text-plum">이번 달 전체 일정</p>
                  </div>
                  <div className="dream-stat min-w-[132px]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">Series</p>
                    <p className="mt-2 text-2xl font-bold">{recurringCount}</p>
                    <p className="text-xs text-plum">반복 시리즈</p>
                  </div>
                  <div className="dream-stat min-w-[132px]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">Single</p>
                    <p className="mt-2 text-2xl font-bold">{singleCount}</p>
                    <p className="text-xs text-plum">단일 일정</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 xl:justify-end">
              <button className="dream-button-secondary" onClick={state.goToPreviousMonth}>
                이전 달
              </button>
              <button className="dream-button-secondary" onClick={state.goToNextMonth}>
                다음 달
              </button>
              <button className="dream-button-primary" onClick={state.openCreateForCurrentMonth}>
                일정 등록
              </button>
            </div>
          </div>

          {state.error && (
            <p className="dream-card mt-5 px-4 py-3 text-sm text-rose-700">
              {state.error}
            </p>
          )}
          {state.detailError && (
            <p className="dream-card mt-5 px-4 py-3 text-sm text-rose-700">
              {state.detailError}
            </p>
          )}
          {state.detailLoading && !state.detailOpen && (
            <p className="dream-card mt-5 px-4 py-3 text-sm text-plum">상세 일정을 불러오는 중...</p>
          )}
          {state.loading ? (
            <p className="mt-8 text-sm text-plum">일정을 불러오는 중...</p>
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
        </div>
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
