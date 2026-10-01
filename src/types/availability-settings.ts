export interface AvailabilityRange {
  weekday: number
  startMinute: number
  endMinute: number
}

export interface AvailabilitySettings {
  timeZone: string
  slotDurationMin: number
  bufferBeforeMin: number
  bufferAfterMin: number
  minNoticeMin: number
  horizonDays: number
  ranges: AvailabilityRange[]
}
