import type { ProductVariant } from '@/dashboard/services/product.service'
import { useState } from 'react'
import { ProductVariantSelect } from '@/dashboard/components/inputs/select/product-variant.select'
import { Label } from '@/dashboard/components/ui/label'
import { useFieldContext } from '@/dashboard/hooks/form.hook'
import { ErrorDisplay } from '../error-display'

export function ProductVariantSelectField({
  label,
  initialData,
  disabled,
}: {
  label: string
  initialData?: ProductVariant
  disabled?: boolean
}) {
  const field = useFieldContext<string>()
  const [selected, setSelected] = useState<ProductVariant | undefined>(
    initialData,
  )
  const handleSelected = (productVariant?: ProductVariant) => {
    if (disabled)
      return
    setSelected(productVariant)
    field.handleChange(productVariant?.id ?? '')
  }
  return (
    <div className="grid gap-3">
      <Label>{label}</Label>
      <ProductVariantSelect
        selectedItem={selected}
        onSelect={handleSelected}
        disabled={disabled}
      />
      <ErrorDisplay errors={field.state.meta.errors} />
    </div>
  )
}
