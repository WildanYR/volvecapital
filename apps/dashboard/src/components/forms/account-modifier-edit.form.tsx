import type { MetadataFormObject } from './common/schemas/metadata-form.schema'
import type { AccountModifier } from '@/dashboard/services/account.service'
import { z } from 'zod'
import { useAppForm } from '@/dashboard/hooks/form.hook'
import { AccountModifierFormSchema } from './common/schemas/account-modifier-form.schema'

export const AccountModifierEditFormSchema = z.object({
  modifier: z.array(AccountModifierFormSchema),
})

export type AccountModifierEditFormData = z.infer<
  typeof AccountModifierEditFormSchema
>
interface ModifierEditData {
  action: 'ADD' | 'UPDATE' | 'REMOVE'
  modifier_id: string
  metadata?: Array<MetadataFormObject>
}
export interface AccountModifierEditFormSubmitData {
  modifier: Array<ModifierEditData>
}

export function AccountModifierEditForm({
  onSubmit,
  isPending,
  initialData,
  submitButtonText,
}: {
  onSubmit: (values: AccountModifierEditFormSubmitData) => void
  isPending: boolean
  initialData?: Array<AccountModifier>
  submitButtonText?: string
}) {
  const form = useAppForm({
    validators: { onSubmit: AccountModifierEditFormSchema },
    defaultValues: {
      modifier: initialData?.length ? [...initialData] : [],
    } as AccountModifierEditFormData,
    onSubmit: ({ value }) => {
      const updateModifiers: Array<ModifierEditData> = []

      if (initialData) {
        const newMap = new Map(value.modifier.map(m => [m.modifier_id, m]))
        const initialMap = new Map(initialData.map(m => [m.modifier_id, m]))

        for (const nValue of value.modifier) {
          if (initialMap.has(nValue.modifier_id)) {
            updateModifiers.push({
              action: 'UPDATE',
              modifier_id: nValue.modifier_id,
              metadata: nValue.metadata,
            })
          }
          else {
            updateModifiers.push({
              action: 'ADD',
              modifier_id: nValue.modifier_id,
              metadata: nValue.metadata,
            })
          }
        }

        for (const iValue of initialData) {
          if (!newMap.has(iValue.modifier_id)) {
            updateModifiers.push({
              action: 'REMOVE',
              modifier_id: iValue.modifier_id,
            })
          }
        }
      }
      else {
        const data: Array<ModifierEditData> = value.modifier.map(mod => ({
          modifier_id: mod.modifier_id,
          metadata: mod.metadata,
          action: 'ADD',
        }))
        updateModifiers.push(...data)
      }

      onSubmit({ modifier: updateModifiers })
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
        <div className="flex flex-col gap-6 w-full">
          <form.AppField
            name="modifier"
            children={field => <field.AccountModifierField />}
          />
          <form.SubscribeButton
            isPending={isPending}
            label={submitButtonText}
          />
        </div>
      </form>
    </form.AppForm>
  )
}
