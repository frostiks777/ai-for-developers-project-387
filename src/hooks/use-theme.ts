import { useContext } from 'react'

import { ThemeContext, type ThemeContextValue } from '@/lib/theme-context'

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
