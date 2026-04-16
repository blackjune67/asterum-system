export function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function monthLabel(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
}

export function normalizeTime(time: string) {
  return time.length >= 5 ? time.slice(0, 5) : time
}

export function toApiTime(time: string) {
  return time.length === 5 ? `${time}:00` : time
}
