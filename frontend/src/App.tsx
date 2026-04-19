import { useEffect, useState } from 'react'
import { Agentation } from 'agentation'
import { CalendarPage } from './features/calendar/CalendarPage'

const rollingImages = [
  '/rolling_01.jpg',
  '/rolling_02.jpg',
  '/rolling_03.jpg',
  '/rolling_04.jpg',
  '/rolling_05.jpg',
  '/rolling_06.jpg',
  '/rolling_07.jpg',
]

const moodboardSlots = [
  'absolute left-4 top-5 z-10 w-[52%] -rotate-[7deg] shadow-[0_24px_50px_rgba(110,58,102,0.18)]',
  'absolute right-5 top-10 z-20 w-[50%] rotate-[6deg] shadow-[0_24px_50px_rgba(110,58,102,0.2)]',
  'absolute bottom-5 left-1/2 z-30 w-[58%] -translate-x-1/2 rotate-[1deg] shadow-[0_28px_60px_rgba(110,58,102,0.22)]',
]

function pickNextMoodboardImages(current: string[]) {
  const next = [...current]
  const slotIndex = Math.floor(Math.random() * next.length)
  const visibleSources = new Set(next)
  const availableSources = rollingImages.filter((source) => !visibleSources.has(source))
  const nextSource = availableSources[Math.floor(Math.random() * availableSources.length)]

  next[slotIndex] = nextSource
  return next
}

function RollingMoodboard() {
  const [visibleImages, setVisibleImages] = useState(() => rollingImages.slice(0, 3))

  useEffect(() => {
    const timer = window.setInterval(() => {
      setVisibleImages((current) => pickNextMoodboardImages(current))
    }, 2800)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div
      aria-label="플레이브 감성 레퍼런스 무드보드"
      className="dream-card overflow-hidden p-3"
    >
      <div className="relative h-[320px] overflow-hidden rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,245,252,0.95),rgba(249,222,244,0.72))]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.95),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(223,195,255,0.65),transparent_26%),radial-gradient(circle_at_50%_85%,rgba(255,213,230,0.72),transparent_32%)]"
        />
        {visibleImages.map((source, index) => (
          <div
            key={index}
            className={`${moodboardSlots[index]} rounded-[1.45rem] border border-white/80 bg-white/85 p-2 transition-transform duration-700 ease-out`}
          >
            <img
              alt={index === 2 ? '플레이브 감성 레퍼런스 대표 이미지' : ''}
              className="h-[190px] w-full rounded-[1.1rem] object-cover object-center"
              data-testid={`rolling-photo-${index}`}
              src={source}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

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
                <span>PLAVE와 테라가 함께 숨 쉬는 단 하나의 타임라인</span>
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-ink sm:text-5xl">
                아스테룸 통합 스케줄러
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-plum sm:text-base">
                아티스트의 모든 순간을, 단 한 곳에서!
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="dream-badge text-plum">현실과 세계관의 접속점</div>
                <div className="dream-badge text-plum">잊힌 존재들의 새로운 시작</div>
                <div className="dream-badge text-plum">팬과 함께 이어지는 이야기</div>
              </div>
            </div>

            <div className="grid gap-4">
              <RollingMoodboard />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="dream-stat">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">WHO WE SERVE</p>
                  <p className="mt-2 text-lg font-semibold">아티스트·기술팀·촬영팀</p>
                  <p className="mt-1 text-sm text-plum">모든 구성원을 하나의 타임라인으로</p>
                </div>
                <div className="dream-stat">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">KEY FEATURES</p>
                  <p className="mt-2 text-lg font-semibold">충돌감지 · 반복수정 · 실시간 알림</p>
                  <p className="mt-1 text-sm text-plum">변화하는 현장 변수에 즉시 대응합니다</p>
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
