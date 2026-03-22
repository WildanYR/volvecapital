import { Label } from '@/dashboard/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/dashboard/components/ui/select'
import { ErrorDisplay } from '../error-display'

export function SelectInput({
  name,
  label,
  placeholder,
  selectItems,
  value,
  errors,
  onSelected,
}: {
  name: string
  label: string
  selectItems: Array<{
    title: string
    value: string
  }>
  placeholder?: string
  value?: string
  errors?: Array<any>
  onSelected: (value: string) => void
}) {
  return (
    <div className="grid gap-3">
      <Label htmlFor={name}>{label}</Label>
      <Select name={name} value={value} onValueChange={onSelected}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {selectItems.map((item, i) => (
            <SelectItem key={`${name}-select-${i}`} value={item.value}>
              {item.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ErrorDisplay errors={errors} />
    </div>
  )
}
