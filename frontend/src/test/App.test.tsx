import { render, screen, waitFor } from '@testing-library/react'
import App from '../App'

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

  test('renders the soft album dream shell with Korean-safe headline and moodboard image', async () => {
    fetchMock
      .mockResolvedValueOnce(createJsonResponse([]))
      .mockResolvedValueOnce(createJsonResponse([]))

    render(<App />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    expect(screen.getByText('PLAYBOOK EDITION')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '우리만의 드리미 스케줄 아카이브' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '플레이브 감성 레퍼런스 무드보드' })).toBeInTheDocument()
    expect(screen.getAllByText('Soft Album Dream')).toHaveLength(2)
  })
})
