export const calendarQueryKeys = {
  all: ['calendar'] as const,
  lookups: () => [...calendarQueryKeys.all, 'lookups'] as const,
  participants: () => [...calendarQueryKeys.lookups(), 'participants'] as const,
  teams: () => [...calendarQueryKeys.lookups(), 'teams'] as const,
  resources: () => [...calendarQueryKeys.lookups(), 'resources'] as const,
  schedules: () => [...calendarQueryKeys.all, 'schedules'] as const,
  months: () => [...calendarQueryKeys.schedules(), 'month'] as const,
  month: (year: number, month: number) => [...calendarQueryKeys.months(), year, month] as const,
  detail: (id: number) => [...calendarQueryKeys.schedules(), 'detail', id] as const,
}
