import { apiGet } from './client'
import type { Team } from '../types/team'

export function fetchTeams() {
  return apiGet<Team[]>('/teams')
}
