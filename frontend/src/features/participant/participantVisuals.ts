export const participantCharacterImages: Record<string, string> = {
  노아: '/01_noa.svg',
  은호: '/02_eunho.svg',
  예준: '/03_yeajun.svg',
  밤비: '/04_bambi.svg',
  하민: '/05_hamin.svg',
}

export function getParticipantCharacterImage(name: string) {
  return participantCharacterImages[name]
}
