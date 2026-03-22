import { Checkbox } from '@/dashboard/components/ui/checkbox'
import { Label } from '@/dashboard/components/ui/label'
import { useFieldContext } from '@/dashboard/hooks/form.hook'
import { ErrorDisplay } from '../error-display'

export function BooleanCheckboxField({ label }: { label: string }) {
  const field = useFieldContext<boolean>()
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3">
        <Checkbox
          id={field.name}
          checked={field.state.value}
          onCheckedChange={(checked) => {
            field.handleChange(!!checked)
          }}
        />
        <Label htmlFor={field.name}>{label}</Label>
      </div>
      <ErrorDisplay errors={field.state.meta.errors} />
    </div>
  )
}
