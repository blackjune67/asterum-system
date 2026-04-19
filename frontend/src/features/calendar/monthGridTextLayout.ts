import { layout, prepare } from '@chenglou/pretext'
import type { PreparedText } from '@chenglou/pretext'

const MONTH_GRID_TITLE_FONT = '600 12px "Noto Sans KR"'
const MONTH_GRID_TITLE_LINE_HEIGHT = 18
const MONTH_GRID_TITLE_MAX_LINES = 2
const MONTH_GRID_TITLE_AVERAGE_GLYPH_WIDTH = 7

const preparedTitleCache = new Map<string, PreparedText>()

function getPreparedTitle(text: string) {
  const cached = preparedTitleCache.get(text)
  if (cached) return cached

  const prepared = prepare(text, MONTH_GRID_TITLE_FONT)
  preparedTitleCache.set(text, prepared)
  return prepared
}

export interface MonthGridTitleLayout {
  titleHeight: number
  visibleLineCount: number
  truncated: boolean
}

export function measureMonthGridTitleLayout(text: string, maxWidth: number): MonthGridTitleLayout {
  if (text.trim().length === 0) {
    return {
      titleHeight: MONTH_GRID_TITLE_LINE_HEIGHT,
      visibleLineCount: 1,
      truncated: false,
    }
  }

  const safeWidth = Math.max(Math.floor(maxWidth), 1)
  let lineCount = 1

  try {
    const prepared = getPreparedTitle(text)
    const result = layout(prepared, safeWidth, MONTH_GRID_TITLE_LINE_HEIGHT)
    lineCount = result.lineCount
  } catch {
    lineCount = Math.max(1, Math.ceil((text.length * MONTH_GRID_TITLE_AVERAGE_GLYPH_WIDTH) / safeWidth))
  }

  const visibleLineCount = Math.min(Math.max(lineCount, 1), MONTH_GRID_TITLE_MAX_LINES)

  return {
    titleHeight: visibleLineCount * MONTH_GRID_TITLE_LINE_HEIGHT,
    visibleLineCount,
    truncated: lineCount > MONTH_GRID_TITLE_MAX_LINES,
  }
}
