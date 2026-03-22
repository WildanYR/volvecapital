import { Eye, EyeOff } from 'lucide-react'
import React, { useState } from 'react'
import { cn } from '@/dashboard/lib/utils'

export function PasswordText({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const [hide, setHide] = useState<boolean>(true)

  return (
    <button
      type="button"
      onClick={() => setHide(!hide)}
      className={cn('flex items-center gap-2 cursor-pointer', className)}
    >
      {hide
        ? (
            <EyeOff className="size-[1em]" />
          )
        : (
            <Eye className="size-[1em]" />
          )}
      <p>{hide ? '***' : children}</p>
    </button>
  )
}
