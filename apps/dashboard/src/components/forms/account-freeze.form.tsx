import type { TimeUnit } from '@/dashboard/lib/time-converter.util'
import { z } from 'zod'
import { useAppForm } from '@/dashboard/hooks/form.hook'
import { convertTimeUnit } from '@/dashboard/lib/time-converter.util'
import { DurationFieldGroup } from './common/fields/duration-field-group'
import { TimeUnitEnum } from './common/schemas/time-unit.schema'

export const AccountFreezeFormSchema = z.object({
  duration: z.string().nonempty(),
  duration_unit: TimeUnitEnum,
})

export interface AccountFreezeFormSubmitData {
  duration: number
}

export function AccountFreezeForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (values: AccountFreezeFormSubmitData) => void
  isPending: boolean
}) {
  const form = useAppForm({
    validators: { onSubmit: AccountFreezeFormSchema },
    defaultValues: {
      duration: '',
      duration_unit: 'minute',
    },
    onSubmit: ({ value }) => {
      const duration = convertTimeUnit(
        Number.parseInt(value.duration),
        value.duration_unit as TimeUnit,
        'millisecond',
      )
      onSubmit({ duration })
    },
  })

  return (
    <form.AppForm>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <div className="flex flex-col gap-6">
          <DurationFieldGroup
            form={form}
            fields={{
              duration: 'duration',
              unit: 'duration_unit',
            }}
            label="Durasi Freeze"
            name="duration"
            placeholder="masukkan durasi freeze..."
          />
          <form.SubscribeButton isPending={isPending} label="Freeze" />
        </div>
      </form>
    </form.AppForm>
  )
}
