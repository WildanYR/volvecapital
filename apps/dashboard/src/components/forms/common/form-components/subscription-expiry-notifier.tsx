import type { ModifierObject } from '../types/modifier.type'
import type { MetadataObject } from '@/dashboard/lib/metadata-converter'
import { useEffect, useState } from 'react'
import { Checkbox } from '@/dashboard/components/ui/checkbox'
import { Collapsible, CollapsibleContent } from '@/dashboard/components/ui/collapsible'
import { Label } from '@/dashboard/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/dashboard/components/ui/select'
import { SUBSCRIPTION_EXPIRY_NOTIFIER } from '@/dashboard/constants/modifier.consf'

interface DefaultValue {
  checked?: boolean
  dday?: string
}

export function SubscriptionExpiryNotifierModifier({
  defaultValue,
  onChange,
}: {
  defaultValue?: DefaultValue
  onChange: (id: string, accountModifier: ModifierObject | null) => void
}) {
  const [checked, setChecked] = useState<boolean>(!!defaultValue?.checked)
  const [dday, setDday] = useState<string>(defaultValue?.dday || '1')

  const handleCheckChange = (value: boolean) => {
    setChecked(value)
  }

  const handleSelectDday = (value: string) => {
    setDday(value)
  }

  useEffect(() => {
    if (!checked) {
      onChange(SUBSCRIPTION_EXPIRY_NOTIFIER, null)
    }
    else {
      const metadata: Array<MetadataObject> = [{ key: 'dday', value: dday }]
      onChange(SUBSCRIPTION_EXPIRY_NOTIFIER, {
        modifier_id: SUBSCRIPTION_EXPIRY_NOTIFIER,
        metadata,
      })
    }
  }, [checked, dday])

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
        <Label>SUBSCRIPTION EXPIRY NOTIFIER</Label>
      </div>
      <CollapsibleContent className="flex flex-col gap-3">
        <Label>H- Kirim Notifikasi</Label>
        <Select value={dday} onValueChange={handleSelectDday}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih h- kirim notifikasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">h-1 Hari</SelectItem>
            <SelectItem value="2">h-2 Hari</SelectItem>
            <SelectItem value="3">h-3 Hari</SelectItem>
            <SelectItem value="4">h-4 Hari</SelectItem>
            <SelectItem value="5">h-5 Hari</SelectItem>
            <SelectItem value="6">h-6 Hari</SelectItem>
            <SelectItem value="7">h-7 Hari</SelectItem>
          </SelectContent>
        </Select>
      </CollapsibleContent>
    </Collapsible>
  )
}
