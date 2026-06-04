import type { ComponentProps } from 'react'
import { Button } from '@/dashboard/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/dashboard/components/ui/tooltip'
import { usePermission } from '@/dashboard/lib/permission'

interface ProtectedButtonProps extends ComponentProps<typeof Button> {
  permission: string
  tooltipMessage?: string
}

/**
 * A Button that is automatically disabled and grayed out if the user
 * does not have the required permission. Shows a tooltip on hover.
 *
 * @example
 * <ProtectedButton permission="product.delete" onClick={handleDelete}>
 *   Hapus
 * </ProtectedButton>
 */
export function ProtectedButton({
  permission,
  tooltipMessage = 'Anda tidak memiliki akses',
  children,
  ...props
}: ProtectedButtonProps) {
  const hasPermission = usePermission(permission)

  if (hasPermission) {
    return <Button {...props}>{children}</Button>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              {...props}
              disabled
              className={`${props.className ?? ''} opacity-50 cursor-not-allowed`}
              onClick={undefined}
            >
              {children}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
