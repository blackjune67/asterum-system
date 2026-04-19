import { StrictMode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import { createTestQueryClient } from './queryClient'
import { QueryClientProvider } from '@tanstack/react-query'

const fetchMock = vi.fn()

vi.stubGlobal('fetch', fetchMock)

vi.mock('agentation', () => ({
  Agentation: () => null,
}))

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

  test('renders the soft album dream shell with Korean-safe headline and moodboard image under StrictMode without duplicate initial requests', async () => {
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

    expect(screen.getByText('PLAYBOOK EDITION')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '우리만의 드리미 스케줄 아카이브' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '플레이브 감성 레퍼런스 무드보드' })).toBeInTheDocument()
    expect(screen.getAllByText('Soft Album Dream')).toHaveLength(2)
  })
})
