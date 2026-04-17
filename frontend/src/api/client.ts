const API_BASE = '/api'

async function createRequestError(response: Response) {
  try {
    const body = (await response.json()) as { detail?: string; message?: string }
    if (typeof body.detail === 'string' && body.detail.length > 0) {
      return new Error(body.detail)
    }
    if (typeof body.message === 'string' && body.message.length > 0) {
      return new Error(body.message)
    }
  } catch {
    // Fall back to status-based message when the body is not JSON.
  }
  return new Error(`Request failed: ${response.status}`)
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) {
    throw await createRequestError(response)
  }
  return response.json() as Promise<T>
}

export async function apiSend<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  })

  if (!response.ok) {
    throw await createRequestError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
