import type { Participant } from './participant'

export interface Team {
  id: number
  name: string
  memberIds: number[]
  members: Participant[]
}
