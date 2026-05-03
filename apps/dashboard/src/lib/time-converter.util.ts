export type TimeUnit = 'millisecond' | 'second' | 'minute' | 'hour' | 'day'
export const TimeUnitList: Array<TimeUnit> = [
  'day',
  'hour',
  'minute',
  'second',
  'millisecond',
]
export const timeFactors: Record<TimeUnit, number> = {
  millisecond: 1,
  second: 1000,
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
}

export function convertTimeUnit(
  value: number,
  from: TimeUnit,
  to: TimeUnit,
): number {
  // ubah ke milidetik dulu
  const valueInMs = value * timeFactors[from]
  // lalu ubah ke satuan tujuan
  return Math.floor(valueInMs / timeFactors[to])
}

export function largestWholeUnit(ms: number): [number, TimeUnit] {
  for (const unit of TimeUnitList) {
    if (ms % timeFactors[unit] === 0) {
      return [ms / timeFactors[unit], unit]
    }
  }

  return [ms, 'millisecond']
}

export function largestFlooredUnit(ms: number): [number, TimeUnit] {
  for (const unit of TimeUnitList) {
    if (ms >= timeFactors[unit]) {
      return [Math.floor(ms / timeFactors[unit]), unit]
    }
  }

  return [ms, 'millisecond']
}

export function getTimeUnitSymbol(timeUnit: TimeUnit) {
  if (timeUnit === 'day')
    return 'hari'
  if (timeUnit === 'hour')
    return 'jam'
  if (timeUnit === 'minute')
    return 'menit'
  if (timeUnit === 'second')
    return 'detik'
  return 'ms'
}

export function formatDateIdStandard(date?: Date, hideTime?: boolean) {
  if (!date)
    return ''

  const dt = new Date(date)

  const tanggal = dt.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })

  const waktu = dt
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    })
    .replace('.', ':')
  let formatted = tanggal
  if (!hideTime) {
    formatted += ` ${waktu} WIB`
  }
  return formatted
}

export function formatTimeOnly(date?: Date) {
  if (!date)
    return ''

  const dt = new Date(date)
  return dt
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    })
    .replace('.', ':')
}
