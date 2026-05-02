'use client'

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
    // Hitung total kapasitas dan user aktif
    const { maxUser, userCount } = account.profile.reduce(
      (acc, profile) => {
        acc.maxUser += profile.max_user
        acc.userCount += profile.user?.length || 0
        return acc
      },
      { maxUser: 0, userCount: 0 },
    )

    // Status Freeze (Beku)
    if (account.freeze_until) {
      const freezeUntilDate = new Date(account.freeze_until)
      const freezeDurationMs = freezeUntilDate.getTime() - Date.now()
      let freezeText = ''
      if (freezeDurationMs > 0) {
        const [duration, durationUnit] = largestFlooredUnit(freezeDurationMs)
        freezeText = `Freeze (${duration} ${durationUnit})`
      }
      else {
        freezeText = 'Freeze (Berakhir)'
      }
      return { color: 'bg-amber-500', text: freezeText }
    }

    // Status Disable
    if (account.status === 'disable') {
      return { color: 'bg-red-500', text: 'Disable' }
    }

    // Prioritaskan pengecekan user count untuk status Aktif/Penuh
    if (userCount > 0) {
      if (userCount >= maxUser) {
        return { color: 'bg-green-500', text: 'Aktif (User Penuh)' }
      }
      return { color: 'bg-blue-500', text: 'Aktif (User Tersedia)' }
    }

    // Default jika benar-benar kosong
    if (account.status === 'ready' || account.status === 'active') {
      return { color: 'bg-neutral-300', text: 'Enable (User Kosong)' }
    }

    return { color: 'bg-neutral-700', text: 'Unknown' }
  }, [account])

  return (
    <p
      className={cn(
        'font-semibold flex gap-2 items-center',
        size === 'md' ? 'text-md' : 'text-sm',
      )}
    >
      <span className={cn('flex size-3 rounded-full shadow-sm', status.color)}></span>
      {' '}
      {status.text}
    </p>
  )
}
