import { Agentation } from 'agentation'
import { CalendarPage } from './features/calendar/CalendarPage'
import moodboardImage from '../../docs/ref/img.jpg'

export default function App() {
  return (
    <div className="relative min-h-screen overflow-hidden text-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[540px] bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.95),transparent_18%),radial-gradient(circle_at_92%_22%,rgba(255,244,183,0.88),transparent_16%),radial-gradient(circle_at_72%_8%,rgba(205,183,255,0.7),transparent_18%),radial-gradient(circle_at_80%_80%,rgba(249,202,228,0.65),transparent_20%)]"
      />
      <main className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="dream-panel px-6 py-6 sm:px-8 sm:py-8">
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="dream-badge text-accent">
                <span>PLAYBOOK EDITION</span>
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span>Soft Album Dream</span>
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-ink sm:text-5xl">
                우리만의 드리미 스케줄 아카이브
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-plum sm:text-base">
                컴백 티저 보드 같은 무드 안에서 촬영 일정, 반복 스케줄, 참여자 구성을 한 번에 정리합니다.
                팬아트 앨범의 질감은 살리되, 등록과 수정 흐름은 기존처럼 빠르게 유지합니다.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="dream-badge text-plum">한글 입력 안전</div>
                <div className="dream-badge text-plum">반복 일정 범위 수정</div>
                <div className="dream-badge text-plum">Dreamy Calendar UI</div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="dream-card overflow-hidden p-3">
                <img
                  alt="플레이브 감성 레퍼런스 무드보드"
                  className="h-[320px] w-full rounded-[1.5rem] object-cover object-center"
                  src={moodboardImage}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="dream-stat">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">Mood</p>
                  <p className="mt-2 text-lg font-semibold">Soft Album Dream</p>
                  <p className="mt-1 text-sm text-plum">핑크, 라일락, 버터 크림, 별빛 글로우</p>
                </div>
                <div className="dream-stat">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">Credits</p>
                  <p className="mt-2 text-lg font-semibold">Spring Boot 4.0.5 · Java 25</p>
                  <p className="mt-1 text-sm text-plum">React + Vite 프론트로 앨범형 재해석</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <CalendarPage />
      </main>
      <Agentation />
    </div>
  )
}
