import { apiGet, apiSend } from './client'
import type { Participant, StaffMutationPayload } from '../types/participant'

export function fetchParticipants() {
  return apiGet<Participant[]>('/participants')
}

export function createParticipant(payload: StaffMutationPayload) {
  return apiSend<Participant>('/participants', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateParticipant(id: number, payload: StaffMutationPayload) {
  return apiSend<Participant>(`/participants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteParticipant(id: number) {
  return apiSend<void>(`/participants/${id}`, {
    method: 'DELETE',
  })
}
