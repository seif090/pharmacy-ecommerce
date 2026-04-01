export function escapeCsv(value: string | number | boolean | null | undefined) {
  if (value == null) {
    return ''
  }

  const text = String(value)
  if (/["\n,]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }

  return text
}

export function toCsv(headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>) {
  return [headers.join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n')
}
