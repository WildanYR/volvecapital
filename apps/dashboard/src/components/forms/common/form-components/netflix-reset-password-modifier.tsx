import type { ModifierObject } from '../types/modifier.type'
import type { MetadataObject } from '@/dashboard/lib/metadata-converter'
import { useEffect, useState } from 'react'
import { Checkbox } from '@/dashboard/components/ui/checkbox'
import { Collapsible, CollapsibleContent } from '@/dashboard/components/ui/collapsible'
import { Label } from '@/dashboard/components/ui/label'
import { Textarea } from '@/dashboard/components/ui/textarea'
import { NETFLIX_RESET_PASSWORD } from '@/dashboard/constants/modifier.consf'

interface DefaultValue {
  checked?: boolean
  password_list?: string
}

export function NetflixResetPasswordModifier({
  defaultValue,
  onChange,
}: {
  defaultValue?: DefaultValue
  onChange: (id: string, accountModifier: ModifierObject | null) => void
}) {
  const [checked, setChecked] = useState<boolean>(!!defaultValue?.checked)
  const [passwordList, setPasswordList] = useState<string>(
    defaultValue?.password_list || '',
  )

  const handleCheckChange = (value: boolean) => {
    setChecked(value)
  }

  const handlePasswordListChange = (value: string) => {
    setPasswordList(value)
  }

  useEffect(() => {
    if (!checked) {
      onChange(NETFLIX_RESET_PASSWORD, null)
    }
    else {
      const metadata: Array<MetadataObject> = passwordList
        ? [{ key: 'password_list', value: passwordList }]
        : []
      onChange(NETFLIX_RESET_PASSWORD, {
        modifier_id: NETFLIX_RESET_PASSWORD,
        metadata,
      })
    }
  }, [checked, passwordList])

  return (
    <Collapsible
      open={checked}
      onOpenChange={handleCheckChange}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={checked}
          onCheckedChange={(value) => {
            handleCheckChange(value as boolean)
          }}
        />
        <Label>NETFLIX RESET PASSWORD</Label>
      </div>
      <CollapsibleContent className="flex flex-col gap-3">
        <Label>List Password</Label>
        <Textarea
          defaultValue={passwordList}
          onChange={e => handlePasswordListChange(e.target.value)}
          placeholder="Masukkan list password terpisah koma tanpa spasi..."
          className="break-all"
        />
      </CollapsibleContent>
    </Collapsible>
  )
}
