import { LoaderCircle } from 'lucide-react'
import { Button } from '@/dashboard/components/ui/button'
import { useFormContext } from '@/dashboard/hooks/form.hook'

export function SubscribeButton({
  isPending,
  label,
}: {
  isPending?: boolean
  label?: string
}) {
  const form = useFormContext()
  return (
    <form.Subscribe
      selector={state => [state.canSubmit, state.isSubmitting]}
      children={([canSubmit, isSubmitting]) => (
        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={!canSubmit || isPending}
        >
          {isSubmitting
            || (isPending && (
              <span>
                <LoaderCircle className="animate-spin" />
              </span>
            ))}
          {' '}
          {label ?? 'Submit'}
        </Button>
      )}
    />
  )
}
