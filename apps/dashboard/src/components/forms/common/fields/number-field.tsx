import { useFieldContext } from '@/dashboard/hooks/form.hook'
import { TextInput } from '../inputs/text-input'

export function NumberField({
  label,
  placeholder,
}: {
  label: string
  placeholder?: string
}) {
  const field = useFieldContext<number>()
  return (
    <TextInput
      label={label}
      id={field.name}
      name={field.name}
      type="number"
      value={field.state.value}
      onBlur={field.handleBlur}
      onChange={e => field.handleChange(Number(e.target.value))}
      placeholder={placeholder}
      errors={field.state.meta.errors}
    />
  )
}
