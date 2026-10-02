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

  it('не применяет российскую маску к иностранным номерам с кодом 8x', () => {
    expect(formatPhoneInput('+81 901234567')).toBe('+81901234567')
    expect(formatPhoneInput('+86 13800138000')).toBe('+8613800138000')
    expect(formatPhoneInput('+82 1012345678')).toBe('+821012345678')
    expect(formatPhoneInput('+84 901234567')).toBe('+84901234567')
  })

  it('продолжает считать 8 без плюса российским trunk-префиксом', () => {
    expect(formatPhoneInput('8')).toBe('+7')
    expect(formatPhoneInput('8900')).toBe('+7 (900)')
  })

  it('форматирует +7 по российской маске', () => {
    expect(formatPhoneInput('+7 9000000000')).toBe('+7 (900) 000-00-00')
  })

  it('возвращает пустую строку без цифр', () => {
    expect(formatPhoneInput('')).toBe('')
    expect(formatPhoneInput('+')).toBe('+')
  })
})
