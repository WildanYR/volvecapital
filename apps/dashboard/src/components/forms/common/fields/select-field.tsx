import { useFieldContext } from '@/dashboard/hooks/form.hook'
import { SelectInput } from '../inputs/select-input'

export function SelectField({
  label,
  placeholder,
  selectItems,
}: {
  label: string
  selectItems: Array<{
    title: string
    value: string
  }>
  placeholder?: string
}) {
  const field = useFieldContext<string>()
  return (
    <SelectInput
      name={field.name}
      label={label}
      selectItems={selectItems}
      placeholder={placeholder}
      value={field.state.value}
      errors={field.state.meta.errors}
      onSelected={field.handleChange}
    />
  )
}
