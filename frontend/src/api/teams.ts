import { apiGetCached } from './client'
import type { Team } from '../types/team'

export function fetchTeams() {
  return apiGetCached<Team[]>('/teams')
}
