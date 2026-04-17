import { apiGetCached } from './client'
import type { Participant } from '../types/participant'

export function fetchParticipants() {
  return apiGetCached<Participant[]>('/participants')
}
