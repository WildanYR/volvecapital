import type { ModifierObject } from '../types/modifier.type'
import { useEffect, useState } from 'react'
import { Checkbox } from '@/dashboard/components/ui/checkbox'
import { Label } from '@/dashboard/components/ui/label'
import { NETFLIX_RESET_PASSWORD } from '@/dashboard/constants/modifier.consf'

interface DefaultValue {
  checked?: boolean
}

export function NetflixResetPasswordModifier({
  defaultValue,
  onChange,
}: {
  defaultValue?: DefaultValue
  onChange: (id: string, accountModifier: ModifierObject | null) => void
}) {
  const [checked, setChecked] = useState<boolean>(!!defaultValue?.checked)

  const handleCheckChange = (value: boolean) => {
    setChecked(value)
  }

  useEffect(() => {
    if (!checked) {
      onChange(NETFLIX_RESET_PASSWORD, null)
    }
    else {
      onChange(NETFLIX_RESET_PASSWORD, {
        modifier_id: NETFLIX_RESET_PASSWORD,
        metadata: [],
      })
    }
  }, [checked, onChange])

  return (
    <div className="flex items-center gap-3">
      <Checkbox
        id="netflix-reset-password-checkbox"
        checked={checked}
        onCheckedChange={(value) => {
          handleCheckChange(value as boolean)
        }}
      />
      <Label htmlFor="netflix-reset-password-checkbox" className="cursor-pointer">
        NETFLIX RESET PASSWORD
      </Label>
    </div>
  )
}
