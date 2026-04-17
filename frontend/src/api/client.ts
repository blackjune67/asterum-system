const API_BASE = '/api'
const cachedResponses = new Map<string, unknown>()
const inFlightRequests = new Map<string, Promise<unknown>>()

interface ProblemDetailsBody {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  code?: string
  message?: string
}

async function createRequestError(response: Response) {
  try {
    const body = (await response.json()) as ProblemDetailsBody
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

export function apiGetCached<T>(path: string): Promise<T> {
  if (cachedResponses.has(path)) {
    return Promise.resolve(cachedResponses.get(path) as T)
  }

  const existingRequest = inFlightRequests.get(path)
  if (existingRequest) {
    return existingRequest as Promise<T>
  }

  const request = apiGet<T>(path)
    .then((result) => {
      cachedResponses.set(path, result)
      inFlightRequests.delete(path)
      return result
    })
    .catch((error) => {
      inFlightRequests.delete(path)
      throw error
    })

  inFlightRequests.set(path, request as Promise<unknown>)
  return request
}

export function invalidateApiGetCache(pathPrefix?: string) {
  if (!pathPrefix) {
    cachedResponses.clear()
    inFlightRequests.clear()
    return
  }

  for (const key of cachedResponses.keys()) {
    if (key.startsWith(pathPrefix)) {
      cachedResponses.delete(key)
    }
  }

  for (const key of inFlightRequests.keys()) {
    if (key.startsWith(pathPrefix)) {
      inFlightRequests.delete(key)
    }
  }
}

export function resetApiGetCacheForTests() {
  invalidateApiGetCache()
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
