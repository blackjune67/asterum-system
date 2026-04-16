export type ParticipantType = 'MEMBER' | 'STAFF'

export interface Participant {
  id: number
  name: string
  type: ParticipantType
}
