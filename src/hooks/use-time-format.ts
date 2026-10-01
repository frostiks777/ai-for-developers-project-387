import { createContext, useContext } from 'react'

export interface TimeFormatContextValue {
  hour12: boolean
  setHour12: (value: boolean) => void
}

export const TimeFormatContext = createContext<TimeFormatContextValue>({
  hour12: false,
  setHour12: () => {},
})

export function useTimeFormat(): TimeFormatContextValue {
  return useContext(TimeFormatContext)
}
