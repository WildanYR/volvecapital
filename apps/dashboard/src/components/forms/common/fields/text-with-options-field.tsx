import type { HTMLInputTypeAttribute } from 'react'
import { useFieldContext } from '@/dashboard/hooks/form.hook'
import { TextInputOptions } from '../inputs/text-input-options'

export function TextWithOptions({
  id,
  itemStorageName,
  label,
  placeholder,
  type,
}: {
  id: string
  itemStorageName: string
  label: string
  placeholder: string
  type?: HTMLInputTypeAttribute
}) {
  const field = useFieldContext<string>()
  return (
    <TextInputOptions
      id={id}
      itemStorageName={itemStorageName}
      label={label}
      name={field.name}
      type={type || 'text'}
      value={field.state.value}
      onChange={(v) => {
        field.handleChange(v)
      }}
      placeholder={placeholder}
      errors={field.state.meta.errors}
    />
  )
}
