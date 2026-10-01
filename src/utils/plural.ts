const pluralRules = new Intl.PluralRules('ru')

export function pluralRu(n: number, forms: [string, string, string]): string {
  const category = pluralRules.select(n)

  if (category === 'one') {
    return forms[0]
  }

  if (category === 'few') {
    return forms[1]
  }

  return forms[2]
}
