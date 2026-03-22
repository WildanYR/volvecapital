import type { DateRange, DayPickerProps } from 'react-day-picker'
import { ChevronDownIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/dashboard/components/ui/button'
import { Calendar } from '@/dashboard/components/ui/calendar'
import { Label } from '@/dashboard/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/dashboard/components/ui/popover'
import { formatDateIdStandard } from '@/dashboard/lib/time-converter.util'
import { ErrorDisplay } from '../error-display'

type DatePickerProps = DayPickerProps & {
  label: string
  closeAfterSelect?: boolean
  value?: Date | DateRange
  placeholder?: string
  errors?: any
}

export function DatePickerInput({
  label,
  errors,
  value,
  placeholder,
  ...attributes
}: DatePickerProps) {
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false)
  const buttonPlaceholder = useMemo(() => {
    if (value) {
      return value instanceof Date
        ? formatDateIdStandard(value)
        : `${formatDateIdStandard(value.from, true)} - ${formatDateIdStandard(value.to, true)}`
    }
    else {
      return placeholder || 'Pilih Tanggal'
    }
  }, [value])

  return (
    <div className="grid gap-3">
      <Label>{label}</Label>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className="justify-between font-normal gap-2"
          >
            {buttonPlaceholder}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar {...attributes} />
        </PopoverContent>
      </Popover>
      <ErrorDisplay errors={errors} />
    </div>
  )
}
