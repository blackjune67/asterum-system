import { apiGet } from '../api/client'

const fetchMock = vi.fn()

vi.stubGlobal('fetch', fetchMock)

describe('api client', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  test('calls the API through the relative /api base path', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })

    await apiGet('/schedules?year=2026&month=4')

    expect(fetchMock).toHaveBeenCalledWith('/api/schedules?year=2026&month=4')
  })

  test('prefers Problem Details detail for failed requests', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        type: '/problems/invalid-time-range',
        title: '잘못된 시간 범위',
        status: 400,
        detail: '시작 시간은 종료 시간보다 빨라야 합니다',
        instance: '/api/schedules',
        code: 'INVALID_TIME_RANGE',
      }),
    })

    await expect(apiGet('/schedules?year=2026&month=4')).rejects.toThrow(
      '시작 시간은 종료 시간보다 빨라야 합니다',
    )
  })
})
