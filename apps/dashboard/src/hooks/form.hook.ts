import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import { AccountModifierField } from '@/dashboard/components/forms/common/fields/account-modifier-field'
import { BooleanCheckboxField } from '@/dashboard/components/forms/common/fields/boolean-checkbox-field'
import { DatePickerField } from '@/dashboard/components/forms/common/fields/date-picker-field'
import { EmailSelectField } from '@/dashboard/components/forms/common/fields/email-select-field'
import { ProductVariantSelectField } from '@/dashboard/components/forms/common/fields/product-variant-select-field'
import { SelecField } from '@/dashboard/components/forms/common/fields/select-field'
import { TextField } from '@/dashboard/components/forms/common/fields/text-field'
import { TextWithOptions } from '@/dashboard/components/forms/common/fields/text-with-options-field'
import { TextareaField } from '@/dashboard/components/forms/common/fields/textarea-field'
import { SubscribeButton } from '@/dashboard/components/forms/common/form-components/subscribe-button'

export const { fieldContext, useFieldContext, formContext, useFormContext }
  = createFormHookContexts()

export const { useAppForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    TextWithOptions,
    TextareaField,
    DatePickerField,
    BooleanCheckboxField,
    SelecField,
    EmailSelectField,
    ProductVariantSelectField,
    AccountModifierField,
  },
  formComponents: {
    SubscribeButton,
  },
})
