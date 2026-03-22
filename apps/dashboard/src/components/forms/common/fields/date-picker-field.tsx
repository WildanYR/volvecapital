import { ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/dashboard/components/ui/button'
import { Calendar } from '@/dashboard/components/ui/calendar'
import { Label } from '@/dashboard/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/dashboard/components/ui/popover'
import { useFieldContext } from '@/dashboard/hooks/form.hook'
import { formatDateIdStandard } from '@/dashboard/lib/time-converter.util'
import { ErrorDisplay } from '../error-display'

export function DatePickerField({ label }: { label: string }) {
  const field = useFieldContext<Date | undefined>()
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false)
  return (
    <div className="grid gap-3">
      <Label>{label}</Label>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className="justify-between font-normal"
          >
            {field.state.value
              ? formatDateIdStandard(field.state.value)
              : 'Pilih Tanggal'}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={field.state.value as Date}
            captionLayout="dropdown"
            onSelect={(date: Date) => {
              field.handleChange(date)
              setPopoverOpen(false)
            }}
            required
          />
        </PopoverContent>
      </Popover>
      <ErrorDisplay errors={field.state.meta.errors} />
    </div>
  )
}
