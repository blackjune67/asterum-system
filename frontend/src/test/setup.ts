import '@testing-library/jest-dom'
import { resetCalendarUiStore } from '../features/calendar/calendarUiStore'

afterEach(() => {
  resetCalendarUiStore()
})
