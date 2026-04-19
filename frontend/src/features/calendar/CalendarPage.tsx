import { startTransition, useMemo, useState } from 'react'
import { MonthGrid } from './MonthGrid'
import { useCalendarState } from './useCalendarState'
import { useCalendarUiStore } from './calendarUiStore'
import { monthLabel } from '../schedule/dateUtils'
import { ScheduleDetailModal } from '../schedule/ScheduleDetailModal'
import { ScheduleFormModal } from '../schedule/ScheduleFormModal'
import { ScopePickerModal } from '../schedule/ScopePickerModal'
import { ScheduleConvertModal } from '../schedule/ScheduleConvertModal'
import { StaffTeamManagementModal } from '../participant/StaffTeamManagementModal'

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
    createStaff,
    updateStaff,
    deleteStaff,
    createTeamItem,
    updateTeamItem,
    deleteTeamItem,
  } = useCalendarState()
  const [managementOpen, setManagementOpen] = useState(false)
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
  const summaryStats = [
    { label: '전체 일정', value: items.length, description: '이번달 전체 일정' },
    { label: '반복 일정', value: recurringCount, description: '반복 일정' },
    { label: '단일 일정', value: singleCount, description: '단일 일정' },
  ]

  return (
    <>
      <section className="dream-panel px-5 py-5 sm:px-6 sm:py-6">
        <div className="relative z-10">
          <div className="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-start">
            <div className="grid gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-accent">Comeback Board</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-bold text-ink sm:text-4xl">{monthLabel(currentMonth)}</h2>
                  <div className="flex flex-wrap gap-2">
                    {summaryStats.map((stat) => (
                      <div
                        key={stat.label}
                        className="flex items-center gap-1 rounded-full border border-white/70 bg-white/65 px-3 py-1 text-xs font-medium text-plum shadow-[0_8px_20px_rgba(219,185,255,0.18)]"
                      >
                        <span>{stat.label}</span>
                        <span className="font-semibold text-ink">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 xl:justify-end">
              <button className="dream-button-secondary" onClick={() => setManagementOpen(true)}>
                참가자/팀 관리
              </button>
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

      <StaffTeamManagementModal
        open={managementOpen}
        participants={participants}
        teams={teams}
        onClose={() => setManagementOpen(false)}
        onCreateStaff={createStaff}
        onUpdateStaff={updateStaff}
        onDeleteStaff={deleteStaff}
        onCreateTeam={createTeamItem}
        onUpdateTeam={updateTeamItem}
        onDeleteTeam={deleteTeamItem}
      />
    </>
  )
}
