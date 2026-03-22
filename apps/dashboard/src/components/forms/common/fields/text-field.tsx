import type React from 'react'
import { useFieldContext } from '@/dashboard/hooks/form.hook'
import { TextInput } from '../inputs/text-input'

export function TextField({
  label,
  placeholder,
  type,
}: {
  label: string
  placeholder?: string
  type?: React.HTMLInputTypeAttribute
}) {
  const field = useFieldContext<string>()
  return (
    <TextInput
      label={label}
      id={field.name}
      name={field.name}
      type={type || 'text'}
      value={field.state.value}
      onBlur={field.handleBlur}
      onChange={e => field.handleChange(e.target.value)}
      placeholder={placeholder}
      errors={field.state.meta.errors}
    />
  )
}
