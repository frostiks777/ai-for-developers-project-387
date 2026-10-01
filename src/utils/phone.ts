const DIGITS = /\D/g

// Маска российского номера: +7 (900) 000-00-00. Прочие номера — свободный ввод
// с сохранением ведущего «+» и цифр (валидатор допускает 10–15 цифр).
export function formatPhoneInput(input: string): string {
  const trimmedStart = input.trimStart()
  const hasPlus = trimmedStart.startsWith('+')
  const digits = input.replace(DIGITS, '')

  if (digits === '') {
    return hasPlus ? '+' : ''
  }

  const isRussian = digits.startsWith('7') || digits.startsWith('8')

  if (!isRussian) {
    return (hasPlus ? '+' : '') + digits
  }

  const normalized = digits.startsWith('8') ? `7${digits.slice(1)}` : digits

  if (!normalized.startsWith('7')) {
    return `+${normalized}`
  }

  const rest = normalized.slice(1, 11)
  let result = '+7'

  if (rest.length > 0) {
    result += ` (${rest.slice(0, 3)}`
  }
  if (rest.length >= 3) {
    result += ')'
  }
  if (rest.length > 3) {
    result += ` ${rest.slice(3, 6)}`
  }
  if (rest.length > 6) {
    result += `-${rest.slice(6, 8)}`
  }
  if (rest.length > 8) {
    result += `-${rest.slice(8, 10)}`
  }

  return result
}
