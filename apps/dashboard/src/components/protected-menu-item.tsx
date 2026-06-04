import type { ComponentProps, ReactNode } from 'react'
import { DropdownMenuItem } from '@/dashboard/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/dashboard/components/ui/tooltip'
import { usePermission } from '@/dashboard/lib/permission'

interface ProtectedMenuItemProps extends ComponentProps<typeof DropdownMenuItem> {
  permission: string
  tooltipMessage?: string
  children: ReactNode
}

/**
 * A DropdownMenuItem that is automatically disabled with a tooltip
 * if the user does not have the required permission.
 *
 * @example
 * <ProtectedMenuItem permission="product.edit" onSelect={handleEdit}>
 *   <SquarePen /> Update
 * </ProtectedMenuItem>
 */
export function ProtectedMenuItem({
  permission,
  tooltipMessage = 'Anda tidak memiliki akses',
  children,
  ...props
}: ProtectedMenuItemProps) {
  const hasPermission = usePermission(permission)

  if (hasPermission) {
    return <DropdownMenuItem {...props}>{children}</DropdownMenuItem>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuItem
            {...props}
            disabled
            className={`${props.className ?? ''} opacity-50 cursor-not-allowed`}
            onSelect={e => e.preventDefault()}
          >
            {children}
          </DropdownMenuItem>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
