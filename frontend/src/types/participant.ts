export type ParticipantType = 'MEMBER' | 'STAFF'

export interface Participant {
  id: number
  name: string
  type: ParticipantType
  teamId?: number | null
  teamName?: string | null
}

export interface StaffMutationPayload {
  name: string
  type: 'STAFF'
  teamId: number
}
