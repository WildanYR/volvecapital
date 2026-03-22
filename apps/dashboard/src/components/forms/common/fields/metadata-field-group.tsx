import { Trash2 } from 'lucide-react'
import { Button } from '@/dashboard/components/ui/button'
import { withFieldGroup } from '@/dashboard/hooks/form.hook'
import { cn } from '@/dashboard/lib/utils'

interface MetadataFieldGroupValue {
  key: string
  value: string
}

export const MetadataFieldGroup = withFieldGroup({
  defaultValues: {
    key: '',
    value: '',
  } as MetadataFieldGroupValue,
  props: { className: '', label: '', onDelete: () => {} },
  render: function Render({ group, className, label, onDelete }) {
    return (
      <div className={cn('relative flex flex-col gap-6', className)}>
        <p className="text-center font-medium">{label}</p>
        <Button
          type="button"
          variant="outline"
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 absolute top-2 right-2"
        >
          <span>
            <Trash2 />
          </span>
        </Button>
        <group.AppField
          name="key"
          children={field => (
            <field.TextField
              label="Key"
              placeholder="Masukkan key dari metadata..."
            />
          )}
        />
        <group.AppField
          name="value"
          children={field => (
            <field.TextField
              label="Value"
              placeholder="Masukkan value dari metadata..."
            />
          )}
        />
      </div>
    )
  },
})
