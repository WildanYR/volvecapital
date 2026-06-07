import type { ModifierObject } from '../types/modifier.type'
import type { MetadataObject } from '@/dashboard/lib/metadata-converter'
import { useEffect, useState } from 'react'
import { Checkbox } from '@/dashboard/components/ui/checkbox'
import { Collapsible, CollapsibleContent } from '@/dashboard/components/ui/collapsible'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/dashboard/components/ui/select'
import { SUBS_END_DISABLE_ACCOUNT } from '@/dashboard/constants/modifier.consf'

interface DefaultValue {
  checked?: boolean
  offset?: string
  offset_unit?: string
}

export function SubsEndDisableAccountModifier({
  defaultValue,
  onChange,
}: {
  defaultValue?: DefaultValue
  onChange: (id: string, accountModifier: ModifierObject | null) => void
}) {
  const [checked, setChecked] = useState<boolean>(!!defaultValue?.checked)
  const [offset, setOffset] = useState<string>(defaultValue?.offset || '0')
  const [offsetUnit, setOffsetUnit] = useState<string>(
    defaultValue?.offset_unit || 'day',
  )

  const handleCheckChange = (value: boolean) => {
    setChecked(value)
  }

  const handleOffsetChange = (value: string) => {
    setOffset(value)
  }

  const handleOffsetUnitChange = (value: string) => {
    setOffsetUnit(value)
  }

  useEffect(() => {
    if (!checked) {
      onChange(SUBS_END_DISABLE_ACCOUNT, null)
    }
    else {
      const metadata: Array<MetadataObject> = [
        { key: 'offset', value: offset },
        { key: 'offset_unit', value: offsetUnit },
      ]
      onChange(SUBS_END_DISABLE_ACCOUNT, {
        modifier_id: SUBS_END_DISABLE_ACCOUNT,
        metadata,
      })
    }
  }, [checked, offset, offsetUnit, onChange])

  return (
    <Collapsible
      open={checked}
      onOpenChange={handleCheckChange}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center gap-3">
        <Checkbox
          id="subs-end-disable-checkbox"
          checked={checked}
          onCheckedChange={(value) => {
            handleCheckChange(value as boolean)
          }}
        />
        <Label htmlFor="subs-end-disable-checkbox" className="cursor-pointer">
          SUBS END DISABLE ACCOUNT
        </Label>
      </div>
      <CollapsibleContent className="flex flex-col gap-3">
        <Label htmlFor="subs-end-disable-offset">Offset Waktu Sebelum Expiry</Label>
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-3">
            <Input
              id="subs-end-disable-offset"
              type="number"
              value={offset}
              onChange={e => handleOffsetChange(e.target.value)}
              placeholder="Masukkan offset waktu..."
            />
          </div>
          <Select value={offsetUnit} onValueChange={handleOffsetUnitChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Satuan waktu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="millisecond">milidetik</SelectItem>
              <SelectItem value="second">detik</SelectItem>
              <SelectItem value="minute">menit</SelectItem>
              <SelectItem value="hour">jam</SelectItem>
              <SelectItem value="day">hari</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
