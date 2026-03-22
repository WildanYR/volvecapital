import { z } from 'zod'

export const TimeUnitEnum = z.enum([
  'day',
  'hour',
  'minute',
  'second',
  'millisecond',
])
