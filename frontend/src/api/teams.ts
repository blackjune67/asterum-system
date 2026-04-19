import { apiGet, apiSend } from './client'
import type { Team, TeamMutationPayload } from '../types/team'

export function fetchTeams() {
  return apiGet<Team[]>('/teams')
}

export function createTeam(payload: TeamMutationPayload) {
  return apiSend<Team>('/teams', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateTeam(id: number, payload: TeamMutationPayload) {
  return apiSend<Team>(`/teams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteTeam(id: number) {
  return apiSend<void>(`/teams/${id}`, {
    method: 'DELETE',
  })
}
