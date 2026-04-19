import { apiGet } from './client'
import type { Participant } from '../types/participant'

export function fetchParticipants() {
  return apiGet<Participant[]>('/participants')
}
