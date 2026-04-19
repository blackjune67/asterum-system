import { startTransition, useMemo } from 'react'
import { MonthGrid } from './MonthGrid'
import { useCalendarState } from './useCalendarState'
import { useCalendarUiStore } from './calendarUiStore'
import { monthLabel } from '../schedule/dateUtils'
import { ScheduleDetailModal } from '../schedule/ScheduleDetailModal'
import { ScheduleFormModal } from '../schedule/ScheduleFormModal'
import { ScopePickerModal } from '../schedule/ScopePickerModal'
import { ScheduleConvertModal } from '../schedule/ScheduleConvertModal'

export function CalendarPage() {
  const {
    items,
    participants,
    teams,
    resources,
    selectedItem,
    loading,
    error,
    detailLoading,
    submitCreate,
    submitEdit,
    handleDelete,
    applyScope,
    submitConvert,
  } = useCalendarState()
  const currentMonth = useCalendarUiStore((state) => state.currentMonth)
  const selectedDate = useCalendarUiStore((state) => state.selectedDate)
  const detailOpen = useCalendarUiStore((state) => state.detailOpen)
  const formOpen = useCalendarUiStore((state) => state.formOpen)
  const formMode = useCalendarUiStore((state) => state.formMode)
  const convertOpen = useCalendarUiStore((state) => state.convertOpen)
  const scopeOpen = useCalendarUiStore((state) => state.scopeOpen)
  const scopeMode = useCalendarUiStore((state) => state.scopeMode)
  const detailError = useCalendarUiStore((state) => state.detailError)
  const formError = useCalendarUiStore((state) => state.formError)
  const convertError = useCalendarUiStore((state) => state.convertError)
  const setCurrentMonth = useCalendarUiStore((state) => state.setCurrentMonth)
  const openCreate = useCalendarUiStore((state) => state.openCreate)
  const openDetail = useCalendarUiStore((state) => state.openDetail)
  const closeForm = useCalendarUiStore((state) => state.closeForm)
  const closeDetail = useCalendarUiStore((state) => state.closeDetail)
  const startEdit = useCalendarUiStore((state) => state.startEdit)
  const openConvert = useCalendarUiStore((state) => state.openConvert)
  const closeConvert = useCalendarUiStore((state) => state.closeConvert)
  const closeScope = useCalendarUiStore((state) => state.closeScope)

  const itemsByDate = useMemo(() => {
    const groupedItems = new Map<string, typeof items>()
    for (const item of items) {
      const itemsForDate = groupedItems.get(item.date)
      if (itemsForDate) {
        itemsForDate.push(item)
        continue
      }
      groupedItems.set(item.date, [item])
    }
    return groupedItems
  }, [items])
  const recurringCount = items.filter((item) => item.isRecurring).length
  const singleCount = items.length - recurringCount
  const currentYear = currentMonth.getFullYear()
  const currentMonthNumber = currentMonth.getMonth() + 1

  return (
    <>
      <section className="dream-panel px-5 py-5 sm:px-6 sm:py-6">
        <div className="relative z-10">
          <div className="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-start">
            <div className="grid gap-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-accent">Comeback Board</p>
                  <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">{monthLabel(currentMonth)}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-plum sm:text-base">
                    월간 스케줄을 포토북처럼 펼쳐 보고, 일회성 일정과 반복 시리즈를 같은 보드에서 정리합니다.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="dream-stat min-w-[132px]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">Tracks</p>
                    <p className="mt-2 text-2xl font-bold">{items.length}</p>
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
              <button
                className="dream-button-secondary"
                onClick={() => {
                  startTransition(() => {
                    setCurrentMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))
                  })
                }}
              >
                이전 달
              </button>
              <button
                className="dream-button-secondary"
                onClick={() => {
                  startTransition(() => {
                    setCurrentMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))
                  })
                }}
              >
                다음 달
              </button>
              <button
                className="dream-button-primary"
                onClick={() => openCreate(`${currentYear}-${String(currentMonthNumber).padStart(2, '0')}-01`)}
              >
                일정 등록
              </button>
            </div>
          </div>

          {error && (
            <p className="dream-card mt-5 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}
          {detailError && (
            <p className="dream-card mt-5 px-4 py-3 text-sm text-rose-700">
              {detailError}
            </p>
          )}
          {detailLoading && !detailOpen && (
            <p className="dream-card mt-5 px-4 py-3 text-sm text-plum">상세 일정을 불러오는 중...</p>
          )}
          {loading ? (
            <p className="mt-8 text-sm text-plum">일정을 불러오는 중...</p>
          ) : (
            <div className="mt-6">
              <MonthGrid
                month={currentMonth}
                itemsByDate={itemsByDate}
                onSelectDate={openCreate}
                onSelectItem={(item) => openDetail(item.id)}
              />
            </div>
          )}
        </div>
      </section>

      <ScheduleFormModal
        open={formOpen}
        mode={formMode}
        selectedDate={selectedDate}
        participants={participants}
        teams={teams}
        resources={resources}
        initialItem={selectedItem}
        error={formError}
        onClose={closeForm}
        onSubmit={formMode === 'create' ? submitCreate : submitEdit}
      />

      <ScheduleDetailModal
        item={detailOpen ? selectedItem : null}
        onClose={closeDetail}
        onEdit={startEdit}
        onConvert={openConvert}
        onDelete={handleDelete}
      />

      <ScheduleConvertModal
        open={convertOpen}
        item={selectedItem}
        error={convertError}
        onClose={closeConvert}
        onSubmit={submitConvert}
      />

      <ScopePickerModal
        open={scopeOpen}
        mode={scopeMode}
        onPick={applyScope}
        onClose={closeScope}
      />
    </>
  )
}
