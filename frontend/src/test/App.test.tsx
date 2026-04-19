import { StrictMode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import { createTestQueryClient } from './queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import { act } from 'react'

const fetchMock = vi.fn()

vi.stubGlobal('fetch', fetchMock)

function createJsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
  }
}

describe('App', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('renders the rolling moodboard card and updated support feature cards under StrictMode without duplicate initial requests', async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse([]))
      .mockResolvedValueOnce(createJsonResponse([]))
      .mockResolvedValueOnce(createJsonResponse([]))
      .mockResolvedValueOnce(createJsonResponse([]))

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <StrictMode>
          <App />
        </StrictMode>
      </QueryClientProvider>,
    )

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4))

    expect(screen.getByText('PLAVE와 테라가 함께 숨 쉬는 단 하나의 타임라인')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '아스테룸 통합 스케줄러' })).toBeInTheDocument()
    expect(screen.getByLabelText('플레이브 감성 레퍼런스 무드보드')).toBeInTheDocument()
    expect(screen.getByTestId('rolling-photo-0')).toHaveAttribute('src', '/rolling_01.jpg')
    expect(screen.getByTestId('rolling-photo-1')).toHaveAttribute('src', '/rolling_02.jpg')
    expect(screen.getByTestId('rolling-photo-2')).toHaveAttribute('src', '/rolling_03.jpg')
    expect(screen.queryByText('Soft Album Dream')).not.toBeInTheDocument()
    expect(screen.queryByText('Mood')).not.toBeInTheDocument()
    expect(screen.queryByText('Credits')).not.toBeInTheDocument()
    expect(screen.queryByText('한글 입력 안전')).not.toBeInTheDocument()
    expect(screen.queryByText('반복 일정 범위 수정')).not.toBeInTheDocument()
    expect(screen.queryByText('Dreamy Calendar UI')).not.toBeInTheDocument()
    expect(screen.getByText('현실과 세계관의 접속점')).toBeInTheDocument()
    expect(screen.getByText('잊힌 존재들의 새로운 시작')).toBeInTheDocument()
    expect(screen.getByText('팬과 함께 이어지는 이야기')).toBeInTheDocument()
    expect(screen.getByText('WHO WE SERVE')).toBeInTheDocument()
    expect(screen.getByText('KEY FEATURES')).toBeInTheDocument()
    expect(screen.getByText('아티스트·기술팀·촬영팀')).toBeInTheDocument()
    expect(screen.getByText('충돌감지 · 반복수정 · 실시간 알림')).toBeInTheDocument()
    expect(screen.getByText('모든 구성원을 하나의 타임라인으로')).toBeInTheDocument()
    expect(screen.getByText('변화하는 현장 변수에 즉시 대응합니다')).toBeInTheDocument()
  })

  test('rotates the moodboard photos over time', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)

    fetchMock
      .mockResolvedValueOnce(createJsonResponse([]))
      .mockResolvedValueOnce(createJsonResponse([]))
      .mockResolvedValueOnce(createJsonResponse([]))
      .mockResolvedValueOnce(createJsonResponse([]))

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <StrictMode>
          <App />
        </StrictMode>
      </QueryClientProvider>,
    )

    expect(screen.getByTestId('rolling-photo-0')).toHaveAttribute('src', '/rolling_01.jpg')

    act(() => {
      vi.advanceTimersByTime(2800)
    })

    expect(screen.getByTestId('rolling-photo-0')).toHaveAttribute('src', '/rolling_04.jpg')
  })
})
