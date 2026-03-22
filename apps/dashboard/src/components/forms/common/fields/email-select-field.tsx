import type { Email } from '@/dashboard/services/email.service'
import { useState } from 'react'
import { EmailSelect } from '@/dashboard/components/inputs/select/email.select'
import { Label } from '@/dashboard/components/ui/label'
import { useFieldContext } from '@/dashboard/hooks/form.hook'
import { ErrorDisplay } from '../error-display'

export function EmailSelectField({
  label,
  initialData,
}: {
  label: string
  initialData?: Email
}) {
  const field = useFieldContext<string>()
  const [selected, setSelected] = useState<Email | undefined>(initialData)
  const handleSelected = (email?: Email) => {
    setSelected(email)
    field.handleChange(email?.id ?? '')
  }
  return (
    <div className="grid gap-3">
      <Label>{label}</Label>
      <EmailSelect selectedItem={selected} onSelect={handleSelected} />
      <ErrorDisplay errors={field.state.meta.errors} />
    </div>
  )
}
