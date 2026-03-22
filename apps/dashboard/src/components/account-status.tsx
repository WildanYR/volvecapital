import type { Account } from '@/dashboard/services/account.service'
import { useMemo } from 'react'
import { largestFlooredUnit } from '@/dashboard/lib/time-converter.util'
import { cn } from '@/dashboard/lib/utils'

export function AccountStatus({
  account,
  size,
}: {
  account: Account
  size?: 'sm' | 'md'
}) {
  const status = useMemo(() => {
    if (account.freeze_until) {
      const freezeDurationMs = account.freeze_until.getTime() - Date.now()
      let freezeText = ''
      if (freezeDurationMs > 0) {
        const [duration, durationUnit] = largestFlooredUnit(freezeDurationMs)
        freezeText = `Freeze (${duration} ${durationUnit})`
      }
      else {
        freezeText = 'Freeze (???)'
      }
      return { color: 'bg-amber-500', text: freezeText }
    }
    if (account.status === 'disable') {
      return { color: 'bg-red-500', text: 'Disable' }
    }
    if (account.status === 'ready') {
      return { color: 'bg-neutral-300', text: 'Enable (User Kosong)' }
    }
    if (account.status === 'active') {
      const { maxUser, userCount } = account.profile.reduce(
        (acc, profile) => {
          acc.maxUser += profile.max_user
          acc.userCount += profile.user?.length || 0
          return acc
        },
        { maxUser: 0, userCount: 0 },
      )

      if (userCount >= maxUser) {
        return { color: 'bg-green-500', text: 'Aktif (User Penuh)' }
      }
      return { color: 'bg-blue-500', text: 'Aktif (User Tersedia)' }
    }
    return { color: 'bg-neutral-700', text: '???' }
  }, [account])

  return (
    <p
      className={cn(
        'font-semibold flex gap-2 items-center',
        size === 'md' ? 'text-md' : 'text-sm',
      )}
    >
      <span className={cn('flex size-3 rounded-full', status.color)}></span>
      {' '}
      {status.text}
    </p>
  )
}
