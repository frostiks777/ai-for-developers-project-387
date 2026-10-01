import { formatPhoneInput } from './phone'

describe('formatPhoneInput', () => {
  it('форматирует российский номер в маску', () => {
    expect(formatPhoneInput('79000000000')).toBe('+7 (900) 000-00-00')
    expect(formatPhoneInput('89000000000')).toBe('+7 (900) 000-00-00')
  })

  it('форматирует номер по мере ввода', () => {
    expect(formatPhoneInput('7')).toBe('+7')
    expect(formatPhoneInput('790')).toBe('+7 (90')
    expect(formatPhoneInput('7900')).toBe('+7 (900)')
    expect(formatPhoneInput('79000')).toBe('+7 (900) 0')
    expect(formatPhoneInput('7900000')).toBe('+7 (900) 000')
    expect(formatPhoneInput('79000000')).toBe('+7 (900) 000-0')
  })

  it('сохраняет ведущий + и цифры для иностранного номера', () => {
    expect(formatPhoneInput('+49 151 12345678')).toBe('+4915112345678')
  })

  it('возвращает пустую строку без цифр', () => {
    expect(formatPhoneInput('')).toBe('')
    expect(formatPhoneInput('+')).toBe('+')
  })
})
