import { Agentation } from 'agentation'
import { CalendarPage } from './features/calendar/CalendarPage'

export default function App() {
  return (
    <div className="min-h-screen text-ink">
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-panel backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">
            Asterum Integrated Scheduler
          </p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold sm:text-4xl">촬영 일정과 반복 스케줄을 한 화면에서 관리</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
                월간 캘린더에서 일회성 일정과 반복 촬영 일정을 생성하고, 참여자 선택과 범위 기반 수정/삭제를
                바로 처리합니다.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">
              Spring Boot 4.0.5 · Java 25 · React
            </div>
          </div>
        </header>

        <CalendarPage />
      </main>
      <Agentation />
    </div>
  )
}
