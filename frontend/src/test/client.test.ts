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
})
